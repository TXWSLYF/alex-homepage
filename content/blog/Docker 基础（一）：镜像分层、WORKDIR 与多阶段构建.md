---
author: Alex
pubDatetime: 2026-10-29T11:30:00+09:00
title: Docker 基础（一）：镜像分层、WORKDIR 与多阶段构建
postSlug: ""
tags:
  - docker
featured: false
draft: false
ogImage: ""
description: 镜像为什么是一叠只读层，WORKDIR 写进哪，.dockerignore 挡住什么，以及多阶段构建怎样把编译车间留在最终镜像外面。
---

镜像是一个大文件吗？`WORKDIR /app` 只在构建时切一次目录吗？第一阶段里的依赖、源码和编译器，为什么可以不出现在你推上去的镜像里？

这篇文章按一条主线展开：**只读层怎么叠 → 容器怎样在上面写 → WORKDIR 写进哪 → 构建上下文怎么收 → 多阶段为什么能把车间丢掉**。

这是 Docker 基础的第一篇，先把镜像本身说清楚。

---

## 1. 镜像分层与写时复制

Docker 镜像是一叠只读层。容器启动时，Docker 在最上面再盖一层可写层。层一旦写好就不能改，后面的指令只能继续往上叠。

### 1.1 哪些指令会新加一层

构建时，改动文件系统的指令各留一层差异；只改配置的指令写进镜像元数据。

| 指令 | 结果 |
| :--- | :--- |
| `FROM`、`RUN`、`COPY`、`ADD` | 新增一层只读文件系统 |
| `WORKDIR`、`ENV`、`CMD`、`EXPOSE`、`ENTRYPOINT` | 写入镜像配置，不单独铺文件层 |

层按内容寻址。两个镜像若用到摘要相同的层，磁盘上只存一份，所以同一份 `alpine` 或 `node` 基础镜像会被反复复用。拉取和推送时，本地已经有的层不用再传。

> **核心结论：** 层是只读的。想“改掉”下面某一层，实际是在上面再叠一层差异。

### 1.2 运行时盖上一层可写层

`docker run` 启动容器时，所有只读层之上会多一层很薄的可写层（container layer）。容器里的写操作都落在这一层。

| 操作 | 行为 |
| :--- | :--- |
| 读 | 从可写层往下找，先命中的那一层生效 |
| 改已有文件 | 把整份文件复制到可写层，再改这份副本。这就是 Copy-on-Write |
| 删除 | 可写层记一条“已删除”。下层里的原文件还在，合并视图里看不见 |

**结论：** 在同一个阶段末尾 `RUN rm -rf` 删掉源码或编译器，只是多了一层删除标记。文件仍留在下面的层里，推上去的镜像也不会因此变回删除前的体积。第 4 节的多阶段构建换的是整段层，而不是在原层上做删除。

---

## 2. WORKDIR 写进镜像配置

`WORKDIR /app` 同时作用于构建和运行。目录不存在时会创建，后续指令的相对路径都从这里算；这个路径还会写进镜像配置，成为容器进程的默认工作目录。

### 2.1 构建阶段

可以把它理解成：创建 `/app`，并把后面的 `RUN`、`COPY`、`CMD` 放在这个目录里执行。

```dockerfile
WORKDIR /app
COPY package.json ./
```

`package.json` 会落到 `/app/package.json`，而不是宿主机的当前目录，也不是容器里的 `/`。

`WORKDIR` 可以写多次。后一次若是相对路径，会接在上一次后面：先 `WORKDIR /app`，再 `WORKDIR src`，当前目录就是 `/app/src`。

### 2.2 运行时

配置里的 `WorkingDir` 就是 `docker run` 时进程的初始工作目录。不另加 `-w` 时，`CMD ["node", "./dist/src/main.js"]` 里的相对路径从这里解析。

```bash
docker inspect --format='{{.Config.WorkingDir}}' my-image:latest
```

`docker run -w /tmp my-image` 只改这一次启动的工作目录，镜像配置保持原样。

> **核心结论：** `WORKDIR` 是镜像元数据。构建时的当前目录和运行时的默认工作目录是同一份配置。

---

## 3. .dockerignore 收住构建上下文

执行 `docker build` 时，客户端把构建上下文交给守护进程。守护进程只能看见上下文里的文件。`.dockerignore` 决定哪些路径不进入这份上下文。

没有这份文件时，当前目录会整包送进去，常见有两笔直接的损失。

### 3.1 本机的 node_modules

本机 `node_modules` 里的原生模块，是按本机操作系统和 CPU 编译的。macOS 上装出来的二进制，放进 Linux 容器会对不上架构。

正确做法是在上下文里排除 `node_modules`，让镜像内部的 `RUN pnpm install` 在容器自己的系统上重新安装。

它还关系到第 5 节的层缓存。Dockerfile 先复制依赖清单并安装，再 `COPY . .`。上下文里若仍带着 `node_modules`，后一次复制会把本机依赖写到同名路径上，盖住容器里刚装好的那一份。

### 3.2 .git 和密钥文件

`.git` 保存完整提交历史。曾经提交过、后来又从工作区删掉的数据库密码、API Key，仍在历史里。上下文带上 `.git`，再执行 `COPY . .`，这些内容会进入某一层只读层。按第 1 节的规则，后面再删也只是加一层删除标记。

`.env` 一类密钥文件同样不要进上下文。

```text
node_modules
.git
.env
.env.*
dist
```

`dist` 一并排除：产物在镜像里用 `pnpm run build` 生成，避免把本机编译结果拷进去。构建时确实要用的文件，不要写进这份列表。

---

## 4. 多阶段构建：车间用完即弃

多阶段构建之前，为了缩小体积，常见写法是在同一个阶段里编译，再用 Shell 把源码和工具删掉。第 1 节已经说明，这种删除去不掉下面的层。

现代 Dockerfile 可以写多个 `FROM`。每一个 `FROM` 都开始一个新阶段。

### 4.1 每个 FROM 从自己的基础镜像重开

新阶段的文件系统从这一行的基础镜像算起，不继承上一阶段安装过的包、复制过的源码。上一阶段留在构建缓存里，供以后的构建复用。

阶段之间传递文件只有一条明确的路：`COPY --from=<阶段名>`。没有被这条指令复制的路径，不会进入当前阶段。

默认的构建结果是最后一个阶段。`docker build --target build-stage` 可以把结果改成你点名的那个阶段，用来排查构建阶段本身。

### 4.2 最终镜像里有什么

| | 同一阶段里安装再删除 | 多阶段，只复制需要的文件 |
| :--- | :--- | :--- |
| 下层文件 | 还在历史层里 | 构建阶段整段不进入最终镜像 |
| 源码和工具链 | 仍可从历史层读出 | 只有 `COPY --from` 点名的路径 |
| 体积 | 删除标记几乎不减体积 | 只计算最后一阶段的层 |

> **核心结论：** “用完即弃”指的是最终镜像不包含构建阶段的那些层。生产镜像里没有源码目录、没有 `.git`、没有 TypeScript 编译器，前提是这些路径没有被复制过去。`dist` 里的 source map 仍可能还原源码，发布前要单独处理。

能小多少取决于项目。编译型语言从带完整工具链的镜像换成只含二进制，体积差一个数量级很常见。Node 的生产镜像仍要带运行时和生产依赖，差幅主要来自开发依赖和源码没有进最终镜像。

---

## 5. 一份 Node.js / pnpm 的 Dockerfile

下面这份模板把前面四节放在一起：依赖层可缓存、本机依赖进不来、构建车间不进入最终镜像、运行时工作目录是 `/app`。基础镜像的版本号换成项目锁定的 Node 版本。

顺序是有意的。依赖清单不变时，`pnpm install` 那一层可以复用；改业务源码只会让后面的 `COPY . .` 和 `pnpm run build` 重新执行。

```dockerfile
# 构建阶段：依赖、源码、编译都留在这里
FROM node:22.23.4-alpine AS build-stage
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# 生产阶段：从基础镜像重开，只搬运行所需的文件
FROM node:22.23.4-alpine AS production-stage
WORKDIR /app

COPY --from=build-stage /app/package.json ./
COPY --from=build-stage /app/pnpm-lock.yaml ./
RUN npm install -g pnpm@9 && pnpm install --prod --frozen-lockfile

COPY --from=build-stage /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

USER node
CMD ["node", "./dist/src/main.js"]
```

| 写法 | 作用 |
| :--- | :--- |
| 两个 `FROM` | 第二阶段不继承第一阶段的 `node_modules` 和源码 |
| 先复制锁文件再安装 | 源码变动不冲掉依赖层缓存 |
| `--frozen-lockfile` | 安装结果跟锁文件一致；锁文件过期时构建直接失败 |
| 生产阶段 `--prod` | 只装 `dependencies`，开发依赖留在构建阶段 |
| `COPY .../dist` | 只搬编译产物。`CMD` 里的入口要和实际输出路径一致 |
| `EXPOSE 3000` | 写进镜像配置，作为端口说明。真正映射端口仍是 `docker run -p` |
| `USER node` | 进程以官方镜像自带的 `node` 用户运行 |

构建阶段不要在 `pnpm install` 之前设置 `NODE_ENV=production`。pnpm 看到这个值会跳过开发依赖，后面的 `pnpm run build` 会缺编译器。生产环境变量放在生产阶段、安装完成之后。

`CMD` 里的 `./dist/src/main.js` 按第 2 节的 `WORKDIR /app` 解析。Nest 一类项目的输出有时是 `dist/main.js`，有时是 `dist/src/main.js`，以该项目的 `outDir` 和 `rootDir` 为准。

官方 `node` 镜像里已有用户 `node`。前面的 `COPY` 和 `RUN` 仍以 root 写入，文件默认可读，`node` 用户足够把服务跑起来。应用若要在运行时写 `/app`，再单独给那个目录授权。

生产阶段为了执行 `pnpm install`，镜像里会留下 pnpm 本身。它只负责安装，编译工具链和源码仍在构建阶段。

---

## 6. 总结

| 关卡 | 名称 | 要点 |
| :---: | :--- | :--- |
| 1 | **只读层** | `FROM` / `RUN` / `COPY` / `ADD` 叠层，写完不可改 |
| 2 | **可写层** | 容器在最上面写；修改是整份文件复制上来 |
| 3 | **WORKDIR** | 构建时的当前目录，也是运行时的默认工作目录 |
| 4 | **.dockerignore** | 上下文里去掉本机依赖、`.git` 和密钥 |
| 5 | **多阶段** | 最终镜像只有最后一阶段，加上显式复制的文件 |

日常写 Dockerfile 再记两条：

- **想缩小体积、去掉源码** → 换一个阶段，只 `COPY --from` 需要的路径
- **想稳住缓存** → 先复制依赖清单并安装，再复制源码
