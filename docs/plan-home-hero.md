---
name: 首页 Hero 设计建议
overview: 首页信息架构：极简 Hero +「最新博客」摘要（2 张卡片）+「精选摄影」炫酷展示区；与 About 长文、Blog 全文页分工明确；**动效**用 Motion 库 + `prefers-reduced-motion` 降级；实现时对齐现有 design token。
todos:
  - id: content-lock
    content: 确定姓名/一句话介绍/主副 CTA、头像与外链；博客与摄影占位文案或真实素材路径
    status: completed
  - id: hero-component
    content: 新增 Home Hero 并替换 app/page.tsx 中 PlaceholderShell
    status: completed
  - id: home-blog-teaser
    content: 首页「最新博客」区块：2 张卡片，链到 /blog 或单篇；数据可先静态再换 MDX/内容源
    status: completed
  - id: home-gallery
    content: 首页「精选摄影」区块：3～6 张图 + 炫酷布局（如叠放/透视/轻 hover）；图片放 public 或 next/image
    status: completed
  - id: motion-setup
    content: 安装 motion（或 framer-motion），封装 useReducedMotion 降级；首页各区块用 client 组件做进场/交错动画
    status: completed
  - id: polish
    content: 背景锚点、暗色对比与动效强度统一验收（含 prefers-reduced-motion）
    status: pending
isProject: true
---

# 首页设计建议（亮眼 + 快速了解）

> 本文档由计划整理并纳入仓库。实现入口：`app/page.tsx`，文案与数据见 `content/`。

## 目标（访客 3～10 秒内）

- **第一眼**：风格统一、有记忆点（排版/动效/背景其一即可，不必堆特效）。
- **第二眼**：**名字/身份 + 1～2 句极简自我介绍**（你解决什么问题、擅长什么）。
- **第三眼**：**两条路径**：深入（About / Work）或联系（若你有邮箱/GitHub）。主页不展开细节。

参考站如 [Magic Portfolio Demo](https://demo.magic-portfolio.com/)、[leoku.dev](https://leoku.dev/zh)、[chronark.com](https://www.chronark.com/) 的共性是：**大标题 + 极短副文案 + 少量高对比 CTA**，导航已承担「栏目入口」，Hero 只负责**定调与摘要**。

---

## 推荐信息结构（自上而下）

| 区块 | 作用 | 内容示例（你可替换为真实文案） |
|------|------|-------------------------------|
| **Eyebrow** | 建立场景/标签 | 城市与时区、或「Design × Code」类短标签 |
| **主标题 (H1)** | 记忆点 | 你的姓名或昵称 + 可选一行**渐变/品牌色**强调词 |
| **副标题 (1～2 行)** | 快速了解 | 只写“结论句”：你是谁 + 你做什么（不写经历与履历） |
| **主 CTA + 次 CTA** | 转化 | 主：更推荐指向 **`/work`**（先看作品）；次：`/about`（详细介绍）或外链简历/GitHub |
| **可选：3 个要点** | 扫读 | 图标 + 短语（栈、方向、当前状态），用 `text-text-sub` 层级 |

避免在首屏塞**完整履历/经历时间线/长段落**；这些全部交给 About。主页只保留“摘要 + 引导”。

### 主页下半区（与 About 不重复）

- **最新博客（2 张卡片）**  
  - **作用**：证明你在持续输出、给访客「可点进去读」的入口；只展示**标题 + 日期/摘要一行 + 封面（可选）**，不写长文。  
  - **与 Blog 列表页**：首页是「抽样」，[`/blog`](../app/blog/page.tsx) 才是完整列表与归档。  
  - **与 About**：About 讲人；博客卡片讲**话题与更新**，不重复个人经历长文。

- **精选摄影（炫酷小展区）**  
  - **作用**：视觉冲击与个性（「你还会拍照」），比纯文字 Hero 更容易「眼前一亮」。  
  - **建议规模**：3～6 张为宜；可一条横向滚动、或「错落叠放 + 轻倾斜 + hover 放大」一类（控制动效强度，尊重 `prefers-reduced-motion`）。  
  - **与 Gallery**：首页是**精选子集** + 链到 [`/gallery`](../app/gallery/page.tsx) 看全集；避免首页堆大量图。

---

## 视觉与「眼前一亮」（在不过度设计的前提下）

1. **排版**：主标题用较大字号与略紧的 `tracking`；副文用 `text-text-sub`；与 [app/globals.css](../app/globals.css) 里 `text-main` / `brand` 体系一致。
2. **一个视觉锚点**（三选一即可）  
   - **柔和背景**：极淡的径向渐变或噪点（可用 `color-mix` + 现有 `--background`，与已注释的 `body::before` 思路一致）。  
   - **品牌色点缀**：Eyebrow 或小标签用 `text-brand` / `border-border-base`。  
   - **轻动效**：首屏 `opacity` + `translate` 的短动画（`prefers-reduced-motion` 时关闭）。
3. **头像/Logo（可选）**：小圆图或首字母，增强「人」的识别；不放也可以，靠字重与层级即可。

---

## 动效支持（你要求必须有）

- **依赖（实现时安装）**  
  - 推荐 **[Motion](https://motion.dev/)** 的 React 集成：包名一般为 **`motion`**（与 Framer Motion 同源演进，适配 React 19 较好）。  
  - 备选：**`framer-motion`**（成熟、文档多；若团队更熟可继续用）。  
  - **不装库也可**：纯 CSS `transition` + `@keyframes` 能做轻量进场，但「错落 stagger、scroll-linked」等用库更省事。

- **建议动效范围（克制、可用）**  
  - **Hero**：标题/副标题/CTA **stagger 进场**（短时长，如 0.35～0.6s）。  
  - **博客 2 卡**：列表 **stagger** 或轻微 `y` + `opacity`。  
  - **摄影区**：**hover 放大/阴影**、可选极弱 **parallax**（注意性能）；网格可用交错 delay。  
  - **全局**：监听 **`prefers-reduced-motion: reduce`** 时 **关闭或改为仅 opacity 瞬间出现**，避免眩晕。

- **技术注意**  
  - 动效组件放在 **Client Component**（`"use client"`）；页面骨架仍可 Server Component 组合。  
  - 与 `next/image` 同区时，避免对图片做过度 layout 动画导致 CLS。

---

## 与当前代码的衔接（实现时）

- 首页结构建议为**纵向多段**：`Hero` → `LatestBlog`（2 卡）→ `PhotoSpotlight` → 可选页脚链接；在 [app/page.tsx](../app/page.tsx) 组合，而不是继续单独使用通用 [app/components/placeholder-shell.tsx](../app/components/placeholder-shell.tsx) 作为整页。
- **博客数据**：由 `lib/blog.ts` 读取 `content/blog/*.md`（标题、slug、日期、摘要等）；首页 teaser 由服务端传入最新条目。
- **摄影资源**：`public/photos/...` + `next/image`；精选列表同样可先静态配置数组。
- 文案与链接建议集中在一处（如 `content/home.ts`），便于以后改文案而不改 JSX 结构。
- 保持与顶栏 [app/components/floating-nav.tsx](../app/components/floating-nav.tsx) 的间距（Hero 顶部 `pt-24` 量级可延续；下方区块用 `py-16`～`py-24` 分段）。

---

## 需要你拍板的两点（避免做偏）

若你希望下一步**直接落地成代码**，建议先定：

1. **首屏主 CTA**：是否按你说的方向，固定为 **`/work`**（看作品）？  
2. **是否放头像/社交链接**：有则 Hero 右侧或标题旁留位；无则纯文字 Hero 更干净。

**博客与摄影（实现前可再定）**：博客是否已有真实文章与 slug；摄影图是否已有一批可放进 `public/` 的文件名。没有则先用占位卡片与占位图，结构先上线。

定稿后可在实现阶段把上述结构拆成组件并接入现有 design token（`bg-background`、`text-text-main`、`text-brand`、`bg-ui-hover` 等），并接上 **Motion** 动效层与 **reduced-motion** 降级。

---

## 仓库内实现对照（便于维护）

| 计划项 | 位置 |
|--------|------|
| Hero | `app/components/home-hero.tsx`，文案 `content/home.ts` |
| 博客两卡 | `app/components/home-blog-teaser.tsx`，数据来自 `getLatestPosts()` |
| 文章占位页 | `app/blog/[slug]/page.tsx` |
| 摄影区 | `app/components/home-photo-spotlight.tsx`，数据 `content/photos.ts` |
| 动效预设 | `lib/motion-presets.ts`，组件内 `useReducedMotion`（`motion/react`） |
