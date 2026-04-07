---
author: Alex
pubDatetime: 2026-04-07T12:00:00+09:00
title: 常用 Linux 命令备忘
postSlug: ""
tags:
  - Linux
  - CLI
featured: false
draft: false
ogImage: ""
description: 日常开发里高频用到的 Linux / macOS 终端命令速查，适合收藏备用。
---

下面是个人常用、且多数发行版 / macOS 自带的命令，按场景分组。路径与权限以当前 shell 用户为准。

## 文件与目录

| 命令 | 说明 |
|------|------|
| `pwd` | 当前工作目录 |
| `ls -la` | 详细列表（含隐藏文件） |

## 查看与搜索

| 命令 | 说明 |
|------|------|
| `cat file` | 输出整个文件 |
| `head -n 20 file` | 前 20 行 |
| `tail -f file` | 跟踪文件末尾（看日志常用） |

## 进程与资源

| 命令 | 说明 |
|------|------|
| `top` / `htop` | 实时资源占用 |
| `kill -9 PID` | 强制结束进程 |
| `lsof -i :3000` | 查看端口占用 |

## 网络

| 命令 | 说明 |
|------|------|
| `curl -I URL` | 只看响应头 |

## Docker

| 命令 | 说明 |
|------|------|
| `docker ps -a` | 查看所有容器 |
| `docker image prune -a` | 清理未使用的镜像 |
| `docker system prune -a` | 清理未使用数据，**操作前请确认** |
| `docker compose up -d` | 后台启动编排 |

## 其他

| 命令 | 说明 |
|------|------|
| `df -h` | 磁盘空间 |
| `du -sh *` | 当前目录各条目大小 |


