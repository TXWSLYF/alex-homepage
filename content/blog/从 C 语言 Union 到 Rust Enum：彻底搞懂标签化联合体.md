---
author: Alex
pubDatetime: 2026-06-10T15:08:00+09:00
title: 从 C 语言 Union 到 Rust Enum：彻底搞懂标签化联合体
postSlug: "rust-enum-tagged-union-from-c"
tags:
  - Rust
  - C语言
  - Enum
  - Union
  - 类型安全
featured: false
draft: false
ogImage: ""
description: 从 C 语言 union 的内存复用讲到 Rust enum 的标签化联合体模型，理解 match、穷尽性检查、判别值和空指针优化。
---

C 语言里的 `union` 很直接：几种字段共用同一块内存，空间省到了极致。但它也很“裸”，编译器并不知道当前有效的是哪个字段，读错了就是未定义行为。

Rust 的 `enum` 解决的是同一个问题：一个值可能有多种形态。区别在于，Rust 把“当前是哪种形态”交给编译器维护，再通过 `match` 强制你按正确分支解构。

所以这篇文章主要看四件事：C 的 `union` 为什么危险、手写 tagged union 怎么补救、Rust `enum + match` 做了什么，以及标签在内存里可能如何被优化。

---

## 1. Rust 的 `enum` 不只是整数别名

很多语言里的枚举只是给一组整数常量起名字，例如 `Red = 0`、`Green = 1`、`Blue = 2`。

Rust 的 `enum` 更强：它是一种**代数数据类型（Algebraic Data Type, ADT）**。每个变体不仅代表一种状态，还可以携带完全不同的数据。

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
    Unknown,
}
```

这里的 `IpAddr` 表示一个值只能处在三种状态之一：

| 变体 | 携带的数据 |
| :--- | :--- |
| `V4` | 4 个 `u8` |
| `V6` | 1 个 `String` |
| `Unknown` | 不携带数据 |

这不是“一个整数常量”，而是“多种可能形态的数据容器”。

---

## 2. `match` 是 Rust enum 的安全拆包方式

既然 `enum` 的不同变体携带的数据不同，读取时就必须先确认当前到底是哪一种变体。

Rust 用 `match` 来完成这件事：

```rust
fn route(ip: IpAddr) {
    match ip {
        IpAddr::V4(a, b, c, d) => {
            println!("IPv4: {a}.{b}.{c}.{d}");
        }
        IpAddr::V6(s) => {
            println!("IPv6: {s}");
        }
        IpAddr::Unknown => {
            println!("unknown IP address");
        }
    }
}
```

`match` 做了两件事：

1. **判断当前变体** — 当前值到底是 `V4`、`V6` 还是 `Unknown`。
2. **按正确形态解构数据** — 只有进入 `V4` 分支时，才能拿到 4 个 `u8`；只有进入 `V6` 分支时，才能拿到 `String`。

### 2.1 穷尽性检查

`match` 最重要的安全能力是**穷尽性检查（Exhaustiveness Checking）**。

如果漏掉某个分支，代码无法通过编译：

```rust
fn route(ip: IpAddr) {
    match ip {
        IpAddr::V4(a, b, c, d) => println!("{a}.{b}.{c}.{d}"),
        IpAddr::V6(s) => println!("{s}"),
        // 漏掉 IpAddr::Unknown，编译器会报错
    }
}
```

> **核心结论：** Rust 不允许你“忘记处理某种状态”。这正是 `enum + match` 比裸 `union` 更安全的关键。

---

## 3. C 语言的 `union`：只有内存复用，没有状态检查

回到 C 语言，如果要表达“IPv4 或 IPv6 二选一”，可以用 `union`：

```c
typedef union {
    unsigned char v4[4];
    char *v6;
} IpRoute;
```

`union` 的特点是：所有字段共享同一块内存。

这非常省空间。`IpRoute` 的大小通常等于最大成员的大小，而不是所有成员大小之和。在 64 位系统上，`char *` 通常是 8 字节，所以这个 `union` 通常也是 8 字节。

但问题也很明显：**编译器不知道当前这块内存里到底存的是 `v4` 还是 `v6`。**

```c
IpRoute route;
route.v4[0] = 127;
route.v4[1] = 0;
route.v4[2] = 0;
route.v4[3] = 1;

printf("%s\n", route.v6); // 把 IPv4 字节误当成指针读取，结果是未定义行为
```

C 的 `union` 只负责复用内存，不负责记录“当前有效字段”。一旦读错字段，轻则得到垃圾数据，重则崩溃或产生安全漏洞。

---

## 4. C 里的手写标签化联合体

为了让 `union` 安全一些，C 程序员通常会额外加一个标签字段：

```c
typedef enum {
    IP_V4,
    IP_V6,
    IP_UNKNOWN
} IpKind;

typedef union {
    unsigned char v4[4];
    char *v6;
} IpRoute;

typedef struct {
    IpKind kind;
    IpRoute route;
} SafeIpAddr;
```

这就是**标签化联合体（Tagged Union）**：

| 组成 | 作用 |
| :--- | :--- |
| `kind` | 记录当前是哪一种状态 |
| `route` | 复用内存，保存具体数据 |

读取时需要先看标签，再读对应字段：

```c
void print_ip(SafeIpAddr ip) {
    switch (ip.kind) {
    case IP_V4:
        printf("%u.%u.%u.%u\n",
               ip.route.v4[0],
               ip.route.v4[1],
               ip.route.v4[2],
               ip.route.v4[3]);
        break;
    case IP_V6:
        printf("%s\n", ip.route.v6);
        break;
    case IP_UNKNOWN:
        printf("unknown IP address\n");
        break;
    }
}
```

这个设计已经很接近 Rust `enum` 的底层心智模型了。

但 C 语言的问题在于：**编译器不会强制你遵守 `kind` 和 `route` 的对应关系。**

你仍然可以在 `kind == IP_V4` 时读取 `route.v6`；也可以在新增一个 `IpKind` 后忘记更新所有 `switch`。这些错误通常只能靠代码审查、测试、静态分析或运行时崩溃来发现。

---

## 5. Rust enum 可以理解为编译器维护的标签化联合体

从概念上看，Rust 的 `enum` 可以理解成：

```text
enum = 判别值（discriminant/tag） + 能容纳最大变体数据的存储区域
```

也就是说，Rust 编译器替你维护了 C 里需要手写的两件事：

1. **标签** — 当前值是哪一个变体。
2. **联合存储区** — 不同变体的数据共享同一块足够大的空间。

但 Rust 不只是把 C 写法包了一层语法糖，它还额外提供了几项关键保证：

| 能力 | C 手写 tagged union | Rust `enum` |
| :--- | :--- | :--- |
| 状态标签 | 程序员手动维护 | 编译器维护 |
| 数据读取 | 需要自觉按标签读取 | 只能通过模式匹配安全解构 |
| 分支覆盖 | `switch` 可能漏分支 | `match` 默认强制穷尽 |
| 错误代价 | 可能触发未定义行为 | 安全 Rust 中不会读错变体数据 |

> **核心结论：** Rust `enum` 的价值不只是“能复用内存”，而是把“状态和值必须匹配”这件事变成了编译期规则。

---

## 6. 标签一定占空间吗？

既然 Rust `enum` 需要知道当前是哪一个变体，那它是否一定需要额外存一个标签？

答案是：**概念上需要标签，实际布局上不一定单独占用额外空间。**

### 6.1 普通情况：需要判别值

对于多个变体都可能携带数据的枚举，编译器通常需要某种判别值来区分当前状态：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}
```

`Message` 需要区分 `Quit`、`Move` 和 `Write`。编译器会选择合适的方式保存这个判别值。

不过要注意：Rust 默认布局不是稳定 ABI。除非使用 `#[repr(...)]`，否则不要在跨语言、文件格式或网络协议里假设某个 `enum` 的具体字节布局。

### 6.2 判别值大小：不必总是 4 字节

C 的 `enum` 在很多平台上通常按 `int` 处理，常见大小是 4 字节。

Rust 没有必要对所有 `enum` 都使用 4 字节标签。若变体数量很少，编译器可以用更小的判别值表达状态，例如 1 字节就足够表示许多变体。

可以用 `std::mem::size_of` 在本机观察：

```rust
use std::mem::size_of;

enum Small {
    A,
    B,
    C,
}

fn main() {
    println!("{}", size_of::<Small>());
}
```

这个结果受编译器布局策略影响，不能当作跨平台 ABI 承诺，但它能帮助理解：Rust 编译器会尽量避免无意义的空间浪费。

### 6.3 空指针优化：标签可以“藏”进无效值

Rust 最经典的布局优化是**空指针优化（Null Pointer Optimization）**。

例如：

```rust
use std::mem::size_of;

fn main() {
    println!("{}", size_of::<Box<i32>>());
    println!("{}", size_of::<Option<Box<i32>>>());
}
```

`Box<i32>` 本质上包含一个非空指针。Rust 知道合法的 `Box` 不会是空指针，于是可以用：

| 表示 | 含义 |
| :--- | :--- |
| 空指针 | `None` |
| 非空指针 | `Some(Box<i32>)` |

这样 `Option<Box<i32>>` 通常和 `Box<i32>` 一样大，不需要额外再存一个独立标签。

类似优化也常见于 `Option<&T>`、`Option<NonZeroUsize>` 等类型：只要某些 bit pattern 对原类型来说永远无效，Rust 就可能把这些“空位”拿来表示额外状态。

---

## 7. 总结

| 维度 | C `union` | C tagged union | Rust `enum` |
| :--- | :--- | :--- | :--- |
| 内存复用 | 有 | 有 | 有 |
| 状态标签 | 无 | 手动维护 | 编译器维护 |
| 类型安全 | 弱 | 依赖程序员自觉 | 强 |
| 分支检查 | 无 | `switch` 可选且可能漏 | `match` 默认穷尽 |
| 布局优化 | 主要靠程序员设计 | 主要靠程序员设计 | 编译器可做判别值压缩和 niche 优化 |

如果用一句话收束：

> **Rust 的 `enum` 是由编译器托管的标签化联合体：底层保留了 `union` 式的内存效率，上层通过 `match` 和穷尽性检查把状态错误挡在编译期。**

这也是 Rust 很有代表性的设计风格：不是放弃底层控制，而是把那些容易出错的约定交给类型系统和编译器维护。
