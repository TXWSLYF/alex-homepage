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
description: 从盐、慢哈希到一个可运行的最小密码哈希器：为什么单次 SHA-256 不够，多种算法如何靠头部共存，以及登录时怎样平滑升级。
---

明文把密码丢进数据库会怎样？把密码 SHA-256 一下再入库，是不是就安全了？

这篇文章按一条主线展开：**威胁从哪来 → 盐与慢哈希 → 自己实现一个最小 Password Hasher → 多算法共存与懒迁移 → 生产环境该用什么**。

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

PBKDF2、bcrypt、scrypt、Argon2 是专门做这件事的函数。第 3 节用标准库里的 PBKDF2 看清输入和输出；第 5 节讲多种算法怎样共存；第 6 节说明生产环境为什么更常选 Argon2id。

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

### 4.1 同一算法里调高工作因子

机器会变快。新注册直接用更高的 `ITERATIONS`。旧用户登录成功后，若记录里的轮数低于当前值，用刚刚验证过的密码再调一次 `hashPassword`，把新字符串写回去。参数写在字符串里，新旧记录可以同时存在。

这是最小的一种升级：算法不变，只改轮数。换成另一种算法时，时机相同，分发方式见第 5 节。

密码只进哈希函数：不写日志，不进错误上报，不出现在查询字符串里。

---

## 5. 多算法共存与平滑升级

校验不是「全站写死一种算法」。每条哈希自己带着头部，登录时先读头部，再交给对应的校验器。因此 `password_hash` 一列里可以同时躺着 `pbkdf2$...`、`$2b$...` 和 `$argon2id$...`。

> **核心结论：** 混合使用多种算法完全可行。头部让记录自描述，升级靠用户下次登录时顺手重算，而不是强制全员重置密码。

### 5.1 头部让记录自描述

注册或改密时，用**当前**算法生成哈希，把算法名和工作因子一起写入数据库。登录时不看全局配置，只看这一行：

1. **读出**该用户的哈希字符串。
2. **识别头部** — 看到 `$argon2id$` 走 Argon2，看到 `$2b$` 走 bcrypt，看到 `pbkdf2$` 走第 3 节的校验。
3. **按该算法的规则**比对密码。

| 头部 | 校验器 |
| :--- | :--- |
| `pbkdf2$sha256$...` | 第 3 节的 PBKDF2 |
| `$2a$` / `$2b$` / `$2y$` | bcrypt |
| `$argon2id$` | Argon2id |

识别方式就是按 `$` 切开，或对前缀做一次匹配。未知头部直接判失败，不要尝试用默认算法硬解。

### 5.2 升级发生在登录成功的那一次

系统从较弱的算法（或过低的工作因子）换到 Argon2id 时，有两条路：

| 做法 | 结果 |
| :--- | :--- |
| **强制重置** | 所有人立刻改密码。流失和客服压力都很大 |
| **懒迁移** | 新注册、改密用新算法；老用户下次登录成功时再换 |

懒迁移分三步：

1. **新写入一律用当前算法** — 注册和修改密码调用最新的 `hashPassword`。
2. **校验器继续认识旧算法** — 分发器同时保留 bcrypt、PBKDF2 和 Argon2id，旧行仍能登录。
3. **登录成功后顺手重算** — 明文密码只在这一刻出现。若头部或工作因子已经过期，用当前算法再哈希一次，覆盖旧值。

离线做不到这件事：旧哈希推不回明文，没有一次成功的登录，就没有重算新哈希的材料。长期不登录的账号会留在旧算法上，这是预期行为，旧校验器要一直留着。

第 4.1 节调高 PBKDF2 轮数，是同一套时机的缩小版。算法变了，或同一种算法的参数低于当前值，都算过期。

### 5.3 包装成一个密码服务

包装成一个密码服务：外面只看到 `hashPassword` 和 `verifyPassword`。`hashPassword` 永远走当前算法；`verifyPassword` 按头部路由。需要写回数据库时，再多一个 `verifyAndUpgrade`。

```javascript
import { hash as argon2Hash, verify as argon2Verify } from "argon2";
import bcrypt from "bcrypt";

const CURRENT = "argon2id";

function detectScheme(stored) {
  if (stored.startsWith("$argon2id$")) return "argon2id";
  if (
    stored.startsWith("$2a$") ||
    stored.startsWith("$2b$") ||
    stored.startsWith("$2y$")
  ) {
    return "bcrypt";
  }
  if (stored.startsWith("pbkdf2$")) return "pbkdf2";
  return null;
}

export async function hashPassword(password) {
  return argon2Hash(password);
}

export async function verifyPassword(password, stored) {
  const scheme = detectScheme(stored);
  if (scheme === "argon2id") return argon2Verify(stored, password);
  if (scheme === "bcrypt") return bcrypt.compare(password, stored);
  if (scheme === "pbkdf2") return verifyPbkdf2(password, stored);
  return false;
}

export async function verifyAndUpgrade(password, stored) {
  const ok = await verifyPassword(password, stored);
  if (!ok) return { ok: false, next: null };

  const outdated = detectScheme(stored) !== CURRENT;
  return {
    ok: true,
    next: outdated ? await hashPassword(password) : null,
  };
}
```

`verifyPbkdf2` 就是第 3 节的 `verifyPassword`。`next` 不是 `null` 时，登录成功的同一事务里把 `password_hash` 更新成新字符串。调用方仍然只收到「匹配或不匹配」，升级是校验通过之后的副作用。

---

## 6. 生产环境换掉手写循环

PBKDF2 适合把盐、轮数、存储格式讲清楚，很多系统用它也够。它主要靠 CPU 轮数减速，专用硬件可以并行堆算力。内存困难函数还会占住一块内存，并行度上不去。

| 方案 | 推荐度 | 说明 |
| :--- | :--- | :--- |
| **Argon2id** | 首选 | 同时占用 CPU 和内存，OWASP 当前推荐的默认选择 |
| **bcrypt** | 可用 | 生态成熟，成本因子好调；输入有 72 字节上限 |
| **scrypt** | 可用 | 同样是内存困难函数 |
| **PBKDF2** | 过渡 | 标准库自带；没有内存困难，轮数要跟着建议更新 |
| **单次 SHA-256 / MD5** | 不用 | 为速度设计，不适合保护密码 |

> **核心结论：** 自己实现是为了看清盐、工作因子和存储格式。上线用经过审计的 **Argon2id**（或 bcrypt）库，不要发明新的哈希算法。

参数跟着 [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) 当时的建议走，再在部署机器上量一次延迟。算法名和参数照第 3 节写进存储字符串，换代步骤按第 5 节做懒迁移。

---

## 7. 总结

密码哈希可以记成六道关：

| 关卡 | 名称 | 要点 |
| :---: | :--- | :--- |
| 1 | **盐** | 每用户随机，相同密码得到不同结果 |
| 2 | **慢哈希** | 工作因子写进存储字符串 |
| 3 | **校验** | 常量时间比较；错误信息不分流 |
| 4 | **头部** | 先认算法，再调用对应校验器 |
| 5 | **懒迁移** | 登录成功后用当前算法覆盖旧哈希 |
| 6 | **生产** | Argon2id，参数跟随 OWASP |

日常再记两条：

- **不要为了换算法强制重置** → 新写入用当前算法，旧校验器留着，登录成功时升级
- **算法和参数跟哈希存在一起** → 同一列里多种格式可以长期共存
