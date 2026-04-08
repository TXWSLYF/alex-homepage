/**
 * Gallery R2 同步与静态清单生成。
 *
 * 约定（与现有桶结构一致）：
 *   R2: gallery/originals/… 、 gallery/thumbs/1600w/…
 *   本地: ${GALLERY_PHOTOS_DIR}/originals/ 、 thumbs/1600w/
 *
 * 用法：
 *   node scripts/gallery.mjs pull|push|generate-thumbs|build-json
 *   pull / push 默认跳过已同步文件（本地已有、或 R2 已有且大小一致）；加 --force 全量拉取/上传
 *   generate-thumbs 可加 --force 忽略「缩略图已比原图新」的跳过逻辑
 *
 * 环境变量见 .env.gallery.example；可放在 .env.gallery（需自行创建，已 gitignore）。
 */
import {
  GetObjectCommand,
  HeadObjectCommand,
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
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";

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

async function localFileExistsNonEmpty(filePath) {
  try {
    const s = await stat(filePath);
    return s.isFile() && s.size > 0;
  } catch {
    return false;
  }
}

/** R2 上对象是否存在；存在时返回字节数 */
async function r2ObjectSize(client, key) {
  try {
    const out = await client.send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key }),
    );
    return out.ContentLength ?? 0;
  } catch (e) {
    const code = e?.$metadata?.httpStatusCode;
    if (code === 404 || e?.name === "NotFound") return null;
    throw e;
  }
}

async function pull() {
  await loadEnvGallery();
  const force = process.argv.includes("--force");
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
      if (!force && (await localFileExistsNonEmpty(dest))) {
        console.log(
          "跳过 pull（本地已存在）",
          key,
          "->",
          path.relative(root, dest),
        );
        continue;
      }
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
  const force = process.argv.includes("--force");
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
      const st = await stat(full);
      const localSize = st.size;
      if (!force && localSize > 0) {
        const remoteSize = await r2ObjectSize(client, key);
        if (remoteSize !== null && remoteSize === localSize) {
          console.log("跳过 push（R2 已存在且大小一致）", key);
          continue;
        }
      }
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

/** 可作为原图生成缩略图的扩展名（小写比较） */
const ORIGINAL_EXT_RE = /\.(jpe?g|png|webp|tiff?|gif|avif)$/i;

/**
 * 从 originals 生成 thumbs/1600w/*.webp。
 * sharp().rotate() 无参时会按 EXIF Orientation 摆正像素，再缩放，避免「去掉 EXIF 后缩略图方向错误」。
 */
async function generateThumbs() {
  await loadEnvGallery();
  const maxW = Number.parseInt(
    process.env.GALLERY_THUMB_MAX_WIDTH || "1600",
    10,
  );
  const origDir = localOriginalsDir();
  const outDir = localThumbsDir();
  await mkdir(outDir, { recursive: true });

  let names;
  try {
    names = await readdir(origDir);
  } catch (e) {
    console.error("无法读取原图目录:", origDir, e.message || e);
    process.exit(1);
  }

  const force = process.argv.includes("--force");
  const inputs = names
    .filter((n) => !n.startsWith(".") && ORIGINAL_EXT_RE.test(n))
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );

  if (inputs.length === 0) {
    console.warn("未找到可处理的原图:", origDir);
    return;
  }

  for (const name of inputs) {
    const inPath = path.join(origDir, name);
    const s = stem(name);
    const outPath = path.join(outDir, `${s}.webp`);

    if (!force) {
      try {
        const [stIn, stOut] = await Promise.all([stat(inPath), stat(outPath)]);
        if (stOut.mtimeMs >= stIn.mtimeMs) {
          console.log("跳过（缩略图已最新）", path.relative(root, outPath));
          continue;
        }
      } catch {
        // 输出不存在则继续生成
      }
    }

    await sharp(inPath)
      .rotate()
      .resize({
        width: maxW,
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toFile(outPath);

    console.log(
      "缩略图",
      path.relative(root, inPath),
      "->",
      path.relative(root, outPath),
    );
  }
  console.log("generate-thumbs 完成（请按需 npm run gallery:push 上传 R2）");
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

/**
 * 拉取对象前若干字节；失败则整对象拉取。
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

/**
 * 从缩略图二进制生成尺寸 + ThumbHash（base64）；尺寸与 WebP 像素一致，Hash 供前端解码为 data URL 占位。
 * ThumbHash 要求编码图宽高均 ≤100，故先 fit 进 100×100。
 */
async function thumbMetaFromBuffer(buf) {
  const meta = await sharp(buf).metadata();
  const tw = meta.width;
  const th = meta.height;
  if (!tw || !th) throw new Error("无法读取缩略图尺寸");

  let thumbHashBase64;
  try {
    const { data, info } = await sharp(buf)
      .ensureAlpha()
      .resize(100, 100, { fit: "inside" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (info.width > 100 || info.height > 100) {
      throw new Error(`thumbhash 尺寸过大 ${info.width}x${info.height}`);
    }
    const hash = rgbaToThumbHash(info.width, info.height, data);
    thumbHashBase64 = Buffer.from(hash).toString("base64");
  } catch (e) {
    console.warn(
      `[gallery] ThumbHash 跳过 ${e?.message || e}`,
    );
  }

  return {
    thumbWidth: tw,
    thumbHeight: th,
    ...(thumbHashBase64 ? { thumbHashBase64 } : {}),
  };
}

/**
 * 瀑布流占位必须与 **缩略图文件** 的像素比例一致（已按 EXIF 转正后的 WebP）。
 */
async function attachThumbMetaR2(client, item) {
  const thumbKey = `${R2_PREFIX_THUMBS}/${item.thumbName}`;
  try {
    const buf = await fetchObjectBytes(client, thumbKey, null);
    return await thumbMetaFromBuffer(buf);
  } catch (e) {
    console.warn(
      `[gallery] 无法处理缩略图 ${item.thumbName}，使用占位 3:2`,
      e?.message || e,
    );
    return { thumbWidth: 3, thumbHeight: 2 };
  }
}

async function attachThumbMetaLocal(item) {
  const thumbPath = path.join(localThumbsDir(), item.thumbName);
  try {
    const buf = await readFile(thumbPath);
    return await thumbMetaFromBuffer(buf);
  } catch (e) {
    console.warn(
      `[gallery] 本地无法处理缩略图 ${item.thumbName}，使用占位 3:2`,
      e?.message || e,
    );
    return { thumbWidth: 3, thumbHeight: 2 };
  }
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
    const meta = await attachThumbMetaR2(client, item);
    Object.assign(item, meta);
    console.log(
      "缩略图",
      item.thumbName,
      meta.thumbWidth,
      "×",
      meta.thumbHeight,
      meta.thumbHashBase64 ? `+ ThumbHash (${meta.thumbHashBase64.length}B b64)` : "",
    );
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
    const meta = await attachThumbMetaLocal(item);
    Object.assign(item, meta);
    console.log(
      "缩略图",
      item.thumbName,
      meta.thumbWidth,
      "×",
      meta.thumbHeight,
      meta.thumbHashBase64 ? `+ ThumbHash (${meta.thumbHashBase64.length}B b64)` : "",
    );
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
  else if (cmd === "generate-thumbs") await generateThumbs();
  else if (cmd === "build-json") await buildJson();
  else {
    console.error(
      "用法: node scripts/gallery.mjs pull | push | generate-thumbs | build-json",
    );
    process.exit(1);
  }
}

await main();
