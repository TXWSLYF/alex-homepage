import type { Metadata } from "next";
import { GalleryWaterfall } from "../components/gallery-waterfall";
import type { GalleryManifest } from "@/lib/gallery";
import manifest from "@/data/gallery.json";

const data = manifest as GalleryManifest;

export const metadata: Metadata = {
  title: "Gallery — Alex",
  description: "照片集：旅行与日常光影。",
};

export default function GalleryPage() {
  return (
    <main className="relative z-1 mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-20 sm:px-10">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-mute">
          Gallery
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-main">
          Photos
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-sub">
          瀑布流展示；缩略图来自 R2，点击可查看原图（若已上传）。
        </p>
        {data.generatedAt && data.generatedAt !== "1970-01-01T00:00:00.000Z" && (
          <p className="mt-3 text-xs text-text-mute">
            清单更新时间{" "}
            <time dateTime={data.generatedAt}>
              {new Date(data.generatedAt).toLocaleString()}
            </time>
          </p>
        )}
      </header>

      <GalleryWaterfall items={data.items} />
    </main>
  );
}
