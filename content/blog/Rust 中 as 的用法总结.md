---
author: Alex
pubDatetime: 2026-04-23T18:00:00+09:00
title: Rust 中 as 的用法总结（基本数据类型）
postSlug: ""
tags:
  - Rust
  - 基础
featured: false
draft: false
ogImage: ""
description: 聚焦 Rust 里 `as` 在基本数据类型之间的显式转换：整数/浮点/char 的规则、截断与精度丢失等常见坑点。
---

这篇只聊一件事：**`as` 在基本数据类型之间的显式转换**。

核心结论先放前面：

- **`as` 很快，但可能静默丢信息**：整数窄化会截断；有/无符号互转会按补码重解释；大整数转浮点会丢精度。
- 需要“可失败/可检查”的转换时，用 `TryFrom/TryInto` 更合适。

---

## 0) 从汇编层面看 `as` 做了什么

想“直接从汇编看出 `as` 的作用”，关键是两点：

- **别让优化把转换消掉**：用 `std::hint::black_box`，并且 `#[inline(never)]`。
- **固定目标平台**：不同平台/指令集汇编不一样。下面以 **x86_64** 为例（你在 [Compiler Explorer (godbolt)](https://godbolt.org/) 里也更容易复现）。

你可以把下面整段代码贴到 `godbolt` 的 Rust 里，选择 `--release` 等价的优化（例如 `-C opt-level=3`），然后看右侧汇编。

```rust
use std::hint::black_box;

#[no_mangle]
#[inline(never)]
pub fn u16_to_u8(x: u16) -> u8 {
    // 窄化：只保留低 8 位（高位截断）
    (black_box(x) as u8)
}

#[no_mangle]
#[inline(never)]
pub fn i8_to_u8(x: i8) -> u8 {
    // 有符号 -> 无符号：按补码重解释
    (black_box(x) as u8)
}

#[no_mangle]
#[inline(never)]
pub fn i8_to_i32(x: i8) -> i32 {
    // 符号扩展（sign-extend）
    (black_box(x) as i32)
}

#[no_mangle]
#[inline(never)]
pub fn u8_to_u32(x: u8) -> u32 {
    // 零扩展（zero-extend）
    (black_box(x) as u32)
}

#[no_mangle]
#[inline(never)]
pub fn f32_to_i32(x: f32) -> i32 {
    // float -> int：向 0 截断（并处理 NaN/溢出饱和）
    (black_box(x) as i32)
}
```

对应到 x86_64，你通常会在汇编里看到这些“能一眼识别的信号”：

- **窄化截断（如 `u16 -> u8`）**：经常表现为“只取低 8 位寄存器”（例如使用 `al`），甚至看起来像“什么都没做”（因为返回值本来就只读低位）。
- **零扩展 `u8 -> u32`**：常见指令是 `movzx`（move with zero-extend）。
- **符号扩展 `i8 -> i32`**：常见指令是 `movsx`（move with sign-extend）。
- **`f32 -> i32`**：常见会出现 `cvttss2si`（SSE 的 float->int 截断转换）；不同编译器/版本可能用等价序列实现饱和语义。

> 提醒：具体指令会随 LLVM 版本、优化级别和 CPU 特性略有变化，但“截断 vs 零扩展 vs 符号扩展 vs float->int 转换指令”这四类特征非常稳定。

---

## 1) 整数之间：窄化截断、符号变化

```rust
let a: u16 = 1000;
let b: u8 = a as u8; // 1000 % 256 = 232（截断）

let x: i8 = -1;
let y: u8 = x as u8; // 255（按位解释后再作为 u8）
```

- **宽 -> 窄**：高位会被直接丢掉（截断）。
- **有符号 -> 无符号**：按二进制补码重新解释，结果可能巨大。

想要“越界就报错/返回 None”，用 `TryInto`：

```rust
let a: u16 = 1000;
let b: u8 = a.try_into()?; // 失败会返回错误
```

---

## 2) 浮点 <-> 整数：向 0 截断、NaN/溢出饱和

```rust
let f = 3.9_f32;
let i = f as i32; // 3（向 0 截断）

let nan = f32::NAN;
let a = nan as i32; // 0

let big = 1e30_f32;
let b = big as i32; // i32::MAX（饱和）
```

- `float -> int`：**向 0 截断**；遇到 NaN 得到 0；超范围会**饱和**到 min/max。
- `int -> float`：可能有**精度丢失**（大整数无法被 `f32/f64` 精确表示）。

如果你更关心“可控的舍入”，先做浮点舍入再转：

```rust
let f = 3.5_f32;
let i = f.round() as i32; // 4
```

---

## 3) `char` <-> 整数：码点与合法性

```rust
let c = 'A';
let code = c as u32; // 65

let x = 97_u8;
let c = x as char; // 'a'（注意：u8->char 会走 Unicode 码点）
```

注意：并不是所有 `u32` 都是合法 `char`（Unicode 标量值）。需要校验时用 `char::from_u32`：

```rust
let v = 0xD800_u32; // 代理项范围，非法
let c = char::from_u32(v); // None
```

---

## 4) 什么时候不该用 `as`？

把这条当成经验法则：

> **只要你希望“转换失败可见、或不希望静默丢信息”，就别用 `as`。**

更推荐的替代方案：

- **`TryFrom/TryInto`**：可能失败的转换（带错误）

例子：窄化整数别用 `as`，用 `try_into`：

```rust
fn to_u8(x: u16) -> Option<u8> {
    x.try_into().ok()
}
```

---

## 5) 快速记忆版

- 整数窄化：可能截断
- 有符号/无符号互转：按补码重解释
- 浮点转整数：向 0 截断，NaN -> 0，溢出饱和
- `char`：建议用 `char::from_u32` 做校验

