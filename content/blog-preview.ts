export type BlogPreviewItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
};

/** 首页「最新博客」预览；后续可改为从 MDX / CMS 读取 */
export const blogPreviewItems: BlogPreviewItem[] = [
  {
    slug: "design-tokens-in-practice",
    title: "在实践中落地 Design Tokens",
    date: "2026-03-12",
    excerpt: "从变量命名到暗色模式，让一套 token 撑起整站视觉。",
  },
  {
    slug: "motion-without-the-noise",
    title: "动效：克制比炫技更重要",
    date: "2026-02-28",
    excerpt: "用 stagger、hover 与 prefers-reduced-motion 做出「有质感」的交互。",
  },
];
