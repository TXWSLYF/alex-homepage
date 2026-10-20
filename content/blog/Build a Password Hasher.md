---
author: Alex
pubDatetime: 2026-10-20T11:41:00+09:00
title: Build a Password Hasher
postSlug: ""
tags:
  - security
  - Node.js
featured: false
draft: false
ogImage: ""
description: 从盐、慢哈希到一个可运行的最小密码哈希器：为什么单次 SHA-256 不够，以及生产环境为什么换成 Argon2id。
---

明文把密码丢进数据库会怎样？把密码 SHA-256 一下再入库，是不是就安全了？

这篇文章按一条主线展开：**威胁从哪来 → 盐与慢哈希 → 自己实现一个最小 Password Hasher → 校验与升级 → 生产环境该用什么**。

---

## 1. 密码哈希在防什么

注册时用户交出密码，服务端要能在登录时判断「是不是同一个人」，同时数据库一旦泄露，也不能把可用的密码交出去。

### 1.1 哈希不是加密

| | |
| :--- | :--- |
| **含义** | 单向变换：从哈希值推不回原密码，也没有「解密密钥」 |
| **特点** | 相同输入得到相同输出；用来做校验，不用来还原原文 |

加密可以解密。密钥还在，数据库管理员或拿到备份的人就能读出密码。密码存储要的是单向验证：只回答匹配或不匹配。

### 1.2 只用一次快哈希为什么不够

| 现象 | 原因 |
| :--- | :--- |
| 两个用户密码相同，库里的哈希也相同 | 没有盐，可以直接对照预先算好的表，或拿一份泄露库去撞另一份 |
| 常见弱密码会被很快试完 | SHA-256、MD5 为速度而设计，攻击者可以并行试大量候选 |

> **核心结论：** 密码哈希 = **每个用户独立的盐** + **故意变慢的密钥派生**，而不是「把密码过一遍快哈希」。

---

## 2. 三个必备零件

一个能上线的密码哈希器，至少要把下面三件事做对。第 3 节会把它们收成一个函数。

### 2.1 Salt

每个密码生成一段随机盐，和哈希一起存。盐不需要保密。它让相同密码得到不同结果，也让「事先算好一张常用密码表」失效——表必须针对这一份盐重算。

盐要足够长、用密码学安全的随机数生成。16 字节是常见起点。

### 2.2 工作因子

把派生重复很多轮，或让它占用大量内存，提高试一个候选密码的成本。这个参数必须和哈希一起存：否则以后无法校验，也无法在机器变快时只调高新密码的成本。

### 2.3 密钥派生函数

PBKDF2、bcrypt、scrypt、Argon2 是专门做这件事的函数。第 3 节用标准库里的 PBKDF2 看清输入和输出；第 5 节说明生产环境为什么更常选 Argon2id。

### 2.4 Pepper（可选）

Pepper 是放在服务器上的额外密钥，不进数据库。数据库泄露、应用密钥还在时，多一道障碍。它和盐不同：盐每个用户一份，可以公开；pepper 全局一份，必须保密。pepper 丢了，已有密码都无法再校验。

---

## 3. 实现一个最小 Password Hasher

目标很窄：给定密码，产出一段可存储的字符串；给定密码和这段字符串，回答是否匹配。算法名、摘要算法和轮数都写进字符串，避免藏在代码常量里、以后对不上旧数据。

存储格式：

```text
pbkdf2$sha256$<iterations>$<salt>$<hash>
```

```javascript
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const DIGEST = "sha256";

export function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_BYTES, DIGEST);
  return [
    "pbkdf2",
    DIGEST,
    String(ITERATIONS),
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

export function verifyPassword(password, stored) {
  const parts = stored.split("$");
  if (parts.length !== 5) return false;

  const [scheme, digest, iterStr, saltB64, hashB64] = parts;
  if (scheme !== "pbkdf2" || digest !== DIGEST) return false;

  const iterations = Number(iterStr);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  const actual = pbkdf2Sync(
    password,
    salt,
    iterations,
    expected.length,
    digest,
  );

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
```

| 字段 | 作用 |
| :--- | :--- |
| `scheme` / `digest` | 换算法后，旧记录仍按自己的参数校验 |
| `iterations` | 工作因子，和哈希绑在一起 |
| `salt` | 每用户随机，`base64url` 方便放进一列文本 |
| `hash` | PBKDF2 派生出的 32 字节 |

`600_000` 取的是 OWASP Password Storage Cheat Sheet 里 PBKDF2-HMAC-SHA256 的量级，当作起点，不是永恒常量。在自己的机器上把单次哈希调到用户能接受的延迟，再把当时的轮数写进字符串。

**结论：** 哈希器只做两件事——注册时 `hashPassword`，登录时 `verifyPassword`。盐和轮数都在输出里，不另开列也能共存新旧参数。

### 3.1 为什么用 `timingSafeEqual`

逐字节的 `===` 遇到第一个不同字节就返回。若攻击者能稳定测量响应时间，就有机会按字节去逼近哈希值。`timingSafeEqual` 对同样长度的两段数据走完比较。

两段长度不同时它会抛错，所以要先判断 `actual.length !== expected.length`。

---

## 4. 接进注册和登录

空密码、过短密码在进哈希函数之前就拒绝。哈希函数不负责密码策略。

```javascript
// 注册
const stored = hashPassword(password);
await db.insert({ email, passwordHash: stored });

// 登录
const user = await db.findByEmail(email);
const ok = user && verifyPassword(password, user.passwordHash);
if (!ok) {
  throw new Error("invalid credentials");
}
```

失败时不要区分「用户不存在」和「密码错误」。两条路径返回同一句话，减少用登录接口枚举账号。

### 4.1 调高工作因子

机器会变快。新注册直接用更高的 `ITERATIONS`。旧用户登录成功后，若记录里的轮数低于当前值，用刚刚验证过的密码再调一次 `hashPassword`，把新字符串写回去。参数在字符串里，新旧记录可以并存。

密码只进哈希函数：不写日志，不进错误上报，不出现在查询字符串里。

---

## 5. 生产环境换掉手写循环

PBKDF2 适合把盐、轮数、存储格式讲清楚，很多系统用它也够。它主要靠 CPU 轮数减速，专用硬件可以并行堆算力。内存困难函数还会占住一块内存，并行度上不去。

| 方案 | 推荐度 | 说明 |
| :--- | :--- | :--- |
| **Argon2id** | 首选 | 同时占用 CPU 和内存，OWASP 当前推荐的默认选择 |
| **bcrypt** | 可用 | 生态成熟，成本因子好调；输入有 72 字节上限 |
| **scrypt** | 可用 | 同样是内存困难函数 |
| **PBKDF2** | 过渡 | 标准库自带；没有内存困难，轮数要跟着建议更新 |
| **单次 SHA-256 / MD5** | 不用 | 为速度设计，不适合保护密码 |

> **核心结论：** 自己实现是为了看清盐、工作因子和存储格式。上线用经过审计的 **Argon2id**（或 bcrypt）库，不要发明新的哈希算法。

参数跟着 [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) 当时的建议走，再在部署机器上量一次延迟。算法名和参数照第 3 节的方式写进存储字符串，以后才能平滑换代。

---

## 6. 总结

密码哈希可以记成五道关：

| 关卡 | 名称 | 要点 |
| :---: | :--- | :--- |
| 1 | **盐** | 每用户随机，相同密码得到不同结果 |
| 2 | **慢哈希** | 工作因子写进存储字符串 |
| 3 | **校验** | 常量时间比较；错误信息不分流 |
| 4 | **升级** | 登录成功后按当前参数重哈希 |
| 5 | **生产** | Argon2id，参数跟随 OWASP |

日常再记两条：

- **密码只进哈希函数** → 不进日志、不进错误上报
- **算法和参数跟哈希存在一起** → 以后换算法不用迁移脚本猜格式
