"use client";

import type { GalleryItem } from "@/lib/gallery";
import { thumbHashBase64ToDataUrl } from "@/lib/thumbhash-dataurl";
import { Loader2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  items: GalleryItem[];
};

function GalleryThumbTile({
  item,
  onOpen,
}: {
  item: GalleryItem;
  onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const thumbRef = useRef<HTMLImageElement>(null);
  const w = item.thumbWidth ?? item.originalWidth;
  const h = item.thumbHeight ?? item.originalHeight;
  const hasRatio =
    typeof w === "number" && typeof h === "number" && w > 0 && h > 0;

  const placeholderSrc = useMemo(() => {
    if (!item.thumbHashBase64) return null;
    try {
      return thumbHashBase64ToDataUrl(item.thumbHashBase64);
    } catch {
      return null;
    }
  }, [item.thumbHashBase64]);

  const usePlaceholderFade = Boolean(placeholderSrc);

  /** 磁盘/内存缓存常在绑定 onLoad 前就已 decode 完成，必须读 complete，否则会永远停在模糊层 */
  useLayoutEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const sync = () => {
      if (el.complete && el.naturalWidth > 0) {
        setLoaded(true);
      }
    };
    queueMicrotask(sync);
    el.addEventListener("load", sync);
    return () => el.removeEventListener("load", sync);
  }, [item.thumbnailUrl]);

  return (
    <button
      type="button"
      role="listitem"
      onClick={onOpen}
      className="group mb-4 w-full break-inside-avoid cursor-zoom-in rounded-2xl border border-border-base/80 bg-muted/40 text-left shadow-[0_12px_40px_-18px_rgba(0,0,0,0.35)] transition hover:border-brand/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div
        className={`relative w-full overflow-hidden rounded-2xl ${
          hasRatio ? "bg-muted" : ""
        }`}
        style={hasRatio ? { aspectRatio: `${w} / ${h}` } : undefined}
      >
        {placeholderSrc && (
          <>
            {/* ThumbHash 解码为 PNG data URL */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={placeholderSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden
            />
          </>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={thumbRef}
          src={item.thumbnailUrl}
          alt=""
          width={hasRatio ? w : undefined}
          height={hasRatio ? h : undefined}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={
            hasRatio
              ? `absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:scale-[1.02] ${
                  usePlaceholderFade
                    ? loaded
                      ? "opacity-100"
                      : "opacity-0"
                    : "opacity-100"
                }`
              : "h-auto w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          }
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent px-3 py-3 pt-10 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
          {item.thumbName}
        </span>
      </div>
    </button>
  );
}

const LIGHTBOX_VH_CAP = "min(82vh, 82dvh)";

function GalleryLightboxContent({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  const [fullLoaded, setFullLoaded] = useState(false);

  const arW = item.thumbWidth ?? item.originalWidth;
  const arH = item.thumbHeight ?? item.originalHeight;
  const hasRatio =
    typeof arW === "number" && typeof arH === "number" && arW > 0 && arH > 0;

  const placeholderSrc = useMemo(() => {
    if (!item.thumbHashBase64) return null;
    try {
      return thumbHashBase64ToDataUrl(item.thumbHashBase64);
    } catch {
      return null;
    }
  }, [item.thumbHashBase64]);

  const fullSrc = item.originalUrl ?? item.thumbnailUrl;
  const useFade = Boolean(placeholderSrc);
  const fullImgRef = useRef<HTMLImageElement>(null);

  /**
   * 大图只用 <img src> 加载，与「用 fetch 读 body 算进度」不同：跨域图片在 img 里可以显示，
   * 但 fetch 默认会受 CORS 限制，且 Strict Mode 里 abort 会产生 canceled。因此不再预 fetch。
   */
  useLayoutEffect(() => {
    queueMicrotask(() => {
      const el = fullImgRef.current;
      if (el?.complete && el.naturalWidth > 0) {
        setFullLoaded(true);
      }
    });
  }, [fullSrc]);

  const frameStyle = hasRatio
    ? {
        aspectRatio: `${arW} / ${arH}`,
        maxHeight: LIGHTBOX_VH_CAP,
        width: `min(100%, min(1200px, calc(${LIGHTBOX_VH_CAP} * ${arW} / ${arH})))`,
        marginInline: "auto" as const,
      }
    : {
        minHeight: "40vh",
        width: "min(100%, 1200px)" as const,
        marginInline: "auto" as const,
      };

  return (
    <>
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        onClick={onClose}
        aria-label="关闭"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="pointer-events-auto flex w-full max-w-[min(100%,1200px)] flex-col items-center px-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative shrink-0 overflow-hidden rounded-lg bg-neutral-900/55 shadow-2xl"
          style={frameStyle}
          aria-busy={!fullLoaded}
        >
          {placeholderSrc && (
            <>
              {/* ThumbHash 解码图只有约 32px 固有尺寸，须 h/w 拉满 + object-cover，否则会缩成一小块 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={placeholderSrc}
                alt=""
                className="absolute inset-0 z-0 h-full w-full object-cover"
                aria-hidden
              />
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={fullImgRef}
            src={fullSrc}
            alt=""
            width={hasRatio ? arW : undefined}
            height={hasRatio ? arH : undefined}
            decoding="async"
            onLoad={() => setFullLoaded(true)}
            onError={() => setFullLoaded(true)}
            className={`absolute inset-0 z-10 h-full w-full object-contain ${
              useFade
                ? fullLoaded
                  ? "opacity-100"
                  : "opacity-0"
                : "opacity-100"
            } transition-opacity duration-300`}
          />
          {!fullLoaded && (
            <div
              className="pointer-events-none absolute bottom-3 right-3 z-20 flex max-w-[calc(100%-1.5rem)] items-center gap-2.5 rounded-xl bg-black/65 px-3 py-2 shadow-lg ring-1 ring-white/10 backdrop-blur-md"
              role="status"
              aria-live="polite"
              aria-busy
            >
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin text-white/90"
                aria-hidden
              />
              <span className="text-xs font-medium leading-tight text-white">
                Loading
              </span>
            </div>
          )}
        </div>
        {/* 固定占位高度，避免原图加载把文字顶下去造成 CLS */}
        <p className="mt-4 min-h-10 w-full shrink-0 pt-1 text-center text-xs leading-relaxed text-white/80">
          {item.thumbName}
        </p>
      </div>
    </>
  );
}

export function GalleryWaterfall({ items }: Props) {
  const [open, setOpen] = useState<GalleryItem | null>(null);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(null);
  }, []);

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
        {items.map((item) => (
          <GalleryThumbTile
            key={`${item.id}-${item.thumbnailUrl}`}
            item={item}
            onOpen={() => setOpen(item)}
          />
        ))}
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="大图预览"
            onClick={() => setOpen(null)}
          >
            <GalleryLightboxContent
              key={`${open.id}-${open.originalUrl ?? open.thumbnailUrl}`}
              item={open}
              onClose={() => setOpen(null)}
            />
          </div>,
          document.body
        )}
    </>
  );
}
