import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const BLOG_DIR = path.resolve(process.cwd(), "content/blog");

const EXT_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function mimeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXT_MIME[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename: encoded } = await context.params;
  let decoded: string;
  try {
    decoded = decodeURIComponent(encoded);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const base = path.basename(decoded);
  if (base !== decoded.replace(/\\/g, "/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const full = path.resolve(BLOG_DIR, base);
  const root = BLOG_DIR + path.sep;
  if (full !== BLOG_DIR && !full.startsWith(root)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buf = await readFile(full);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": mimeFor(full),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
