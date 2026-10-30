---
author: Alex
pubDatetime: 2026-10-30T13:00:00+09:00
title: 从 TTY 到 Session：理解 Linux 终端、进程组与前台后台
postSlug: ""
tags:
  - linux
  - shell
featured: false
draft: false
ogImage: ""
description: TTY 与 PTY、Terminal 与 Shell、Process / Process Group / Session，以及 Ctrl+C、command &、后台进程和 Daemon 分别处在哪一层。
---

TTY 和 PTY 是什么？Terminal 和 Shell 有什么区别？按下 `Ctrl+C` 为什么能终止整条管道？`command &` 和 Daemon 又是不是一回事？

这篇文章按一条主线展开：**终端设备 → 进程组织 → 前台后台 → 后台进程与 Daemon 的边界**。Docker 里的容器生命周期与「前台运行模式」，见 [Docker 基础（二）](/blog/docker-基础-二-容器生命周期-pid-1-与前台运行模式)。

---

## 1. TTY：终端究竟是什么？

打开终端输入 `ls -la`，屏幕上出现目录列表——这一步其实牵涉多个不同角色。

### 1.1 Terminal、Shell 与 TTY

| 组件 | 职责 |
| :--- | :--- |
| Terminal Emulator | 终端模拟器，接收键盘输入、显示文字 |
| TTY | 提供终端设备接口 |
| Shell | 解释命令、启动程序、管理作业 |
| Process | 真正执行命令的进程 |

它们不是同一个东西。macOS 上的 Terminal.app、Linux 桌面上的 GNOME Terminal，本质都是 Terminal Emulator；Bash、Zsh 才是 Shell。

Terminal Emulator 并不理解 `ls` 是什么命令，它只是把键盘输入交给终端设备，再把程序输出画出来。Shell 才解析 `ls -la`，并创建相应进程去执行。

### 1.2 TTY 是什么？

TTY 最初是 Teletypewriter（电传打字机）的缩写。早期计算机靠电传打字机和用户交互，后来这个名字成了 Unix/Linux 里终端设备接口的统称。

现代桌面环境里，我们通常用的是 PTY（Pseudo Terminal，伪终端）。PTY 分两端：

- PTY Master
- PTY Slave

```text
Terminal Emulator
       |
       | 读写
       v
  PTY Master
       |
       | 内核提供的终端接口
       v
  PTY Slave
       |
       v
    Shell
       |
       v
   Commands
```

Terminal Emulator 操作 Master；Shell 和其他进程通常通过 Slave 做终端输入输出。执行 `tty`，可能看到 `/dev/pts/3`——说明当前 Shell 挂在这个伪终端设备上。

### 1.3 TTY 不只是输入输出

TTY 还有一项关键职责：**管理终端相关的作业控制（Job Control）。**

例如：

- 哪个进程组拥有终端的前台交互权？
- 按下 `Ctrl+C` 时，SIGINT 该发给谁？
- 后台进程尝试读终端输入时，该怎么处理？

这些机制正是 Process Group 与 Session 的基础。

> **核心结论：** Terminal Emulator 负责显示与输入采集；TTY/PTY 是内核侧的终端设备与作业控制接口；Shell 才负责解析命令和管理作业。

---

## 2. Process、Process Group 与 Session

理解作业控制，需要先分清三个不同层次的组织关系。

### 2.1 Process：进程

进程是程序执行的基本单位，每个进程有自己的 PID。`ps -ef` 里常见：

```text
UID    PID   PPID  CMD
root     1      0  /sbin/init
user  1200   1100  /bin/bash
user  1300   1200  sleep 1000
```

- PID：当前进程 ID
- PPID：父进程 ID

进程通过父子关系形成进程树，例如 `bash (1200)` 下面挂着 `sleep 1000 (1300)`。

但要注意：**父子关系与进程组关系是两套独立的关系。** 父进程是谁，并不能决定它属于哪个进程组。

### 2.2 Process Group：进程组

Process Group 是一组进程的集合。每个进程都属于一个进程组，并有一个 PGID（Process Group ID）。

它最重要的作用是：让 Shell 把一组相关进程当作一个整体做作业控制。

```bash
cat file.txt | grep hello | sort
```

Shell 通常会把这三个进程放进同一个 Process Group：

```text
Process Group PGID=2000

  cat file.txt   PID=2000
  grep hello     PID=2001
  sort           PID=2002
```

这样就能对整条管道统一发信号，而不必分别操作三个进程：

```bash
kill -TERM -2000
```

负数 PID 表示向 PGID 为 2000 的整个进程组发送 SIGTERM。

进程组有组长（Process Group Leader），通常 `PGID = Process Group Leader's PID`。组长退出后，只要还有其他成员，进程组仍可继续存在。

### 2.3 Session：会话

Session 是比 Process Group 更高一层的组织单位，一个 Session 可以包含多个 Process Group：

```text
Session SID=1000
  |
  +-- Process Group PGID=1100
  |     +-- bash
  |
  +-- Process Group PGID=1200
  |     +-- cat
  |     +-- grep
  |     +-- sort
  |
  +-- Process Group PGID=1300
        +-- sleep
```

约束可以记成：

1. **每个进程**只能属于一个 Process Group、一个 Session。
2. **一个 Process Group**只能属于一个 Session。
3. **一个 Session**可以包含多个 Process Group。

Session Leader 的 PID 通常等于 SID。相关系统调用包括：

| 调用 | 作用 |
| :--- | :--- |
| `setsid()` | 创建新 Session，调用进程成为 Session Leader |
| `setpgid()` | 设置进程所属的 Process Group |
| `getsid()` | 查询 Session ID |
| `getpgrp()` | 查询进程组 ID |

### 2.4 三者的关系

| 概念 | 标识符 | 主要作用 |
| :--- | :--- | :--- |
| Process | PID | 标识一个进程 |
| Process Group | PGID | 把相关进程组织起来，便于统一作业控制 |
| Session | SID | 把多个进程组组织起来，管理会话及其终端关系 |

> **核心结论：** 父子关系、进程组关系、Session 关系彼此独立，描述的是进程之间不同维度的组织结构。

---

## 3. Foreground 与 Background

理解了 Process Group 和 Session，就可以解释 Shell 里的前台和后台。

### 3.1 前台不是单个进程的属性

执行管道时，Shell 通常把整条管道放进同一个 Process Group，再把这个进程组设为当前终端的前台进程组。

**结论：前台和后台是相对于控制终端而言的，是 Process Group 的状态，不是某个进程固有的属性。**

一个终端同一时刻只能有一个 Foreground Process Group。终端设备会维护 TPGID（Terminal Process Group ID），标识当前前台进程组：

```text
Terminal: /dev/pts/3
  |
  +-- TPGID = 1200
          |
          +-- Process Group PGID=1200
                 +-- cat
                 +-- grep
                 +-- sort
```

当前 PGID 等于终端的 TPGID，就意味着这个进程组是该终端的前台进程组。

### 3.2 前台进程组能做什么？

前台进程组可以正常读取终端输入。例如执行 `cat` 后等待用户输入——因为它属于前台进程组。

这时按下 `Ctrl+C`，终端会生成 SIGINT，发给前台进程组；组内进程通常都会收到。所以对管道按 `Ctrl+C`，往往能终止整条管道，而不只是其中一个进程。

同样，`Ctrl+Z` 通常会让终端生成 SIGTSTP，发给前台进程组，使其暂停。

注意：终端的行规程（line discipline）负责处理这些特殊字符和信号生成；它们并不是简单地把 `Ctrl+C` 当作普通字符交给 Shell。

### 3.3 后台进程组

```bash
sleep 1000 &
```

Shell 会把 `sleep` 放到后台，例如：

```text
Session SID=1000
  |
  +-- Process Group PGID=1100
  |      +-- bash
  |
  +-- Process Group PGID=1200
         +-- sleep 1000
```

此时 Bash 所在进程组是前台，`sleep` 所在进程组是后台。可用 `jobs -l` 查看作业，用 `fg %1` 切到前台，用 `bg %1` 让已暂停的作业在后台继续。

`bg` 主要用于恢复已暂停的作业，并不是把任意正在前台跑的进程自动变成后台。

### 3.4 后台进程能不能访问终端？

后台进程并不是完全不能用终端，而是受作业控制规则约束。

| 场景 | 行为 |
| :--- | :--- |
| 后台进程组尝试从控制终端读 | 通常收到 `SIGTTIN`，默认会暂停 |
| 后台进程向终端写 | 默认通常仍可写；若启用 `stty tostop`，写时也可能收到 `SIGTTOU` |

因此，前台和后台的区别不只是「输出显不显示」，而是与终端交互权限有关。

### 3.5 如何查看这些关系？

```bash
ps -o pid,ppid,pgid,sid,tpgid,stat,tty,cmd
```

| 字段 | 含义 |
| :--- | :--- |
| PID | 进程 ID |
| PPID | 父进程 ID |
| PGID | 进程组 ID |
| SID | Session ID |
| TPGID | 终端当前前台进程组 ID |
| STAT | 进程状态 |
| TTY | 关联的终端 |

示例：

```text
PID   PPID  PGID  SID   TPGID  STAT  TTY
1200  1100  1200  1200  1200   Ss    pts/3
1300  1200  1300  1200  1200   S     pts/3
```

两个进程同属一个 Session、不同 Process Group；TPGID 为 1200，因此 PGID 1200 的进程组是前台。

---

## 4. 后台进程不等于 Daemon

这是另一个容易混淆的地方。

### 4.1 后台进程是什么？

后台进程主要是 Shell Job Control 概念。例如 `sleep 1000 &` 仍然可能：

- 属于当前 Shell 的 Session
- 关联当前终端
- 受终端关闭产生的 SIGHUP 影响
- 因读取终端输入而收到 SIGTTIN

所以，后台运行并不意味着已经脱离当前终端。

`nohup command &` 可以让程序忽略 SIGHUP，降低终端关闭时被终止的风险；但 `nohup` 本身不会自动创建新 Session，也不等于完整的 daemonization。

### 4.2 Daemon 是什么？

Daemon 通常译为守护进程。它是一种长期运行的服务进程模式，而不是内核定义的一种独立进程类型。

典型特征包括：长期运行、不依赖用户当前终端、通常没有 controlling TTY、通常由系统服务管理器管理。例如 SSH、Nginx、数据库、定时任务服务。

### 4.3 传统 Daemonization

传统 Unix/Linux 程序可能这样 daemonize：

```text
启动进程
   |
   v
fork()
   |
   v
父进程退出
   |
   v
子进程 setsid()
   |
   v
创建新的 Session
   |
   v
再次 fork()
   |
   v
父进程退出
   |
   v
最终 Daemon 进程
```

之后通常还会：切换工作目录、设置 umask、关闭不需要的文件描述符、把标准输入输出错误重定向到 `/dev/null` 或日志文件。

关键步骤是 `setsid()`：创建新 Session，让进程脱离原来的控制终端关系。再次 fork，通常是为了让最终进程不再是 Session Leader，从而避免重新获得控制终端。

### 4.4 现代 Linux 不一定需要自行 Daemonize

很多服务由 systemd 管理，例如 `systemctl start nginx`。现代服务通常可以直接以前台方式运行，由 systemd 管理生命周期和标准输出。

> **核心结论：** Daemon 是服务运行模式的概念，不意味着程序必须自己 fork 到后台；`command &` 更不是 Daemon。

---

## 5. 用场景串起来

### 5.1 场景 A：前台命令

```bash
sleep 1000
```

```text
Terminal Emulator
       |
       v
    PTY Master
       |
       v
    PTY Slave
       |
       v
     Bash
       |
       v
  Process Group
       |
       +-- sleep 1000
```

Shell 启动进程；`sleep` 通常属于当前前台进程组；`Ctrl+C` 时终端向前台进程组发 SIGINT。

### 5.2 场景 B：后台命令

```bash
sleep 1000 &
```

```text
Session
   |
   +-- Foreground Process Group
   |      +-- bash
   |
   +-- Background Process Group
          +-- sleep 1000
```

`sleep` 仍属于当前 Session，仍可能关联当前 TTY；它只是后台作业，并不因此成为 Daemon。

### 5.3 场景 C：传统 Daemon

Daemon 通过 `setsid()` 等方式创建新 Session，脱离原来的控制终端关系：

```text
Session B
   |
   +-- Daemon
```

它通常没有 controlling TTY，不依赖用户当前终端，可以长期运行。

---

## 6. 总结

| 关卡 | 要点 |
| :--- | :--- |
| 终端角色 | Emulator 显示与采集；TTY/PTY 是设备与作业控制接口；Shell 解析命令、管作业 |
| 进程组织 | Process / Process Group / Session 是三层独立结构 |
| 前台后台 | 相对控制终端而言，状态落在 Process Group 上，看 TPGID |
| Ctrl+C / Ctrl+Z | 通常向前台进程组发 SIGINT / SIGTSTP |
| `command &` | Shell 把作业放后台，未必脱离终端 |
| Daemon | 长期服务模式；传统路径靠 `setsid()` 等脱离控制终端 |

日常开发再记两条：

1. 想判断谁是「前台」，先看终端的 TPGID，而不是某个进程有没有 `&`。
2. 想判断是不是 Daemon，看它是否脱离控制终端、作为长期服务运行，而不是看它有没有在 Shell 里加 `&`。

下一篇会把这套模型接到 Docker：容器为什么跟着主进程退出、为什么推荐 Exec Form、以及文档里的 foreground mode 和 Linux 前台进程组为什么不是一回事——见 [Docker 基础（二）：容器生命周期、PID 1 与前台运行模式](/blog/docker-基础-二-容器生命周期-pid-1-与前台运行模式)。
