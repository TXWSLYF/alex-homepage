---
author: Alex
pubDatetime: 2025-09-05T11:31:00+09:00
title: docker network 知识点总结
postSlug: ""
tags:
  - docker
  - docker-network
featured: false
draft: false
ogImage: ""
description: docker network 知识点总结
---

## 一、默认网络

在默认情况下，当你安装 Docker 并启动守护进程时，它会自动创建三个网络。

```sh
➜  ~ docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
470d32f87ea9   bridge    bridge    local
e1d78fd87109   host      host      local
a05e4c4dbd43   none      null      local
```

### **Docker 默认创建的三个网络**

- **`bridge`**: 这是最常用的默认网络。

  - **类型**: 桥接网络（bridge）。
  - **特点**: 自动为每个容器分配一个内部 IP 地址（通常是 `172.17.0.x`），并提供一个网关。连接到此网络的容器可以在同一台主机上通过 IP 地址互相通信。
  - **用途**: 当你使用 `docker run` 且不指定 `--network` 参数时，容器会自动连接到这个网络。

- **`host`**: 宿主网络。

  - **类型**: 宿主网络（host）。
  - **特点**: **不提供任何网络隔离**。连接到这个网络的容器会直接共享主机的网络栈。这意味着容器没有自己的独立 IP 地址，它会直接使用主机的 IP 地址和端口。
  - **用途**: 适用于需要极致网络性能的应用，或者容器需要直接监听主机特定端口的情况。由于安全性较低，不推荐用于一般用途。

- **`none`**: 无网络。
  - **类型**: 无网络（null）。
  - **特点**: **完全禁用网络功能**。连接到这个网络的容器没有任何网络接口，无法进行任何入站或出站的网络通信。
  - **用途**: 适用于只需要进行本地计算或处理文件，且无需任何网络连接的容器。

---

## 二、CASE 分析

### 1. 单独启动容器

我们可以看到这种情况，容器自动加入了默认的 `bridge` 网络，并且分配了 ip 地址。

```sh
➜  ~ docker run -d nginx:alpine
48b232e9e16081fe51574ebc0425f5d6b37b315bcd51f0ea18d4bf588fd0fc4c
➜  ~ docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS     NAMES
48b232e9e160   nginx:alpine   "/docker-entrypoint.…"   6 seconds ago   Up 5 seconds   80/tcp    vigorous_carson

➜  ~ docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
470d32f87ea9   bridge    bridge    local
e1d78fd87109   host      host      local
a05e4c4dbd43   none      null      local
➜  ~ docker network inspect bridge
[
    {
        "Name": "bridge",
        "Id": "470d32f87ea9a329959c7b4f2e21762b4337b100a465c93166a2b8b6142d5726",
        "Created": "2025-09-05T02:37:23.563865Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "48b232e9e16081fe51574ebc0425f5d6b37b315bcd51f0ea18d4bf588fd0fc4c": {
                "Name": "vigorous_carson",
                "EndpointID": "4fca56a8ea9efc745c445402897d2e5edd81699c9b83b3c0fe3db3e3d7e408dc",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "65535"
        },
        "Labels": {}
    }
]
```

我们再单独启动一个容器

```sh
➜  ~ docker run -d nginx:alpine
21a9dc5006497007c8bc0acfa66859b5e26645acf1b3a25152e660cb0f76135d
➜  ~ docker network inspect bridge
[
    {
        "Name": "bridge",
        "Id": "470d32f87ea9a329959c7b4f2e21762b4337b100a465c93166a2b8b6142d5726",
        "Created": "2025-09-05T02:37:23.563865Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "21a9dc5006497007c8bc0acfa66859b5e26645acf1b3a25152e660cb0f76135d": {
                "Name": "awesome_hawking",
                "EndpointID": "8e40312d71f9365d72a907c3fcfa206fd89c1fcc26bfce39e0ac6eae08c59359",
                "MacAddress": "02:42:ac:11:00:03",
                "IPv4Address": "172.17.0.3/16",
                "IPv6Address": ""
            },
            "48b232e9e16081fe51574ebc0425f5d6b37b315bcd51f0ea18d4bf588fd0fc4c": {
                "Name": "vigorous_carson",
                "EndpointID": "4fca56a8ea9efc745c445402897d2e5edd81699c9b83b3c0fe3db3e3d7e408dc",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "65535"
        },
        "Labels": {}
    }
]
```

现在我们再来测试容器之间网络的互通

```sh
➜  ~ docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS     NAMES
21a9dc500649   nginx:alpine   "/docker-entrypoint.…"   2 minutes ago   Up 2 minutes   80/tcp    awesome_hawking
48b232e9e160   nginx:alpine   "/docker-entrypoint.…"   7 minutes ago   Up 7 minutes   80/tcp    vigorous_carson
➜  ~ docker network inspect bridge
[
    {
        "Name": "bridge",
        "Id": "470d32f87ea9a329959c7b4f2e21762b4337b100a465c93166a2b8b6142d5726",
        "Created": "2025-09-05T02:37:23.563865Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "21a9dc5006497007c8bc0acfa66859b5e26645acf1b3a25152e660cb0f76135d": {
                "Name": "awesome_hawking",
                "EndpointID": "8e40312d71f9365d72a907c3fcfa206fd89c1fcc26bfce39e0ac6eae08c59359",
                "MacAddress": "02:42:ac:11:00:03",
                "IPv4Address": "172.17.0.3/16",
                "IPv6Address": ""
            },
            "48b232e9e16081fe51574ebc0425f5d6b37b315bcd51f0ea18d4bf588fd0fc4c": {
                "Name": "vigorous_carson",
                "EndpointID": "4fca56a8ea9efc745c445402897d2e5edd81699c9b83b3c0fe3db3e3d7e408dc",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "65535"
        },
        "Labels": {}
    }
]
➜  ~ docker exec -it awesome_hawking curl http://172.17.0.2
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
➜  ~ docker exec -it awesome_hawking curl http://vigorous_carson
curl: (6) Could not resolve host: vigorous_carson

```

通过上面的例子我们可以看出，**加入 `bridge` 网路的容器之间，能通过 ip 地址相互通信，但是不能通过容器名**。

### 2. 通过 docker-compose 启动容器

```yml
# docker-compose.yml
version: "3"
services:
  web1:
    container_name: web1
    image: nginx:alpine
  web2:
    container_name: web2
    image: nginx:alpine
```

运行 `docker-compose up -d` 一次性启动配置文件中所有 `services`:

```sh
➜  TXWSLYF.github.io git:(master) ✗ docker-compose up -d

[+] Running 2/2
 ✔ Container web2  Started                                                                                                     0.0s
 ✔ Container web1  Started                                                                                                     0.0s
➜  TXWSLYF.github.io git:(master) ✗ docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED          STATUS          PORTS     NAMES
45f3692a95f6   nginx:alpine   "/docker-entrypoint.…"   35 seconds ago   Up 35 seconds   80/tcp    web2
fa653b5591f8   nginx:alpine   "/docker-entrypoint.…"   35 seconds ago   Up 35 seconds   80/tcp    web1
➜  TXWSLYF.github.io git:(master) ✗ docker network ls
NETWORK ID     NAME                      DRIVER    SCOPE
470d32f87ea9   bridge                    bridge    local
e1d78fd87109   host                      host      local
a05e4c4dbd43   none                      null      local
97b96b7a6c22   txwslyfgithubio_default   bridge    local
➜  TXWSLYF.github.io git:(master) ✗ docker network inspect txwslyfgithubio_default
[
    {
        "Name": "txwslyfgithubio_default",
        "Id": "97b96b7a6c2238b57edac379f9519d362f567deacf55d35e3c98faff615faef5",
        "Created": "2025-09-05T03:40:16.174618425Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.18.0.0/16",
                    "Gateway": "172.18.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "45f3692a95f664eb0f43aeebb88fe7b70d092612da7860a8856a7e7a78a21cf0": {
                "Name": "web2",
                "EndpointID": "e3bcdbaa138b5f2629e1288b74386c23586ad2efc2b3eb98ad30f6bff5f42ea6",
                "MacAddress": "02:42:ac:12:00:03",
                "IPv4Address": "172.18.0.3/16",
                "IPv6Address": ""
            },
            "fa653b5591f8f0b691cb6573d078995f377e0c3a2fe6b58592b8a5952bce5e96": {
                "Name": "web1",
                "EndpointID": "06782cb99fe6db7823da7de7d53c53336552b03cc48f8048f1629661a13ea661",
                "MacAddress": "02:42:ac:12:00:02",
                "IPv4Address": "172.18.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {
            "com.docker.compose.network": "default",
            "com.docker.compose.project": "txwslyfgithubio",
            "com.docker.compose.version": "2.23.3"
        }
    }
]
```

我们可以看到，`docker-compose` 的启动方式，会帮我们默认创建一个 `network`，**命名取决于当前目录的目录名**。
这里就会出现一个很有意思的事情：

```sh
/data/alex
/script/code/alex
```

**如果你在上面两个目录下都有 `docker-compose` 配置文件，并且启动了容器，那么这两个不同目录的不同配置文件的 `container` 会加入同一个网路。**

我们再来测试下这种情况下，容器之间网络互联的情况：

```sh
➜  ~ docker ps
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS     NAMES
45f3692a95f6   nginx:alpine   "/docker-entrypoint.…"   6 minutes ago   Up 6 minutes   80/tcp    web2
fa653b5591f8   nginx:alpine   "/docker-entrypoint.…"   6 minutes ago   Up 6 minutes   80/tcp    web1
➜  ~ docker network inspect txwslyfgithubio_default
[
    {
        "Name": "txwslyfgithubio_default",
        "Id": "97b96b7a6c2238b57edac379f9519d362f567deacf55d35e3c98faff615faef5",
        "Created": "2025-09-05T03:40:16.174618425Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.18.0.0/16",
                    "Gateway": "172.18.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "45f3692a95f664eb0f43aeebb88fe7b70d092612da7860a8856a7e7a78a21cf0": {
                "Name": "web2",
                "EndpointID": "e3bcdbaa138b5f2629e1288b74386c23586ad2efc2b3eb98ad30f6bff5f42ea6",
                "MacAddress": "02:42:ac:12:00:03",
                "IPv4Address": "172.18.0.3/16",
                "IPv6Address": ""
            },
            "fa653b5591f8f0b691cb6573d078995f377e0c3a2fe6b58592b8a5952bce5e96": {
                "Name": "web1",
                "EndpointID": "06782cb99fe6db7823da7de7d53c53336552b03cc48f8048f1629661a13ea661",
                "MacAddress": "02:42:ac:12:00:02",
                "IPv4Address": "172.18.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {
            "com.docker.compose.network": "default",
            "com.docker.compose.project": "txwslyfgithubio",
            "com.docker.compose.version": "2.23.3"
        }
    }
]
➜  ~ docker exec -it web1 curl http://172.18.0.3
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
➜  ~ docker exec -it web1 curl http://web2
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

可以看到，ip 地址和 service 名称的连接方式都是支持的。

## 三、常用命令总结

### **1. 查看网络列表**

查看本地所有的 Docker 网络。这是最常用的网络命令之一。

```bash
docker network ls
```

### **2. 查看网络详情**

查看某个网络的具体配置，比如子网、网关、连接的容器等。

```bash
docker network inspect <network_name_or_id>
```

示例：

```bash
docker network inspect bridge
```

### **3. 创建自定义网络**

创建自定义的桥接网络是最佳实践。它能让容器通过名称互相通信。

```bash
docker network create <network_name>
```

示例：

```bash
docker network create my-custom-network
```

### **4. 将容器连接到网络**

启动容器时，使用 `--network` 参数将其连接到指定的网络。

```bash
docker run -d --name <container_name> --network <network_name> <image_name>
```

示例：

```bash
docker run -d --name my-web --network my-custom-network nginx
```

如果容器正在运行，你也可以把它连接到另一个网络：

```bash
docker network connect <network_name> <container_name>
```

### **5. 将容器从网络中断开**

将一个正在运行的容器从某个网络中断开。

```bash
docker network disconnect <network_name> <container_name>
```

### **6. 删除网络**

删除不再需要的网络。删除前必须确保没有容器连接到该网络。

```bash
docker network rm <network_name_or_id>
```

### **7. 清理未使用的网络**

如果你有很多不再使用的网络（例如，之前创建的但没有被容器使用的），可以使用这个命令一键清理。

```bash
docker network prune
```
