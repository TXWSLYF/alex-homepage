import type { ReactNode } from "react";
import { Children, isValidElement } from "react";
import type { Components } from "react-markdown";
import { MarkdownAsync } from "react-markdown";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { rehypePrettyCodeOptions } from "@/lib/rehype-pretty-code-options";
import { rehypeAssignHeadingIds } from "@/lib/rehype-heading-ids";
import { CodeBlockWithCopy } from "@/app/components/codeblock-with-copy";
import {
  CommandAwareCell,
  CommandTable,
  IndexedRow,
  MaybeCopyableCode,
} from "@/app/components/command-table-copy";

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

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return nodeText(props.children);
  }
  return "";
}

/** Column indexes whose header is 「命令」, so only cheat-sheet commands get a copy button. */
function commandColumnIndexes(children: ReactNode): number[] {
  const indexes: number[] = [];
  Children.forEach(children, (section) => {
    if (!isValidElement(section) || section.type !== "thead") return;
    const rows = (section.props as { children?: ReactNode }).children;
    Children.forEach(rows, (row) => {
      if (!isValidElement(row)) return;
      const cells = (row.props as { children?: ReactNode }).children;
      let index = 0;
      Children.forEach(cells, (cell) => {
        if (isValidElement(cell)) {
          const text = nodeText(
            (cell.props as { children?: ReactNode }).children,
          )
            .replace(/\s+/g, " ")
            .trim();
          if (text === "命令" || text.toLowerCase() === "command") {
            indexes.push(index);
          }
        }
        index += 1;
      });
    });
  });
  return indexes;
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
    table: ({ children, node: _node, ...props }) => (
      <CommandTable columns={commandColumnIndexes(children)} {...props}>
        {children}
      </CommandTable>
    ),
    tr: ({ children, node: _node, ...props }) => (
      <tr {...props}>
        <IndexedRow>{children}</IndexedRow>
      </tr>
    ),
    td: ({ children, node: _node, ...props }) => (
      <CommandAwareCell {...props}>{children}</CommandAwareCell>
    ),
    code: ({ className, children, node: _node, ...props }) => {
    if (isBlockCode({ className, ...props })) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return <MaybeCopyableCode className={className}>{children}</MaybeCopyableCode>;
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
  headingIds?: string[];
};

/**
 * 使用 MarkdownAsync：rehype-pretty-code（Shiki）为异步插件，默认 Markdown 走 runSync 会报错
 * “runSync finished async. Use run instead”。
 */
export function BlogMarkdown({ content, slug, headingIds = [] }: Props) {
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
        rehypePlugins={[
          [rehypeAssignHeadingIds, headingIds],
          [rehypePrettyCode, rehypePrettyCodeOptions],
        ]}
        components={createComponents(slug)}
      >
        {content}
      </MarkdownAsync>
    </div>
  );
}
