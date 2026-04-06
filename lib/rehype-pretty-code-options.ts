import type { Options } from "rehype-pretty-code";

/** Shiki 主题：与站点 `html.dark` 切换一致，样式见 globals.css */
export const rehypePrettyCodeOptions: Options = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
  bypassInlineCode: true,
};
