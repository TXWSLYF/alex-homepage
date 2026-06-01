---
author: Alex
pubDatetime: 2026-06-01T12:00:00+09:00
title: useSyncExternalStore 精准订阅：极简外部 Store 与强类型 i18n
postSlug: ""
tags:
  - React
  - TypeScript
  - i18n
  - Zustand
featured: false
draft: false
ogImage: ""
description: 用 useSyncExternalStore 写一个极小的外部 store，并用 TS 递归类型推导点路径 key，实现零 any、编译期可校验的 i18n。
---

你是不是也遇到过：切换语言（Locale）之后，页面里一些不展示文案的组件也跟着重渲染；或者 i18n 的 key 全靠字符串拼写，写错了只能靠测试或线上兜底？

本文想解决两件事：**减少不必要的刷新**，以及**把 i18n key 的错误尽量前置到编译期**。整体路径是：**先解释 Context 为什么容易“整包广播” → 再用 `useSyncExternalStore` 做一个极小的外部 store（类似 Zustand 的思路） → 最后用 TypeScript 推导点路径 key，让 `t("nav.home")` 有补全也能校验**。

本文配套示例源码在这里：[TXWSLYF/mini-zustand-i18n](https://github.com/TXWSLYF/mini-zustand-i18n)。

---

## 1. 从 Context 的“整包广播”说起

在 React 生态里，国际化（i18n）和全局状态管理几乎是中大型项目标配。轻量项目最常见的做法，是直接用 `Context` 分发语言包（字典）：

- **做法**：`<I18nProvider value={{ locale, dict }}>`，业务里 `useContext(I18nContext)` 拿字典翻译。
- **问题**：Context 的更新是**粗粒度广播**——只要 Provider 的 `value` 引用变了，所有订阅了这个 Context 的组件都会被标记更新。

当你把整包字典塞进 `Context` 的 `value`，切换语言时通常意味着 `value` 是个新对象。React 会沿着 Fiber 树向下传播这次更新：即使某个组件只负责布局或动画、不展示任何文案，它只要在 Provider 子树里并且订阅了该 Context，就可能被触发重渲染。

如果你希望“谁用到谁刷新”，本质是把两件事拆开：

1. **状态存储与订阅**：交给一个 React 之外的外部 store，并且支持 selector 级别订阅。
2. **翻译与 key 约束**：在业务侧拿到 `t()` 时就具备补全与类型校验，写错直接编译期报错。

---

## 2. 手写一个极小的外部 store（useSyncExternalStore）

很多状态管理库（例如 Zustand）走的是同一条路线：状态不存放在 React 内部，而是存在一个纯 JavaScript 的闭包对象里。React 只负责订阅外部状态并在需要时刷新。

React 18+ 提供了一个标准桥梁：`useSyncExternalStore`。用它，我们可以写一个极简的外部状态机，并让组件安全地订阅它。

下面是一份“足够小但可用”的实现：零 `any`、类型严格、订阅与更新路径清晰。它不追求覆盖完整 Zustand 能力（中间件、devtools、持久化等），目的只是把核心机制讲清楚。

### 2.1 `src/mini-zustand.ts`

```typescript
import { useSyncExternalStore } from "react";

type BaseState = object;

type SetStateAction<S extends BaseState> =
  | Partial<S>
  | ((state: S) => Partial<S>);

type CreateState<S extends BaseState> = (
  set: (partial: SetStateAction<S>) => void,
  get: () => S,
) => S;

export const create = <S extends BaseState>(createState: CreateState<S>) => {
  let state: S;
  const listeners = new Set<() => void>();

  const getState = (): S => state;

  const setState = (partial: SetStateAction<S>) => {
    const nextPartial =
      typeof partial === "function"
        ? (partial as (s: S) => Partial<S>)(state)
        : partial;

    const nextState = Object.assign({}, state, nextPartial);

    if (!Object.is(nextState, state)) {
      state = nextState;
      listeners.forEach((listener) => listener());
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  state = createState(setState, getState);

  return <U>(selector: (s: S) => U): U =>
    useSyncExternalStore(subscribe, () => selector(getState()));
};
```

### 2.2 关键点

| | |
| :--- | :--- |
| **状态在闭包里** | `state` 不属于 React，更新不会触发“父组件连带渲染” |
| **精准订阅** | 每个组件用 `selector` 订阅自己关心的 slice |
| **与 React 对接** | `useSyncExternalStore` 保证并发渲染下读写一致性 |

有了这个地基，我们就可以把 i18n 的 “locale 状态” 放进 store，只让真正依赖 `locale` 的组件刷新。

---

## 3. 让 i18n key 变成类型：支持点路径补全与校验

真实项目的语言包经常是多层嵌套的：

```json
{
  "welcome": "你好",
  "nav": { "home": "首页", "about": "关于我们" }
}
```

普通的 `keyof` 只能拿到第一层（`"welcome" | "nav"`），没法让你在写 `t("nav.home")` 时获得补全与校验。

因此我们需要两部分：

1. **类型层**：递归把对象叶子路径压扁成点分隔 key 联合类型（例如 `"welcome" | "nav.home" | "nav.about"`）。
2. **运行时层**：根据点路径安全读取字典值；全程用 `unknown` 配合类型收窄，拒绝 `any`。

### 3.1 `src/mini-i18n.ts`

```typescript
import { create } from "./mini-zustand";

type Prev = [never, 0, 1, 2, 3, 4, 5, ...0[]];

type Leaves<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ?
              | `${K}`
              | (Leaves<T[K], Prev[D]> extends infer R
                  ? R extends string | number
                    ? `${K}.${R}`
                    : never
                  : never)
          : never;
      }[keyof T]
    : never;

const resources = {
  zh: {
    welcome: "你好，世界！",
    nav: { home: "首页", about: "关于我们" },
  },
  en: {
    welcome: "Hello, World!",
    nav: { home: "Home", about: "About Us" },
  },
} as const;

type Locale = keyof typeof resources;
type TranslationKeys = Leaves<(typeof resources)["zh"]>;

interface I18nState {
  locale: Locale;
  changeLanguage: (lang: Locale) => void;
}

const useI18nStore = create<I18nState>((set) => ({
  locale: "zh",
  changeLanguage: (lang) => set({ locale: lang }),
}));

export function useMiniTranslation() {
  const locale = useI18nStore((s) => s.locale);
  const changeLanguage = useI18nStore((s) => s.changeLanguage);

  const t = (key: TranslationKeys): string => {
    const dictionary = resources[locale];
    const paths = key.split(".");

    const result = paths.reduce<unknown>((currentObj, currentKey) => {
      if (currentObj && typeof currentObj === "object" && currentKey in currentObj) {
        return (currentObj as Record<string, unknown>)[currentKey];
      }
      return undefined;
    }, dictionary);

    return typeof result === "string" ? result : key;
  };

  return {
    t,
    i18n: { changeLanguage, language: locale },
  };
}
```

### 3.2 为什么要限制递归深度

类型体操本质是“编译期计算”。对非常深的字典，如果无上限递归，TS 编译器可能会出现类型展开过深导致的性能问题。

这里用 `Prev` 做“保险丝”，默认最多递归 5 层。对绝大多数 i18n 字典，这个深度足够；真有更深的结构，往往也意味着字典设计可以扁平化或分模块。

---

## 4. 在 React 里使用

有了 `useMiniTranslation`，业务侧调用就非常直观：

### 4.1 `src/App.tsx`

```tsx
import { useMiniTranslation } from "./mini-i18n";

export default function App() {
  const { t, i18n } = useMiniTranslation();

  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>{t("welcome")}</h1>

      <div
        style={{
          margin: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "6px",
        }}
      >
        <span style={{ color: "#666" }}>动态路由文案：</span>
        <strong style={{ marginRight: "15px" }}>{t("nav.home")}</strong>
        <strong>{t("nav.about")}</strong>
      </div>

      <hr style={{ borderColor: "#eee", margin: "30px 0" }} />

      <div>
        <button
          onClick={() => i18n.changeLanguage("zh")}
          style={{ marginRight: "10px", padding: "8px 16px", cursor: "pointer" }}
        >
          切换中文
        </button>
        <button
          onClick={() => i18n.changeLanguage("en")}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Switch to English
        </button>
      </div>
    </div>
  );
}
```

你会得到两个非常实用的体验：

1. **类型安全自动补全**：`t("` 后 IDE 会联想 `TranslationKeys` 联合类型。
2. **编译期防御**：写错 key（例如 `"nav.hommme"`）会立刻在类型层报错，Bug 在打包前就被扼杀。

---

## 5. 总结与适用边界

> **核心结论：** Context 的问题不在“不能用”，而在于它的订阅粒度就是“整包”。如果你确实需要“谁用到谁刷新”，外部 store + selector 往往更合适；同时让 i18n key 成为类型而不是字符串，可以把很多错误前置到编译期。

| 关卡 | 名称 | 要点 |
| :--- | :--- | :--- |
| 1 | **性能** | 外部 store + `useSyncExternalStore`，组件按 selector 精准订阅，不再被 Context 粗粒度广播误伤 |
| 2 | **类型安全** | 递归类型把嵌套字典压扁成点路径联合类型，`t(key)` 获得补全与错误拦截 |
| 3 | **工程洁净** | 全程零 `any`，运行时用 `unknown` + 收窄；Mini-Zustand 与 Mini-i18n 各司其职、可扩展 |

日常开发再记两条：

1. **把“变化源”外置**：只要某份数据会高频变化、且不该牵连无关组件，就优先考虑“外部 store + selector”，而不是 Context value 大对象直塞。
2. **让 key 成为类型**：i18n 的质量上限不在 `t()` 本身，而在 key 是否能被 IDE 补全、是否能被编译期约束。

如果你的项目规模不大、切语言极少发生、或者你已经通过拆分 Context（读写分离）把订阅粒度控制住了，那么继续用 Context 也完全合理。本文这套更适合：字典较大、更新影响面敏感、且你愿意用一点类型复杂度换取长期维护收益的场景。

