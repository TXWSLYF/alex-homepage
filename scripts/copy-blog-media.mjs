import { mkdir, readdir, copyFile, rm, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const fromDir = path.join(root, "content", "blog");
const toDir = path.join(root, "public", "blog-media");

async function existsDir(p) {
  try {
    const stat = await readdir(p);
    return Array.isArray(stat);
  } catch {
    return false;
  }
}

function isMarkdown(name) {
  return /\.md$/i.test(name);
}

function isHidden(name) {
  return name.startsWith(".");
}

function slugifyFromFilename(fileName) {
  const base = fileName.replace(/\.md$/i, "");
  return base
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCustomSlug(raw) {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  return t
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveSlug(mdFileName, frontmatter) {
  const fromFrontmatter = normalizeCustomSlug(frontmatter.postSlug ?? frontmatter.slug);
  if (fromFrontmatter) return fromFrontmatter;
  return slugifyFromFilename(mdFileName);
}

function parseFrontmatter(markdown) {
  // super light frontmatter parser: only need string keys (postSlug/slug)
  if (!markdown.startsWith("---")) return {};
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = markdown.slice(3, end).trim();
  const fm = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return fm;
}

function extractLocalAssets(markdown) {
  // capture markdown images/links: ![alt](./file) / ![alt](file) / [x](./file)
  // we only support same-dir file references to avoid path traversal.
  const results = new Set();
  const re = /(?:!\[[^\]]*]\(|\[[^\]]*]\()([^)#?\s]+)(?:#[^)]*)?\)/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const raw = m[1];
    if (!raw) continue;
    if (/^(https?:)?\/\//i.test(raw)) continue;
    if (raw.startsWith("/")) continue;
    const cleaned = raw.replace(/^\.\/+/, "");
    if (!cleaned || cleaned.includes("/") || cleaned.includes("\\")) continue;
    if (isMarkdown(cleaned) || isHidden(cleaned)) continue;
    results.add(cleaned);
  }
  return Array.from(results);
}

async function main() {
  const hasFrom = await existsDir(fromDir);
  if (!hasFrom) return;

  // ensure deletions are reflected
  await rm(toDir, { recursive: true, force: true });
  await mkdir(toDir, { recursive: true });

  const entries = await readdir(fromDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);
  const mdFiles = files.filter((n) => isMarkdown(n) && !isHidden(n));

  // copy assets per-article (by slug)
  for (const mdName of mdFiles) {
    const mdPath = path.join(fromDir, mdName);
    const md = await readFile(mdPath, "utf8");
    const fm = parseFrontmatter(md);
    const slug = resolveSlug(mdName, fm);
    const assets = extractLocalAssets(md);
    if (assets.length === 0) continue;

    // Keep folder name unencoded to match Next's static file lookup (it decodes the URL path).
    const outDir = path.join(toDir, slug);
    await mkdir(outDir, { recursive: true });

    for (const assetName of assets) {
      const src = path.join(fromDir, assetName);
      const dst = path.join(outDir, assetName);
      try {
        await copyFile(src, dst);
      } catch {
        // ignore missing; keep build resilient
      }
    }
  }
}

await main();
