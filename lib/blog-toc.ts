import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { createHeadingSlugger } from "@/lib/heading-slug";

type MdNode = {
  type: string;
  depth?: number;
  children?: MdNode[];
  value?: string;
};

export type TocItem = {
  depth: 2 | 3 | 4;
  text: string;
  id: string;
};

export type BlogToc = {
  items: TocItem[];
  /** Every h1–h6 id, in document order. The renderer assigns these by index. */
  headingIds: string[];
};

function headingText(node: MdNode): string {
  return toString(node).replace(/\s+/g, " ").trim();
}

export function extractBlogToc(markdown: string): BlogToc {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const slug = createHeadingSlugger();
  const items: TocItem[] = [];
  const headingIds: string[] = [];

  visit(tree, "heading", (node) => {
    const heading = node as MdNode;
    const depth = heading.depth ?? 0;
    const text = headingText(heading);
    const id = slug(text);
    headingIds.push(id);
    if (depth === 2 || depth === 3 || depth === 4) {
      items.push({ depth, text: text || "未命名", id });
    }
  });

  return { items, headingIds };
}
