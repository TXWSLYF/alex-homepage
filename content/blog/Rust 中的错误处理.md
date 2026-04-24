---
author: Alex
pubDatetime: 2026-04-24T12:00:00+09:00
title: Rust 错误处理
postSlug: ""
tags:
  - Rust
  - 错误处理
featured: false
draft: false
ogImage: ""
description: 从 panic 与 Result 的分工，到 ? 运算符、Option，以及写库与写应用时常用的 thiserror / anyhow 取舍。
---

在 Rust 中，错误处理是一门艺术。它不像 Java 或 Python 那样使用“异常（Exceptions）”，而是通过强大的类型系统来强制你面对现实：**程序总会出点意外。**

Rust 将错误分为两大类：**不可恢复错误**和**可恢复错误**。

---

## 0) 不可恢复错误：`panic!`
当程序遇到无法处理的灾难性问题（如数组越界、除以零）时，会触发 `panic!`。此时程序会打印错误信息、展开（unwind）并清理栈数据，最后退出。

```rust
fn main() {
    panic!("程序在这里原地爆炸了");
}
```
* **适用场景**：逻辑漏洞、无法恢复的系统状态、示例代码或测试。

---

## 1) 可恢复错误：`Result<T, E>`
这是 Rust 错误处理的精髓。它是一个枚举，定义如下：

```rust
enum Result<T, E> {
    Ok(T),  // 成功时返回的数据
    Err(E), // 失败时返回的错误信息
}
```

### 如何处理 `Result`？

#### A. 模式匹配 (Match)
最原始、最彻底的处理方式。
```rust
use std::fs::File;

let f = File::open("hello.txt");
let file = match f {
    Ok(file) => file,
    Err(error) => panic!("打开文件失败: {:?}", error),
};
```

#### B. 快捷处理：`unwrap` 和 `expect`
如果你确定（或不在乎）结果一定是 `Ok`，可以使用这两个方法。
* `unwrap()`：如果是 `Err`，直接 `panic`。
* `expect("自定义错误消息")`：如果是 `Err`，带着你的消息 `panic`。

---

## 2) 错误传播的艺术：`?` 运算符
这是 Rust 开发中最常用的“语法糖”。它让错误处理变得极其简洁。

如果函数返回 `Result`，你可以在调用其他返回 `Result` 的方法后加一个 `?`。
* 如果结果是 `Ok`，它会**解包**出里面的值。
* 如果结果是 `Err`，它会立即**提前返回**，把错误抛给调用者。

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?; // 如果失败，直接返回 Err
    let mut s = String::new();
    f.read_to_string(&mut s)?; // 如果失败，直接返回 Err
    Ok(s)
}
```

---

## 3) `Option<T>`：处理“空值”
Rust 没有 `null`。当一个值可能存在也可能不存在时，使用 `Option<T>`。

* `Some(T)`：找到了值。
* `None`：啥也没有。

它同样支持 `match`、`unwrap` 以及 `?` 运算符。

---

## 4) 进阶：自定义错误类型
在大型项目中，通常会定义自己的错误类型，或者使用社区流行的库来简化逻辑：

* **`thiserror`**：适合开发**库（Library）**，帮助你快速定义规范的错误类型。
* **`anyhow`**：适合开发**应用（Application）**，它提供了一个万能的错误类型 `anyhow::Result`，让你随心所欲地抛出各种错误。

---

### 💡 核心建议
0)  **多用 `Result`，少用 `panic!`**。
1)  **善用 `?` 运算符**，保持代码整洁。
2)  **不要滥用 `unwrap`**，除非是在写 Demo 或测试代码，否则它就是程序崩溃的隐患。
