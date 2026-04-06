import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogListItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
};

export type BlogPost = BlogListItem & {
  content: string;
  tags: string[];
  author?: string;
  featured?: boolean;
  ogImage?: string;
};

function extractFirstImageSrc(markdown: string): string | null {
  // Prefer markdown image syntax: ![alt](src)
  const re = /!\[[^\]]*]\(([^)#?\s]+)(?:#[^)]*)?\)/m;
  const m = markdown.match(re);
  if (!m) return null;
  const src = (m[1] ?? "").trim();
  if (!src) return null;
  return src;
}

function toCoverUrl(src: string, slug: string): string | undefined {
  const trimmed = src.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  const name = trimmed.replace(/^\.\/+/, "");
  // only support same-dir file reference (no subdirs)
  if (!name || name.includes("/") || name.includes("\\")) return undefined;
  // Keep slug unencoded so Next can resolve to the on-disk folder name in `public/`.
  // The browser will percent-encode the URL on request; Next decodes before filesystem lookup.
  return `/blog-media/${slug}/${encodeURIComponent(name)}`;
}

function slugifyFromFilename(fileName: string): string {
  const base = fileName.replace(/\.md$/i, "");
  // Allow unicode letters/numbers so non-English filenames still get a stable slug.
  // e.g. `数据库主键选择总结.md` -> `数据库主键选择总结`
  // e.g. `postgresql 初始化.md` -> `postgresql-初始化`
  return base
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCustomSlug(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  // Match `slugifyFromFilename` behavior for consistency.
  return t
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveSlug(fileName: string, data: Record<string, unknown>): string {
  const fromFrontmatter = normalizeCustomSlug(data.postSlug ?? data.slug);
  if (fromFrontmatter) return fromFrontmatter;
  return slugifyFromFilename(fileName);
}

function parseDate(data: Record<string, unknown>): Date {
  const raw =
    data.pubDatetime ?? data.pubDate ?? data.date ?? data.publishedAt;
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  if (typeof raw === "string" || typeof raw === "number") {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

function formatDate(d: Date): string {
  if (isNaN(d.getTime()) || d.getTime() === 0) return "";
  return d.toISOString().slice(0, 10);
}

function parseTags(data: Record<string, unknown>): string[] {
  const t = data.tags;
  if (!Array.isArray(t)) return [];
  return t.filter((x): x is string => typeof x === "string");
}

function parseMarkdownFile(fileName: string): BlogPost | null {
  if (!fileName.endsWith(".md")) return null;
  const fullPath = path.join(BLOG_DIR, fileName);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data: rawData, content } = matter(raw);
  const data = rawData as Record<string, unknown>;

  if (Boolean(data.draft)) return null;

  const slug = resolveSlug(fileName, data);
  const title =
    typeof data.title === "string"
      ? data.title
      : fileName.replace(/\.md$/i, "");
  const dateObj = parseDate(data);
  const date = formatDate(dateObj);
  const excerpt =
    (typeof data.description === "string" && data.description) ||
    (typeof data.excerpt === "string" && data.excerpt) ||
    "";

  const firstImageSrc = extractFirstImageSrc(content);
  const coverImage = firstImageSrc ? toCoverUrl(firstImageSrc, slug) : undefined;

  const author =
    typeof data.author === "string" ? data.author : undefined;
  const featured =
    typeof data.featured === "boolean" ? data.featured : undefined;
  const ogImage =
    typeof data.ogImage === "string" && data.ogImage.trim() !== ""
      ? data.ogImage
      : undefined;

  return {
    slug,
    title,
    date,
    excerpt,
    coverImage,
    content,
    tags: parseTags(data),
    author,
    featured,
    ogImage,
  };
}

function readAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const names = fs.readdirSync(BLOG_DIR);
  const posts: BlogPost[] = [];
  for (const name of names) {
    const post = parseMarkdownFile(name);
    if (post) posts.push(post);
  }
  posts.sort((a, b) => {
    const da = a.date || "";
    const db = b.date || "";
    return db.localeCompare(da);
  });
  return posts;
}

let cache: BlogPost[] | null = null;

function allPublished(): BlogPost[] {
  if (process.env.NODE_ENV === "production" && cache) return cache;
  const posts = readAllPosts();
  if (process.env.NODE_ENV === "production") cache = posts;
  return posts;
}

export function getAllPosts(): BlogListItem[] {
  return allPublished().map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
  }));
}

export function getLatestPosts(n: number): BlogListItem[] {
  return getAllPosts().slice(0, n);
}

export function getAllSlugs(): string[] {
  return allPublished().map((p) => p.slug);
}

function safeDecodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  const normalized = safeDecodeSlug(slug);
  return allPublished().find((p) => p.slug === normalized) ?? null;
}
