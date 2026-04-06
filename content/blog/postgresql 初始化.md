---
author: Alex
pubDatetime: 2025-12-11T12:00:00+09:00
title: Docker 环境下 PostgreSQL 快速启动与 SSL 手动配置指南
postSlug: docker-postgres-quickstart-manual-ssl
tags:
  - Docker
  - PostgreSQL
  - Database
  - SSL
  - Configuration
featured: false
draft: false
ogImage: ""
description: 通过一个简洁的 Shell 脚本快速部署 PostgreSQL 容器，并深入学习数据卷的持久化管理和手动开启 SSL 加密连接的实用技巧。
---

## Docker 环境下 PostgreSQL 快速启动与配置深度指南

在现代开发中，使用 Docker 部署 PostgreSQL 是最快、最可靠的方式之一。本指南将提供一个高效的 Shell 脚本用于快速启动 PostgreSQL 容器，并详细介绍如何解决数据持久化问题，以及如何在容器内部手动配置和启用 SSL 加密连接。

---

### 一、快速启动脚本：`start-postgres.sh`

我们使用一个简洁的 Bash 脚本来封装所有 Docker 命令，实现一键启动。此脚本基于 PostgreSQL 17.7 版本，使用具名卷进行数据持久化。

#### 1. 脚本内容

请创建并保存以下内容为 `start-postgres.sh` 文件：

```bash
#!/bin/bash

# --- 变量配置区 ---
# 请根据您的需求修改以下变量
CONTAINER_NAME="my-postgres-db"
PG_PASSWORD="YOUR_SECURE_PASSWORD_HERE"  # **重要：请替换为您自己的安全密码**
PG_VERSION="17.7"                       # **已更新为最新版本 PostgreSQL 17.7**
HOST_PORT="5432"                      # 宿主机（您的电脑）暴露的端口
CONTAINER_PORT="5432"                 # 容器内部端口 (Postgres默认)
VOLUME_NAME="postgres_data_volume"    # 用于数据持久化的Docker卷名
MEMORY_LIMIT="1g"                     # 容器内存限制 (可选，限制为 1GB)

# --- 检查与清理（可选，推荐）---
# 检查同名容器是否存在，如果存在则停止并删除
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "停止并删除旧容器: $CONTAINER_NAME"
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# --- 启动 PostgreSQL 容器 ---
echo "正在启动 PostgreSQL 容器 (版本: $PG_VERSION, 端口: $HOST_PORT)"
echo "---------------------------------------------------------"

docker run \
    --name $CONTAINER_NAME \
    -e POSTGRES_PASSWORD=$PG_PASSWORD \
    -v $VOLUME_NAME:/var/lib/postgresql/data \
    -p $HOST_PORT:$CONTAINER_PORT \
    -m $MEMORY_LIMIT \
    -d \
    postgres:$PG_VERSION

# --- 运行状态检查 ---
if [ $? -eq 0 ]; then
    echo "---------------------------------------------------------"
    echo "✅ 容器 $CONTAINER_NAME 已成功启动！(PostgreSQL $PG_VERSION)"
    echo "   - 宿主机端口: $HOST_PORT"
    echo "   - 数据库密码: $PG_PASSWORD"
    echo "   - 检查容器状态: docker logs -f $CONTAINER_NAME"
else
    echo "❌ 容器启动失败，请检查 Docker 日志。"
fi
```

#### 2\. 运行方法

给脚本执行权限并运行：

```bash
chmod +x start-postgres.sh
./start-postgres.sh
```

### 二、数据持久化：具名卷 vs. 绑定挂载

在容器化数据库环境中，**具名卷 (Named Volumes)** 是官方推荐的最佳实践，它解决了绑定挂载 (Bind Mounts) 带来的权限和兼容性问题。

| 方式         | 挂载示例                      | 优点                                                                       | 数据库推荐   |
| :----------- | :---------------------------- | :------------------------------------------------------------------------- | :----------- |
| **具名卷**   | `-v pg_data:/path/to/data`    | 数据由 Docker 内部管理，与宿主机文件系统隔离，权限问题少，跨平台兼容性好。 | **强烈推荐** |
| **绑定挂载** | `-v /host/path:/path/to/data` | 可直接在宿主机访问文件，但容易导致权限冲突（如 Linux UID/GID 不匹配）。    | 不推荐       |

**⚠️ 重要版本迁移提示：**
如果您计划升级到 **PostgreSQL 18 或更高版本**，请务必修改数据卷的挂载点，以适应新镜像的结构：

- **旧版本 (17.x 及以下)：** `-v VOLUME_NAME:/var/lib/postgresql/data`
- **新版本 (18.x 及以上)：** `-v VOLUME_NAME:/var/lib/postgresql`

### 三、手动开启 SSL 加密连接指南

在不重新初始化容器的情况下，手动配置 SSL 是最灵活的加密方案。

**前提：** 容器正在运行，且您使用的是一个全新的数据卷。

如果您的容器已经启动，请执行以下步骤：

**步骤 1：进入容器**

使用超级用户权限进入运行中的 PostgreSQL 容器：

```bash
docker exec -it my-postgres-db bash
```

**步骤 2：生成自签名证书和私钥**

切换到数据目录，并使用 `openssl` 工具生成证书 (`server.crt`) 和私钥 (`server.key`)：

```bash
cd /var/lib/postgresql/data

# 生成证书，Common Name可设置为localhost
openssl req -new -text -days 3650 -nodes -x509 -keyout server.key -out server.crt -subj '/CN=localhost'

# 设置私钥权限：**这是关键！** 必须设为 0600
chmod 600 server.key
```

**步骤 3：修改 PostgreSQL 配置文件**

编辑 `postgresql.conf` 文件，开启 SSL 并指定证书路径：

```bash
vi postgresql.conf
```

找到或添加以下三行配置：

```conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# 可选：配置加密算法套件以增强安全性
# ssl_ciphers = 'HIGH:!aNULL:!MD5'
```

**步骤 2.4：重启服务并验证**

保存配置文件后，在容器内部重启 PostgreSQL 服务：

```bash
pg_ctl restart
```

**验证：** 检查容器日志 (`docker logs my-postgres-db`)，如果看到 `LOG: listening on SSL connection(s)` 的消息，则表示 SSL 开启成功。

### 四、连接与默认配置

- **默认用户：** `postgres`
- **默认数据库：** 容器启动后，默认存在三个数据库：
  - `postgres`: 用于连接和创建应用程序表的数据库。
  - `template1`: 用于创建新数据库的默认模板。
  - `template0`: 一个纯净的模板，通常用于特殊的编码或区域设置。

客户端连接时，您可以选择 **`REQUIRED`** 或 **`VERIFY-CA`/`VERIFY-FULL`** 模式来使用 SSL 加密连接。由于我们使用的是自签名证书，`REQUIRED` 模式通常是最兼容的选择。
