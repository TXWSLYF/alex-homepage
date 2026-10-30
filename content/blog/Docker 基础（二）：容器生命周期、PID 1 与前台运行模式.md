---
author: Alex
pubDatetime: 2026-10-30T13:30:00+09:00
title: Docker 基础（二）：容器生命周期、PID 1 与前台运行模式
postSlug: ""
tags:
  - docker
  - linux
featured: false
draft: false
ogImage: ""
description: 容器为什么跟着主进程退出，docker stop 信号发给谁，CMD 为何推荐 Exec Form，以及 Docker 文档里的 foreground 和 Linux 前台进程组为什么不是一回事。
---

主进程一退出容器就停？`docker run -d` 是不是在容器里执行了 `command &`？Dockerfile 的 `CMD` 为什么推荐 Exec Form？文档里写的 foreground mode，和终端里的前台进程是一回事吗？

这篇文章按一条主线展开：**容器主进程 → PID 1 与信号 → CMD 形态 → 非 daemonize 启动 → 两套 Foreground 对照**。Linux 侧的 TTY、Session、进程组与 Shell 前台后台，见 [从 TTY 到 Session](/blog/从-tty-到-session-理解-linux-终端-进程组与前台后台)。

这是 Docker 基础的第二篇，承接 [第一篇](/blog/docker-基础-一-镜像分层-workdir-与多阶段构建) 对镜像的讨论，把运行时的进程生命周期说清楚。

---

## 1. 容器生命周期与主进程

Docker 容器不是一台拥有独立内核的虚拟机。它和宿主机共享 Linux Kernel，主要靠 Namespace 隔离视图、靠 Cgroups 限制资源。其中 PID Namespace 会让容器拥有独立的进程 ID 视角。

### 1.1 宿主机与容器里的 PID

```text
宿主机 PID Namespace

PID 1       systemd
PID 1000    dockerd
PID 2000    container process
```

而在容器内部：

```text
容器 PID Namespace

PID 1       node server.js
PID 2       worker
PID 3       nginx
```

容器内的 PID 1，在宿主机上对应的是另一个 PID。

### 1.2 主进程退出，容器就停止

Docker 容器的运行生命周期通常由配置的主进程决定。

```bash
docker run -d ubuntu sleep 1000
```

容器启动后大致是：

```text
Container
   |
   +-- PID 1: sleep 1000
```

`sleep 1000` 执行完毕并退出后，容器就会停止。Docker 管理的是**主进程的生命周期**，而不是简单地判断容器里是否还挂着某个后台进程。

PID 1 退出后，容器 PID Namespace 中剩余的进程也会被内核终止和清理。

> **核心结论：** 容器跟不跟着跑，看主进程还在不在，不看「里面还有没有别的进程在干活」。

### 1.3 `-d` 不等于 Linux 后台进程

```bash
docker run -d ubuntu sleep 1000
```

这里的 `-d` 表示 Docker CLI 使用 Detached Mode：启动容器后，CLI 不再附着在容器的标准输入输出上，而是返回终端。它**并不是**在容器内部执行 `sleep 1000 &`。

| 概念 | 含义 |
| :--- | :--- |
| Linux `command &` | Shell 将作业放入后台 |
| Docker `-d` | Docker CLI 不附着在容器上，启动后返回 |

容器内部的 `sleep` 仍然是容器主进程。CLI 返回了，并不等于它在容器里变成了后台作业。

### 1.4 `-i` 和 `-t`

| 参数 | 含义 |
| :--- | :--- |
| `-i` | 保持容器的标准输入开放 |
| `-t` | 为容器分配一个伪终端（PTY） |

```bash
docker run -it ubuntu bash
```

Docker 会启动交互式 Bash，并分配 PTY。容器内执行 `tty`，通常能看到类似 `/dev/pts/0`。这和 Linux 文章里讲的 PTY 是同一套机制。

### 1.5 `docker run` 与 `docker exec`

#### `docker run`

```bash
docker run -it ubuntu bash
```

若镜像没有覆盖默认入口点，Bash 通常就是容器主进程。执行 `exit` 后 Bash 退出，PID 1 退出，容器也停止。

#### `docker exec`

```bash
docker exec -it myapp bash
```

Docker 在已有容器中额外启动一个 Bash：

```text
Container
   |
   +-- PID 1: node server.js
   |
   +-- PID 20: bash
```

此时 `exit` 只退出新开的 Bash；原来的 Node 仍在跑，容器不会因此停止。

| 命令 | 新进程是否为容器 PID 1 | 退出后容器是否因此停止 |
| :--- | :--- | :--- |
| `docker run ... bash` | 通常是 | 是 |
| `docker exec ... bash` | 否 | 否 |

---

## 2. `docker stop` 向谁发信号？

```bash
docker stop myapp
```

Docker 默认向容器主进程发送 `SIGTERM`，然后等待一段停止宽限期。Linux Docker Engine 默认通常是 10 秒。若主进程在宽限期内没有退出，再发送 `SIGKILL` 强制终止。

```text
docker stop
    |
    v
向容器主进程发送 SIGTERM
    |
    v
等待宽限期
    |
    +---- 主进程正常退出 → 容器停止
    |
    +---- 超时 → 发送 SIGKILL → 容器停止
```

**结论：`docker stop` 默认针对容器主进程发 SIGTERM，并不是默认向容器内整个 Process Group 发 SIGTERM。** 这也是为什么容器里的 PID 1 应该正确处理信号。

---

## 3. 为什么容器里的 PID 1 很特殊？

在普通 Linux 系统中，PID 1 通常是 init 或 systemd，负责收养孤儿进程、回收子进程，避免长期遗留僵尸进程。容器自己的 PID Namespace 也有一个 PID 1，因此同样承担相应职责。

### 3.1 信号处理的特殊性

Linux 对 PID Namespace 中的 PID 1 有特殊处理。若 PID 1 没有为某个信号注册处理函数，内核对某些信号的默认行为与普通进程不同。

这意味着：一个没有正确处理 SIGTERM 的程序，即使收到 Docker 发出的停止信号，也可能无法按预期退出。

### 3.2 为什么有时需要 `--init`？

```bash
docker run --init ...
```

Docker 会在容器中增加一个轻量级 init 进程，主要用于：帮助处理孤儿进程、回收僵尸进程、转发相关信号。

```text
Container
   |
   +-- PID 1: tini
          |
          +-- PID 2: node server.js
                 |
                 +-- worker
```

这样 Node 不再直接作为 PID 1，由轻量级 init 承担 PID 1 的职责。是否需要 `--init`，取决于应用自己的进程管理方式。

---

## 4. Dockerfile CMD：Shell Form 与 Exec Form

这是前面概念在 Docker 里最实际的应用之一。

```dockerfile
CMD node server.js
```

```dockerfile
CMD ["node", "server.js"]
```

两种写法看起来差不多，启动过程并不一样。

### 4.1 Shell Form

`CMD node server.js` 是 Shell Form。在 Linux 容器中，通常相当于：

```bash
/bin/sh -c "node server.js"
```

进程结构大致是：

```text
Container
   |
   +-- PID 1: /bin/sh -c "node server.js"
          |
          +-- PID 2: node server.js
```

Shell 通常成为容器 PID 1，Node 是它的子进程。`docker stop` 默认向 PID 1 发 SIGTERM，但 Shell 并不保证自动把 SIGTERM 转发给 Node。结果可能是：Node 收不到 SIGTERM，无法做 graceful shutdown，最终等到宽限期结束被 SIGKILL。

另外，Shell Form 中 Shell 是否继续存活，取决于 Shell 的执行行为，不能简单认为 Node 退出后容器一定还会继续跑。

### 4.2 Exec Form

推荐写法：

```dockerfile
CMD ["node", "server.js"]
```

它不会额外启动 Shell 来解释命令：

```text
Container
   |
   +-- PID 1: node server.js
```

此时 `docker stop` 的 SIGTERM 直接打到 Node，可以执行清理逻辑：

```javascript
const server = app.listen(3000);

process.on('SIGTERM', () => {
  console.log('Received SIGTERM');

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
```

生产环境中还应按实际情况关闭数据库连接、消息队列消费者、定时任务和其他后台资源。

### 4.3 两种形式对比

| 对比 | Shell Form | Exec Form |
| :--- | :--- | :--- |
| 写法 | `CMD node server.js` | `CMD ["node", "server.js"]` |
| 是否启动 Shell | 通常会 | 不会 |
| Node 是否通常为 PID 1 | 否 | 是 |
| Shell 变量展开 | 支持 | 不支持 |
| 管道和重定向 | 支持 | 不直接支持 |
| 信号传递 | 可能需要额外处理 | 主进程直接接收信号 |
| 推荐程度 | 特定场景使用 | 通常优先推荐 |

### 4.4 需要 Shell 语法时怎么办？

```dockerfile
CMD ["node", "server.js", "$PORT"]
```

这里的 `$PORT` 不会自动展开，而是作为普通字符串传给 Node。若确实需要变量展开，可以写：

```dockerfile
CMD ["sh", "-c", "exec node server.js"]
```

`exec` 会让 Shell 用 Node 进程替换自身，最终仍是：

```text
Container
   |
   +-- PID 1: node server.js
```

如果不需要变量展开、管道或其他 Shell 功能，直接用 Exec Form 更简单。

> **核心结论：** 推荐 Exec Form，让业务进程直接成为 PID 1，才能稳定接到 `docker stop` 的 SIGTERM。

---

## 5. Nginx 为什么需要 `daemon off`？

传统情况下，Nginx 启动后可能自行 daemonize：Master 起来后，真正的服务进程转入后台，启动进程很快退出。这会与 Docker「以主进程生命周期管理容器」的方式冲突。

因此 Docker 中通常使用：

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

`daemon off;` 表示不要自行 daemonize，以前台服务模式运行，让 Nginx Master 持续作为容器主进程。

---

## 6. 两个完全不同的 Foreground

Linux 和 Docker 文档里都常出现 Foreground，但描述的是不同概念。

### 6.1 Linux Foreground：终端作业控制

Linux 中的 Foreground Process Group，指的是**当前拥有控制终端交互权的进程组**。它依赖 TTY、Session、Process Group、TPGID。例如前台跑 `sleep 1000`，按 `Ctrl+C` 时终端向该进程组发 SIGINT。讨论的是终端交互权。

细节见 [从 TTY 到 Session 第 3 节](/blog/从-tty-到-session-理解-linux-终端-进程组与前台后台)。

### 6.2 Docker Foreground：不进行 Daemonize

Docker 文档里说服务以 foreground mode 运行，通常是指：**服务进程不自行 fork 到后台并脱离启动进程，而是留在主进程位置持续运行。**

例如 `nginx -g "daemon off;"`。讨论的是服务的启动模式和进程生命周期，与 TTY 没有直接关系。

### 6.3 一个典型例子

```bash
docker run -d nginx
```

这里同时发生两件事：

1. Docker CLI 使用 Detached Mode：启动容器后返回终端。
2. Nginx 使用非 daemonize 运行模式：Master 作为 PID 1 持续运行。

因此可以同时成立：

- Docker CLI 是 Detached Mode
- Nginx 是非 daemonize 运行模式
- 容器可能没有分配 TTY
- Nginx 也不一定属于任何终端的前台进程组

### 6.4 最终对照

| 术语 | 所属层次 | 关注的问题 |
| :--- | :--- | :--- |
| Linux Foreground Process Group | TTY / Job Control | 谁拥有终端交互权？ |
| Linux Background Process Group | TTY / Job Control | 哪个进程组不拥有终端前台交互权？ |
| Daemon | 服务运行模式 | 服务是否脱离终端、作为长期后台服务运行？ |
| Docker Detached Mode | Docker CLI | CLI 是否附着在容器标准输入输出上？ |
| Docker 服务 Foreground Mode | 服务启动方式 | 服务是否自行 daemonize？ |

讨论 Docker 时，更稳妥的说法是把 foreground mode 理解为**非 daemonize 运行模式**，不要和 Linux TTY 的前台进程组混为一谈。

---

## 7. 用场景串起来

### 7.1 场景 A：Docker 运行 Node 服务

```bash
docker run -d my-node-app
```

```dockerfile
CMD ["node", "server.js"]
```

```text
Host PID Namespace
   |
   +-- Docker Engine
          |
          +-- Container
                 |
                 +-- PID 1: node server.js
```

- `-d` 是 Docker CLI 的 Detached Mode
- Node 是容器 PID 1
- Node 不需要 TTY 也能正常运行
- `docker stop` 默认向 Node 发 SIGTERM
- Node 应当处理 SIGTERM 并优雅退出

### 7.2 场景 B：Docker 运行 Nginx

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

```text
Container
   |
   +-- PID 1: nginx master
          |
          +-- nginx worker 1
          |
          +-- nginx worker 2
```

- Nginx 不自行 daemonize
- Nginx Master 持续运行
- 它不需要拥有 TTY 的前台交互权
- 容器由主进程生命周期决定

---

## 8. 总结

| 关卡 | 要点 |
| :--- | :--- |
| 容器生命周期 | 主进程退出 → 容器停止；剩余进程会被清理 |
| `-d` | CLI Detached Mode，不是容器内的 `command &` |
| `-t` | 分配 PTY；与 Linux 伪终端是同一套机制 |
| `docker exec` | 新进程不是 PID 1，退出不拖垮容器 |
| `docker stop` | 默认向主进程发 SIGTERM，超时再 SIGKILL |
| PID 1 | 有特殊的进程管理与信号处理语义；必要时用 `--init` |
| CMD | 优先 Exec Form，让业务进程直接当 PID 1 |
| Nginx | 常用 `daemon off;`，避免自行 daemonize |
| Foreground | Linux 看 TPGID；Docker 看是否非 daemonize |

日常开发再记两条：

1. 写 Dockerfile 时默认用 `CMD ["app", ...]`；真需要 Shell 语法时，用 `sh -c` 再加 `exec`，别让中间层 Shell 挡信号。
2. 看到 Docker 文档说 foreground，先问「服务有没有自行 daemonize」，别和终端前台进程组搅在一起。

Linux 侧的终端、Session、进程组与 Shell 作业控制，可回看 [从 TTY 到 Session：理解 Linux 终端、进程组与前台后台](/blog/从-tty-到-session-理解-linux-终端-进程组与前台后台)。
