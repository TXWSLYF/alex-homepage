/**
 * Gallery R2 同步与静态清单生成。
 *
 * 约定（与现有桶结构一致）：
 *   R2: gallery/originals/… 、 gallery/thumbs/1600w/…
 *   本地: ${GALLERY_PHOTOS_DIR}/originals/ 、 thumbs/1600w/
 *
 * 用法：
 *   node scripts/gallery.mjs pull|push|build-json
 *
 * 环境变量见 .env.gallery.example；可放在 .env.gallery（需自行创建，已 gitignore）。
 */
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createReadStream, createWriteStream } from "node:fs";
import {
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { imageSize } from "image-size";
import { open } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvGallery() {
  const p = path.join(root, ".env.gallery");
  return readFile(p, "utf8")
    .then((raw) => {
      for (const line of raw.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const eq = t.indexOf("=");
        if (eq === -1) continue;
        const key = t.slice(0, eq).trim();
        let val = t.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = val;
      }
    })
    .catch(() => {});
}

const R2_PREFIX_ORIGINALS = "gallery/originals";
const R2_PREFIX_THUMBS = "gallery/thumbs/1600w";

function normBase(u) {
  if (!u) return "";
  return u.replace(/\/+$/, "");
}

function photosDir() {
  const raw = process.env.GALLERY_PHOTOS_DIR || "./photos";
  return path.isAbsolute(raw) ? raw : path.join(root, raw);
}

function localOriginalsDir() {
  return path.join(photosDir(), "originals");
}

function localThumbsDir() {
  return path.join(photosDir(), "thumbs", "1600w");
}

function s3Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("缺少 R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

function bucket() {
  const b = process.env.R2_BUCKET;
  if (!b) throw new Error("缺少 R2_BUCKET");
  return b;
}

async function listAllKeys(client, prefix) {
  const keys = [];
  let ContinuationToken = undefined;
  const pref = prefix.endsWith("/") ? prefix : `${prefix}/`;
  do {
    const out = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: pref,
        ContinuationToken,
      }),
    );
    for (const o of out.Contents ?? []) {
      if (o.Key && !o.Key.endsWith("/")) keys.push(o.Key);
    }
    ContinuationToken = out.IsTruncated
      ? out.NextContinuationToken
      : undefined;
  } while (ContinuationToken);
  return keys;
}

function keyToLocalRel(key, prefix) {
  const pref = prefix.endsWith("/") ? prefix : `${prefix}/`;
  if (!key.startsWith(pref)) return null;
  return key.slice(pref.length);
}

async function pull() {
  await loadEnvGallery();
  const client = s3Client();
  const dirs = [
    { prefix: R2_PREFIX_ORIGINALS, local: localOriginalsDir() },
    { prefix: R2_PREFIX_THUMBS, local: localThumbsDir() },
  ];
  for (const { prefix, local } of dirs) {
    const keys = await listAllKeys(client, prefix);
    await mkdir(local, { recursive: true });
    for (const key of keys) {
      const rel = keyToLocalRel(key, prefix);
      if (!rel) continue;
      const dest = path.join(local, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      const out = await client.send(
        new GetObjectCommand({ Bucket: bucket(), Key: key }),
      );
      if (!out.Body) continue;
      await pipeline(out.Body, createWriteStream(dest));
      console.log("pull", key, "->", path.relative(root, dest));
    }
  }
  console.log("pull 完成");
}

async function collectFilesRecursive(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await collectFilesRecursive(full, base)));
    } else if (e.isFile()) {
      files.push({ full, rel: path.relative(base, full) });
    }
  }
  return files;
}

async function push() {
  await loadEnvGallery();
  const client = s3Client();
  const pairs = [
    { prefix: R2_PREFIX_ORIGINALS, local: localOriginalsDir() },
    { prefix: R2_PREFIX_THUMBS, local: localThumbsDir() },
  ];
  for (const { prefix, local } of pairs) {
    let stats;
    try {
      stats = await stat(local);
    } catch {
      console.warn("跳过（目录不存在）:", local);
      continue;
    }
    if (!stats.isDirectory()) continue;
    const files = await collectFilesRecursive(local);
    for (const { full, rel } of files) {
      const key = `${prefix}/${rel.split(path.sep).join("/")}`;
      const body = createReadStream(full);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket(),
          Key: key,
          Body: body,
        }),
      );
      console.log("push", full, "->", key);
    }
  }
  console.log("push 完成");
}

function stem(name) {
  const i = name.lastIndexOf(".");
  return i === -1 ? name : name.slice(0, i);
}

async function listLocalBasenames(dir) {
  try {
    const names = await readdir(dir);
    return names.filter((n) => !n.startsWith("."));
  } catch {
    return [];
  }
}

/**
 * 从 originals 目录中为缩略图 stem 找原图文件名（任意扩展名）。
 */
function findOriginalName(stemName, originalFiles) {
  const lowerStem = stemName.toLowerCase();
  for (const f of originalFiles) {
    if (stem(f).toLowerCase() === lowerStem) return f;
  }
  return null;
}

/** 从缓冲区探测宽高（JPEG/WebP/PNG 等） */
function dimensionsFromBuffer(buf) {
  const r = imageSize(buf);
  if (!r.width || !r.height) {
    throw new Error("无法从文件头解析宽高");
  }
  return { width: r.width, height: r.height };
}

/**
 * 拉取对象前若干字节探测尺寸；失败则整对象拉取（大图较少触发）。
 */
async function fetchObjectBytes(client, key, maxBytes) {
  const out = await client.send(
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ...(maxBytes
        ? { Range: `bytes=0-${maxBytes - 1}` }
        : {}),
    }),
  );
  const chunks = [];
  for await (const chunk of out.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function probeDimensionsFromS3Key(client, key) {
  const partialSizes = [512 * 1024, 1024 * 1024];
  for (const n of partialSizes) {
    try {
      const buf = await fetchObjectBytes(client, key, n);
      return dimensionsFromBuffer(buf);
    } catch {
      // 继续尝试更大片段或整文件
    }
  }
  const full = await fetchObjectBytes(client, key, null);
  return dimensionsFromBuffer(full);
}

/**
 * 优先原图对象；若无或未配对则读缩略图对象。
 */
async function attachDimensionsR2(client, item, origRel) {
  const keysTry = [];
  if (origRel) {
    keysTry.push(
      `${R2_PREFIX_ORIGINALS}/${origRel.split(path.sep).join("/")}`,
    );
  }
  keysTry.push(`${R2_PREFIX_THUMBS}/${item.thumbName}`);
  let lastErr;
  for (const key of keysTry) {
    try {
      const { width, height } = await probeDimensionsFromS3Key(client, key);
      return { originalWidth: width, originalHeight: height };
    } catch (e) {
      lastErr = e;
    }
  }
  console.warn(
    `[gallery] 无法探测尺寸 ${item.thumbName}，使用占位 3:2`,
    lastErr?.message || lastErr,
  );
  return { originalWidth: 3, originalHeight: 2 };
}

async function probeLocalImagePath(p) {
  const headMax = 768 * 1024;
  const fh = await open(p, "r");
  try {
    const buf = Buffer.allocUnsafe(headMax);
    const { bytesRead } = await fh.read(buf, 0, headMax, 0);
    try {
      return dimensionsFromBuffer(buf.subarray(0, bytesRead));
    } catch {
      const full = await readFile(p);
      return dimensionsFromBuffer(full);
    }
  } finally {
    await fh.close();
  }
}

async function attachDimensionsLocal(item, origName) {
  const thumbPath = path.join(localThumbsDir(), item.thumbName);
  const origPath = origName
    ? path.join(localOriginalsDir(), origName)
    : null;
  const tryPaths = [origPath, thumbPath].filter(Boolean);
  let lastErr;
  for (const p of tryPaths) {
    try {
      const { width, height } = await probeLocalImagePath(p);
      return { originalWidth: width, originalHeight: height };
    } catch (e) {
      lastErr = e;
    }
  }
  console.warn(
    `[gallery] 本地无法探测尺寸 ${item.thumbName}，使用占位 3:2`,
    lastErr?.message || lastErr,
  );
  return { originalWidth: 3, originalHeight: 2 };
}

async function buildFromR2(client, publicBase) {
  const thumbKeys = await listAllKeys(client, R2_PREFIX_THUMBS);
  const origKeys = await listAllKeys(client, R2_PREFIX_ORIGINALS);
  const origByStem = new Map();
  for (const k of origKeys) {
    const rel = keyToLocalRel(k, R2_PREFIX_ORIGINALS);
    if (!rel) continue;
    const base = path.basename(rel);
    origByStem.set(stem(base).toLowerCase(), rel);
  }
  const items = [];
  const prefThumb = `${R2_PREFIX_THUMBS}/`;
  for (const key of thumbKeys) {
    if (!key.startsWith(prefThumb)) continue;
    const thumbName = key.slice(prefThumb.length);
    if (!thumbName) continue;
    const s = stem(thumbName);
    const origRel = origByStem.get(s.toLowerCase());
    const thumbnailUrl = `${publicBase}/${R2_PREFIX_THUMBS}/${thumbName}`;
    const originalUrl = origRel
      ? `${publicBase}/${R2_PREFIX_ORIGINALS}/${origRel.split("/").join("/")}`
      : null;
    items.push({
      id: s,
      thumbName,
      thumbnailUrl,
      originalUrl,
    });
  }
  items.sort((a, b) =>
    a.thumbName.localeCompare(b.thumbName, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
  for (const item of items) {
    const origRel = origByStem.get(item.id.toLowerCase());
    const dims = await attachDimensionsR2(client, item, origRel);
    Object.assign(item, dims);
    console.log("尺寸", item.thumbName, dims.originalWidth, "×", dims.originalHeight);
  }
  return items;
}

async function buildFromLocal(publicBase) {
  const thumbs = await listLocalBasenames(localThumbsDir());
  const originals = await listLocalBasenames(localOriginalsDir());
  const items = [];
  for (const thumbName of thumbs) {
    const s = stem(thumbName);
    const origName = findOriginalName(s, originals);
    const thumbnailUrl = `${publicBase}/${R2_PREFIX_THUMBS}/${thumbName}`;
    const originalUrl = origName
      ? `${publicBase}/${R2_PREFIX_ORIGINALS}/${origName}`
      : null;
    items.push({
      id: s,
      thumbName,
      thumbnailUrl,
      originalUrl,
    });
  }
  items.sort((a, b) =>
    a.thumbName.localeCompare(b.thumbName, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
  for (const item of items) {
    const origName = findOriginalName(item.id, originals);
    const dims = await attachDimensionsLocal(item, origName);
    Object.assign(item, dims);
    console.log("尺寸", item.thumbName, dims.originalWidth, "×", dims.originalHeight);
  }
  return items;
}

async function writeManifest(items) {
  const publicBase = normBase(process.env.R2_PUBLIC_BASE_URL || "");
  const manifest = {
    generatedAt: new Date().toISOString(),
    publicBaseUrl: publicBase,
    items,
  };
  const outPath = path.join(root, "data", "gallery.json");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log("已写入", path.relative(root, outPath), "共", items.length, "条");
}

async function buildJson() {
  await loadEnvGallery();
  const publicBase = normBase(process.env.R2_PUBLIC_BASE_URL || "");
  if (!publicBase) {
    console.warn(
      "[gallery] 未设置 R2_PUBLIC_BASE_URL，跳过生成（保留现有 data/gallery.json）",
    );
    return;
  }

  let items;
  try {
    const client = s3Client();
    items = await buildFromR2(client, publicBase);
  } catch (e) {
    console.warn(
      "[gallery] 无法连接 R2，尝试根据本地 photos 生成:",
      e.message || e,
    );
    items = await buildFromLocal(publicBase);
  }

  await writeManifest(items);
}

const cmd = process.argv[2];

async function main() {
  if (cmd === "pull") await pull();
  else if (cmd === "push") await push();
  else if (cmd === "build-json") await buildJson();
  else {
    console.error(
      "用法: node scripts/gallery.mjs pull | push | build-json",
    );
    process.exit(1);
  }
}

await main();
