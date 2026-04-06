import type { Components } from "react-markdown";
import { MarkdownAsync } from "react-markdown";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { rehypePrettyCodeOptions } from "@/lib/rehype-pretty-code-options";

function resolveMediaSrc(src: string): string {
  const trimmed = src.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) return trimmed;
  const name = trimmed.replace(/^\.\//, "");
  return `/blog-media/${encodeURIComponent(name)}`;
}

function isBlockCode(props: {
  className?: string;
  "data-theme"?: string;
}): boolean {
  return (
    Boolean(props.className?.includes("language-")) ||
    typeof props["data-theme"] === "string"
  );
}

const components: Components = {
  img: ({ src, alt, ...props }) => {
    if (!src || typeof src !== "string") return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- blog body; dynamic URLs from markdown
      <img
        src={resolveMediaSrc(src)}
        alt={alt ?? ""}
        className="my-6 max-h-[min(70vh,720px)] w-auto max-w-full rounded-lg border border-border-base"
        loading="lazy"
        {...props}
      />
    );
  },
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  figure: ({ children, ...props }) => (
    <figure className="my-6 not-prose" {...props}>
      {children}
    </figure>
  ),
  code: ({ className, children, ...props }) => {
    if (isBlockCode({ className, ...props })) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.9em] text-text-main"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, className, ...props }) => (
    <pre
      {...props}
      className={[
        "my-0 overflow-x-auto rounded-xl border border-border-base bg-surface-muted p-0 text-sm leading-relaxed shadow-sm",
        "[&_code]:block [&_code]:min-w-0 [&_code]:bg-transparent [&_code]:p-4 [&_code]:font-mono [&_code]:leading-relaxed [&_code]:text-[0.9em]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </pre>
  ),
};

type Props = {
  content: string;
};

/**
 * 使用 MarkdownAsync：rehype-pretty-code（Shiki）为异步插件，默认 Markdown 走 runSync 会报错
 * “runSync finished async. Use run instead”。
 */
export function BlogMarkdown({ content }: Props) {
  return (
    <div
      className={[
        "prose prose-neutral max-w-none dark:prose-invert",
        "prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-a:text-brand",
        "prose-pre:bg-transparent prose-pre:p-0 prose-pre:shadow-none",
        /* 行内 code：不要用 prose-code 统一上色，否则会盖住 Shiki 在 pre>code 里对 span 的配色 */
        "prose-code:before:content-none prose-code:after:content-none",
        "[&_*:not(pre)>code]:rounded-md [&_*:not(pre)>code]:bg-surface-muted [&_*:not(pre)>code]:px-1.5 [&_*:not(pre)>code]:py-0.5 [&_*:not(pre)>code]:font-mono [&_*:not(pre)>code]:text-[0.9em] [&_*:not(pre)>code]:text-text-main",
      ].join(" ")}
    >
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypePrettyCode, rehypePrettyCodeOptions]]}
        components={components}
      >
        {content}
      </MarkdownAsync>
    </div>
  );
}
