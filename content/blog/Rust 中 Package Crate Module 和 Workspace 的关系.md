---
author: Alex
pubDatetime: 2026-04-27T11:40:00+09:00
title: Rust 中 Package、Crate、Module 和 Workspace 的关系
postSlug: "rust-package-crate-module-workspace"
tags:
  - Rust
  - Cargo
  - Workspace
featured: false
draft: false
ogImage: ""
description: 用一篇文章讲清 Rust 里 Package、Crate、Module 与 Workspace 的层级关系、职责分工与常见混淆点。
---

很多人刚学 Rust 时，都会被几个词绕晕：

- `Package`
- `Crate`
- `Module`
- `Workspace`

它们都和“项目结构”有关，但分工并不一样。

如果只记一句话，我会建议记这个层级：

```text
Workspace > Package > Crate > Module
```

也可以把它理解成：

```text
一个工作空间 > 一个项目包 > 一个编译单元 > 一个代码分区
```

这篇文章就把这几个概念一次讲清。

---

## 0) 先看结论

先用一句最短的话分别定义它们：

| 概念 | 它是什么 | 谁负责 |
| --- | --- | --- |
| `Workspace` | 多个相关 `package` 的管理容器 | Cargo |
| `Package` | 一个由 Cargo 管理的项目单元 | Cargo |
| `Crate` | Rust 编译器处理的最小编译单元 | `rustc` |
| `Module` | `crate` 内部的代码组织与命名空间单位 | Rust 语言本身 |

所以它们不是同一层面的词。

- `Workspace` 是多项目管理。
- `Package` 是项目打包和依赖管理。
- `Crate` 是编译边界。
- `Module` 是代码组织方式。

---

## 1) 什么是 Package？

`Package` 是 Cargo 的管理单位。

判断一个目录是不是 Rust 的 `package`，最关键的标志只有一个：

**这个目录里有没有 `Cargo.toml`。**

一个 `package` 通常包含：

- 项目名
- 版本号
- 依赖配置
- 构建配置
- 至少一个 `crate`

Cargo 对一个 `package` 有几个常见规则：

0) 最多只能有一个库 `crate`，通常是 `src/lib.rs`
1) 可以有多个二进制 `crate`
2) 默认二进制入口通常是 `src/main.rs`
3) 额外的二进制入口通常放在 `src/bin/*.rs`

也就是说，`package` 的核心职责不是“写代码”，而是：

**描述这个项目怎么被构建、依赖谁、产出什么。**

一个典型的单 `package` 项目长这样：

```text
hello_rust/
├── Cargo.toml
└── src/
    └── main.rs
```

这里整个 `hello_rust/` 就是一个 `package`。

---

## 2) 什么是 Crate？

`Crate` 是 Rust 编译器的最小编译单元。

你可以把它理解成：

**编译器一次真正处理的“一个目标”。**

`crate` 分成两类：

0) `Binary Crate`
1) `Library Crate`

### `Binary Crate`

二进制 `crate` 一般有 `main` 函数，编译后会生成可执行文件。

例如：

```rust
fn main() {
    println!("hello");
}
```

这类 `crate` 的常见入口文件是：

- `src/main.rs`
- `src/bin/foo.rs`

### `Library Crate`

库 `crate` 没有 `main` 函数，它的作用是给别的代码复用。

常见入口文件是：

- `src/lib.rs`

例如一个 `package` 可以同时有：

```text
my_app/
├── Cargo.toml
└── src/
    ├── lib.rs
    ├── main.rs
    └── bin/
        └── admin.rs
```

这意味着这个 `package` 里可能包含：

- 一个库 `crate`：`src/lib.rs`
- 一个默认二进制 `crate`：`src/main.rs`
- 一个额外二进制 `crate`：`src/bin/admin.rs`

所以要特别注意：

**一个 `package` 不一定只对应一个 `crate`。**

这也是 `package` 和 `crate` 最容易混淆的地方。

### Crate Root 是什么？

每个 `crate` 都有一个起点，叫 `crate root`。

常见就是：

- `src/main.rs`
- `src/lib.rs`

它既是编译入口，也是根模块所在的位置。

后面的所有模块树，都是从这个 root 长出来的。

---

## 3) 什么是 Module？

`Module` 是 `crate` 内部的代码组织单位。

它解决的是两个问题：

0) 代码怎么分区
1) 名字如何隔离
2) 哪些内容对外可见

在 Rust 里，模块通过 `mod` 定义，可以写在同一个文件里，也可以拆到单独文件中。

例如内联模块：

```rust
mod user {
    pub fn login() {}
}
```

也可以这样拆文件：

```rust
mod user;
```

然后让编译器去找：

- `user.rs`
- 或 `user/mod.rs`

模块的本质是命名空间和可见性边界。

比如：

```rust
mod user {
    fn private_fn() {}

    pub fn public_fn() {}
}
```

这里 `private_fn` 默认只能在当前模块内部使用，`public_fn` 才能被外部访问。

所以 `module` 并不是构建单位，它只是 `crate` 内部的组织结构。

---

## 4) 三者到底是什么关系？

如果只看单个 Rust 项目，可以这样理解：

```text
Package
└── Crate
    └── Module
```

更准确一点说：

0) `package` 是 Cargo 管理的项目容器
1) `crate` 是这个容器里真正被编译的单元
2) `module` 是 `crate` 里面继续拆分代码的方式

例如下面这个项目：

```text
my_project/
├── Cargo.toml
└── src/
    ├── main.rs
    ├── config.rs
    └── db/
        └── mod.rs
```

可以这样理解：

- `my_project/` 是一个 `package`
- `src/main.rs` 对应一个二进制 `crate`
- `config.rs` 和 `db` 是这个 `crate` 里的 `module`

如果 `main.rs` 中写了：

```rust
mod config;
mod db;
```

那模块树就会从 `crate root` 往下展开。

---

## 5) 为什么大家总把 Package 和 Crate 搞混？

因为在最简单的 Rust 项目里，它们经常看起来像一回事。

比如这个项目：

```text
demo/
├── Cargo.toml
└── src/
    └── main.rs
```

这里：

- `demo/` 是一个 `package`
- `src/main.rs` 是一个二进制 `crate`

项目太小，所以你会感觉“整个项目就是一个 crate”。  
这种直觉在小项目里没什么问题，但一旦项目里同时出现 `lib.rs`、`main.rs`、`src/bin/*.rs`，你就会发现两者其实不是同一个概念。

最短总结如下：

- `Package` 是**管理概念**
- `Crate` 是**编译概念**

也可以记成：

> Cargo 管 `package`，`rustc` 管 `crate`。

---

## 6) Workspace 又是什么？

当一个仓库里不止一个 `package` 时，Rust 通常会用 `workspace` 来统一管理。

这就是比 `package` 更高一层的概念。

一个典型的 `workspace` 长这样：

```text
my_project/
├── Cargo.toml
├── package_a/
│   ├── Cargo.toml
│   └── src/lib.rs
├── package_b/
│   ├── Cargo.toml
│   └── src/main.rs
└── target/
```

根目录的 `Cargo.toml` 一般会写成这样：

```toml
[workspace]
members = ["package_a", "package_b"]
```

这里的含义是：

- `my_project/` 是一个 `workspace`
- `package_a/` 是一个 `package`
- `package_b/` 是另一个 `package`

也就是说：

**`workspace` 管多个 `package`，每个 `package` 再包含自己的一个或多个 `crate`，每个 `crate` 里再继续拆成多个 `module`。**

完整层级就变成：

```text
Workspace
└── Package
    └── Crate
        └── Module
```

---

## 7) 为什么大型项目喜欢 Workspace？

当项目规模变大后，`workspace` 很实用，主要有几个原因：

0) 多个 `package` 可以放在同一个仓库里协作
1) 所有成员共享一个 `Cargo.lock`
2) 所有成员共享一个 `target/`，减少重复编译
3) 可以在根目录统一执行 `cargo build`、`cargo test`
4) 内部 `package` 之间可以像普通依赖一样互相引用

例如：

- `core` 负责通用逻辑
- `server` 负责后端服务
- `cli` 负责命令行工具

它们都能放在一个 `workspace` 里，各自保持边界清晰，同时共享构建环境。

---

## 8) 一个特别容易记的心智模型

如果你总记不住这几个词，可以直接套这个类比：

- `Workspace`：一整个园区
- `Package`：园区里的一栋楼
- `Crate`：楼里的一个独立部门
- `Module`：部门里的房间分区

这个类比不完全严格，但足够帮助你快速建立层级感。

---

## 9) 两个最常见的理解误区

### 误区一：依赖进来的是 crate 还是 package？

当你在 `Cargo.toml` 里写：

```toml
[dependencies]
serde = "1"
```

从 Cargo 的角度看，你添加的是一个依赖 `package`。

但在代码里使用时，你通常会通过它暴露出来的 `crate` 名称来引用。

也就是说，日常交流里这两个词经常被混着说，但背后语义并不完全相同。

### 误区二：`use std::collections::HashMap` 里谁是 crate，谁是 module？

这行代码里：

- `std` 是一个 `crate`
- `collections` 是 `std` 里的一个 `module`
- `HashMap` 是这个模块导出的一个类型

所以 `use` 路径本质上是在 `crate` 和 `module` 组成的树上找名字。

---

## 10) 最后用一句话讲透

Rust 的项目组织可以这样理解：

0) `Workspace` 负责管理多个相关项目
1) `Package` 负责描述一个项目的依赖和构建信息
2) `Crate` 是真正参与编译的最小单元
3) `Module` 负责在 `crate` 内部组织代码和控制可见性

如果你把这四层关系记住，Rust 的项目结构基本就不会再混了。

最后送你一个最值得记住的总结：

> `workspace` 是项目集合，`package` 是 Cargo 管理单元，`crate` 是编译单元，`module` 是代码组织单元。
