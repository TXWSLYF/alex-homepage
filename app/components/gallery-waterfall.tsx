"use client";

import type { GalleryItem } from "@/lib/gallery";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  items: GalleryItem[];
};

export function GalleryWaterfall({ items }: Props) {
  const [open, setOpen] = useState<GalleryItem | null>(null);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onKey]);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-border-base/80 bg-muted/50 px-6 py-12 text-center text-sm text-text-sub">
        暂无图片。在本地配置好{" "}
        <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
          .env.gallery
        </code>{" "}
        后运行{" "}
        <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
          npm run gallery:build
        </code>{" "}
        生成清单，或先{" "}
        <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
          npm run gallery:pull
        </code>{" "}
        从 R2 拉取。
      </p>
    );
  }

  return (
    <>
      <div
        className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4"
        role="list"
      >
        {items.map((item) => {
          const w = item.originalWidth;
          const h = item.originalHeight;
          const hasRatio =
            typeof w === "number" &&
            typeof h === "number" &&
            w > 0 &&
            h > 0;
          return (
          <button
            key={item.id}
            type="button"
            role="listitem"
            onClick={() => setOpen(item)}
            className="group mb-4 w-full break-inside-avoid cursor-zoom-in rounded-2xl border border-border-base/80 bg-muted/40 text-left shadow-[0_12px_40px_-18px_rgba(0,0,0,0.35)] transition hover:border-brand/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div
              className={`relative w-full overflow-hidden rounded-2xl ${hasRatio ? "bg-muted" : ""}`}
              style={
                hasRatio
                  ? { aspectRatio: `${w} / ${h}` }
                  : undefined
              }
            >
              {/* 使用原生 img：清单里的公开 URL 域名随 R2 配置变化，避免改 next.config */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbnailUrl}
                alt=""
                width={hasRatio ? w : undefined}
                height={hasRatio ? h : undefined}
                loading="lazy"
                decoding="async"
                className={
                  hasRatio
                    ? "absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    : "h-auto w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                }
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent px-3 py-3 pt-10 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                {item.thumbName}
              </span>
            </div>
          </button>
          );
        })}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="大图预览"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setOpen(null)}
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[min(100%,1200px)] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 原图 URL 来自清单，避免限定域名 */}
            <img
              src={open.originalUrl ?? open.thumbnailUrl}
              alt=""
              className="max-h-[90vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
            <p className="mt-3 text-center text-xs text-white/80">
              {open.thumbName}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
