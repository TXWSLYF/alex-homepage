import type { Components } from "react-markdown";
import { MarkdownAsync } from "react-markdown";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { rehypePrettyCodeOptions } from "@/lib/rehype-pretty-code-options";
import { CodeBlockWithCopy } from "@/app/components/codeblock-with-copy";

function resolveMediaSrc(src: string, slug: string): string {
  const trimmed = src.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) return trimmed;
  const name = trimmed.replace(/^\.\//, "");
  return `/blog-media/${encodeURIComponent(slug)}/${encodeURIComponent(name)}`;
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

function createComponents(slug: string): Components {
  return {
    img: ({ src, alt, ...props }) => {
    if (!src || typeof src !== "string") return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- blog body; dynamic URLs from markdown
      <img
        src={resolveMediaSrc(src, slug)}
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
    <figure
      className="my-6 max-w-full min-w-0 not-prose overflow-x-auto"
      {...props}
    >
      {children}
    </figure>
    ),
    table: ({ children, ...props }) => (
    <div className="my-6 max-w-full overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-left text-sm" {...props}>
        {children}
      </table>
    </div>
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
      <CodeBlockWithCopy className={className} {...props}>
        {children}
      </CodeBlockWithCopy>
    ),
  };
}

type Props = {
  content: string;
  slug: string;
};

/**
 * 使用 MarkdownAsync：rehype-pretty-code（Shiki）为异步插件，默认 Markdown 走 runSync 会报错
 * “runSync finished async. Use run instead”。
 */
export function BlogMarkdown({ content, slug }: Props) {
  return (
    <div
      className={[
        "prose prose-neutral min-w-0 w-full max-w-none dark:prose-invert",
        "wrap-anywhere",
        "prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:wrap-break-word",
        "prose-p:wrap-break-word prose-li:wrap-break-word",
        "prose-a:text-brand prose-a:break-all sm:prose-a:wrap-break-word",
        "prose-pre:bg-transparent prose-pre:p-0 prose-pre:shadow-none",
        /* 行内 code：不要用 prose-code 统一上色，否则会盖住 Shiki 在 pre>code 里对 span 的配色 */
        "prose-code:before:content-none prose-code:after:content-none",
        "[&_*:not(pre)>code]:rounded-md [&_*:not(pre)>code]:bg-surface-muted [&_*:not(pre)>code]:px-1.5 [&_*:not(pre)>code]:py-0.5 [&_*:not(pre)>code]:font-mono [&_*:not(pre)>code]:text-[0.9em] [&_*:not(pre)>code]:text-text-main",
      ].join(" ")}
    >
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypePrettyCode, rehypePrettyCodeOptions]]}
        components={createComponents(slug)}
      >
        {content}
      </MarkdownAsync>
    </div>
  );
}
