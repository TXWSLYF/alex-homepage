---
author: Alex
pubDatetime: 2025-08-27T11:52:00+09:00
title: javascript 异常处理
postSlug: ""
tags:
  - javascript
  - 异常处理
featured: false
draft: false
ogImage: ""
description: javascript 异常处理
---

javascript 异常包括

1. **同步异常**
2. **异步异常**
3. **Promise 异常**

本文将分析各个异常的不同表现形式，以及它们在 Node.js 和浏览器环境下的处理方式。

---

## 1️⃣ 同步异常

最基本的异常就是 **同步代码里抛出的错误**：

```js
function foo() {
  throw new Error("同步异常");
}

try {
  foo();
} catch (err) {
  console.log("捕获到异常:", err.message);
}
```

特点：

1. `throw` 会立即停止当前函数的执行。
2. 异常会沿调用栈向上传递，直到被 `try/catch` 捕获。
3. 如果没有捕获，JS 引擎会将其视为未捕获异常（uncaught exception）。

   - **浏览器**：会在控制台打印错误，但一般不会停止整个 JS 线程。
   - **Node.js**：默认会终止进程（除非注册了 `process.on('uncaughtException')`）。

---

## 2️⃣ 异步异常 — 回调函数

在 JS 里，最早的异步机制是 **回调**：

```js
setTimeout(() => {
  throw new Error("异步异常");
}, 1000);
```

**注意**：

- 这个 `throw` 并不是同步执行的。
- **try/catch 捕获不了它**，因为 try/catch 捕获的是同步代码异常。

```js
try {
  setTimeout(() => {
    throw new Error("异步异常");
  }, 1000);
} catch (err) {
  console.log("捕获到吗？", err); // ❌ 捕获不到
}
```

- 在浏览器里会在控制台报错，但不会影响主线程继续执行。
- 在 Node.js 中，如果没有 `process.on('uncaughtException')`，会终止进程。

> **总结**：传统回调的异步异常，必须在回调内部处理，否则无法被外部捕获。

---

## 3️⃣ Promise 异常（ES6+）

Promise 引入了 **链式异常控制**：

```js
new Promise((resolve, reject) => {
  reject(new Error("Promise reject"));
})
  .then(() => console.log("成功"))
  .catch(err => console.log("捕获到异常:", err.message));
```

特点：

1. **reject 会被下一个 `.catch()` 捕获**。
2. 如果没有 `.catch()`，Node.js 就会触发 **unhandledRejection**。
3. `async/await` 本质上就是 **语法糖**，它把 Promise reject 转换成了同步抛异常的风格。

---

### 3.1 async/await 和 try/catch

```js
async function foo() {
  await Promise.reject(new Error("异步异常"));
}

foo().catch(err => console.log("捕获到异常:", err.message));
```

- `await` 会把 Promise reject 转换成 **抛异常**的形式：

  ```js
  throw await promise;
  ```

- 因此可以用 `try/catch` 捕获：

```js
async function foo() {
  try {
    await Promise.reject(new Error("异步异常"));
  } catch (err) {
    console.log("捕获到异常:", err.message);
  }
}
```

---

## 4️⃣ Node.js 的异常控制流特点

Node.js 里有两个关键事件：

1. **同步未捕获异常**：

   ```js
   process.on("uncaughtException", err => {
     console.error("捕获到同步异常:", err);
   });
   ```

2. **Promise 未处理异常**：

   ```js
   process.on("unhandledRejection", (reason, promise) => {
     console.error("未处理的Promise异常:", reason);
   });
   ```

- **关键区别**：

  - `uncaughtException` → 只处理同步 throw。
  - `unhandledRejection` → 处理 Promise reject（没有 catch 的）。

- 从 Node v15+ 起，未处理 Promise reject 默认会终止进程。

---

## 5️⃣ 异常控制流的传递规则

可以总结成一张逻辑表：

| 异常类型         | 是否同步 | 捕获方式                          | Node.js 默认行为                         |
| ---------------- | -------- | --------------------------------- | ---------------------------------------- |
| `throw`          | ✅ 同步  | try/catch                         | 未捕获 → 进程终止                        |
| 回调里 `throw`   | ❌ 异步  | 回调内部 try/catch                | 未捕获 → 进程终止                        |
| Promise reject   | ❌ 异步  | `.catch()` 或 `await + try/catch` | 未捕获 → `unhandledRejection` → 进程终止 |
| async 函数 throw | ❌ 异步  | `try/catch` 或 `.catch()`         | 未捕获 → `unhandledRejection` → 进程终止 |

---

## 🔑 核心结论

1. **同步异常** → try/catch 捕获。
2. **异步异常（Promise reject）** → 必须用 `.catch()` 或 `await + try/catch`。
3. **未处理异常** → Node.js 会终止进程，浏览器只报错。

---

最后再看几个特殊的例子

```js
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject("error");
  }, 1000);
});

async function main() {
  try {
    await promise;
  } catch (err) {
    console.log(err);
  }
}

main();
```

等价于

```js
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject("error");
  }, 1000);
});

function main() {
  promise.catch(err => {
    console.log(err);
  });
}

main();
```

下面这个例子中，try catch 并不能捕获到 promise.catch 中 throw 的 err

```js
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject("error");
  }, 1000);
});

async function main() {
  try {
    promise.catch(err => {
      throw err;
    });
  } catch (error) {
    console.log(error);
  }
}

main();
```

下面这个例子中，main 函数延迟 2s 执行，这种情况下 try catch 也捕获不到 err

```js
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject("error");
  }, 1000);
});

async function main() {
  try {
    await promise;
  } catch (error) {
    console.log(error);
  }
}

setTimeout(() => {
  main();
}, 2000);
```

但是如果把 2s 改为 0.5s，这种情况下就能 catch 到 err 了

```js
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject("error");
  }, 1000);
});

async function main() {
  try {
    await promise;
  } catch (error) {
    console.log(error);
  }
}

setTimeout(() => {
  main();
}, 500);
```

---
