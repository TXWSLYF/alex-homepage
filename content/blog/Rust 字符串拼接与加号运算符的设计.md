---
author: Alex
pubDatetime: 2026-04-27T12:00:00+09:00
title: Rust 字符串拼接与 `+` 运算符的设计
postSlug: ""
tags:
  - Rust
  - 字符串
featured: false
draft: false
ogImage: ""
description: 从 push_str、format!、join 到 `s1 + &s2`：常见写法怎么选，以及为什么 `+` 要消费左边的 String、右边用 &str。
---

刚学 Rust 时，字符串拼接很容易让人困惑：为什么有 `push_str`、`format!`、`+` 这么多种写法？为什么 `s1 + &s2` 会把 `s1`「吃掉」？为什么不能直接 `"hello" + "world"`？下面把常见方式和背后的设计思路一次讲清楚。

---

## 1) `push_str`：最推荐的追加方式

如果你已经有一个可变的 `String`，想在末尾继续追加内容，`push_str` 是最直接、通常也最高效的方法。

```rust
let mut s = String::from("Hello");
let s2 = " World";

s.push_str(s2);
s.push('!');

println!("{s}"); // Hello World!
```

- `push_str` 接收 `&str`，不夺走参数的所有权。
- 若原字符串容量足够，往往不必重新分配。
- 适合「在原字符串后面继续加」的场景。

一句话：**已有 `String` 且要继续往后拼，优先用 `push_str`。**

---

## 2) `+` 运算符：能用，但要理解所有权

```rust
let s1 = String::from("Hello");
let s2 = String::from("World");

let s3 = s1 + &s2;

println!("{s3}"); // HelloWorld
// println!("{s1}"); // 编译错误：s1 已被移动
```

`+` 的底层大致对应：

```rust
fn add(self, s: &str) -> String
```

- 第一个参数是 `self`：拿走左边 `String` 的所有权。
- 第二个参数是 `&str`：只借用右边内容。

语义不是「两个值对称相加」，而是：**把左边的 `String` 拿过来，在它后面追加右边内容，再返回结果。**

---

## 3) `format!`：最灵活、最适合模板化拼接

要拼多个值，或混着数字、变量时，`format!` 通常最好读。

```rust
let s1 = "Hello";
let s2 = "Rust";
let year = 2026;

let s = format!("{s1}, {s2} {year}!");
println!("{s}");
```

- 不移动原变量所有权。
- 会分配新的 `String`。
- 非极致性能场景里往往最舒服。

---

## 4) `concat` 与 `join`：处理集合

```rust
let words = ["Tokyo", "is", "cool"];

let s1 = words.concat();   // Tokyoiscool
let s2 = words.join(" ");  // Tokyo is cool
```

适合数组、切片、`Vec` 里的一批字符串直接拼或带分隔符连接。

---

## 5) `String::with_capacity`：循环里少扩容

若大致知道最终长度，可先预留容量，减少反复扩容。

```rust
let mut s = String::with_capacity(100);
for _ in 0..10 {
    s.push_str("data ");
}
```

---

## 6) 怎么选：一张表

| 需求 | 推荐方式 |
| :--- | :--- |
| 在已有 `String` 后追加 | `push_str` |
| 简单拼两个字符串 | `+`（接受左值被消费） |
| 多变量或不同类型 | `format!` |
| 数组 / `Vec` | `concat` / `join` |
| 高频拼接、关注性能 | `with_capacity` + `push_str` |

经验法则：**性能优先用 `push_str`，可读性优先用 `format!`，集合用 `join`。**

---

## 7) 为什么 `+` 要这样设计？

### 7.1 复用已有缓冲区，减少分配

若 `+` 设计成「两边都是引用、不拿走所有权」，通常无法修改任一端的缓冲区，只能**新申请一块堆内存**再整体拷贝。

当前设计消费左边的 `String`，就有机会**复用其已有缓冲区**：容量够时只需把右边内容拷到末尾，避免额外整块分配。这是左边必须是 `String` 且会被 move 的主要原因之一。

### 7.2 让昂贵操作显式

Rust 希望「会分配、会大量拷贝」的事不要悄悄发生。若 `+` 永远像「轻量引用拼接」，在循环里误用容易变成隐蔽的 `O(n²)` 分配模式。

消费左值后，若还要保留原字符串，就必须写：

```rust
let s3 = s1.clone() + &s2;
```

`clone()` 明确标出：**这里有一次你愿意付的拷贝成本。**

### 7.3 右边用 `&str`：统一视图

`&str` 是通用的字符串切片视图：字面量是 `&str`，`&String` 可通过解引用强制转换变成 `&str`。因此右侧写 `&str` 能同时兼容字面量与 `String` 的借用。

### 7.4 为什么不能 `&str + &str`？

`&str` 只是借用，没有可增长的自有缓冲区；把两个 `&str` 合成新串必然要新分配 `String`。Rust 更愿意用 `format!` 或先建 `String` 再 `push_str` 把这种堆分配表达清楚，而不是让 `"a" + "b"` 看起来像零成本的栈上运算。

---

## 8) 小结

- **`push_str`**：在原 `String` 上追加，通常最高效。
- **`format!`**：模板化、多变量，语义最清晰。
- **`join` / `concat`**：处理一批字符串。
- **`+`**：消费左边、借用右边，尽量复用左边缓冲区；不是对称的「加法」，而是「追加并返回」。

`+` 看起来别扭，换来的是更透明的性能模型与资源语义：**堆分配与所有权变化，尽量让你看得见。**
