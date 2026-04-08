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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

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

function GalleryLightboxContent({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  const [fullLoaded, setFullLoaded] = useState(false);
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const zoomRef = useRef(zoom);
  const pointersRef = useRef(
    new Map<number, { x: number; y: number }>(),
  );
  const pinchRef = useRef<{
    startScale: number;
    startX: number;
    startY: number;
    startDist: number;
    startCenterX: number;
    startCenterY: number;
  } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startTx: number;
    startTy: number;
  } | null>(null);

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
  const frameRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    queueMicrotask(() => setZoom({ scale: 1, x: 0, y: 0 }));
    pointersRef.current.clear();
    pinchRef.current = null;
    dragRef.current = null;
  }, [fullSrc]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const setZoomClamped = useCallback((next: { scale: number; x: number; y: number }) => {
    const el = frameRef.current;
    if (!el) {
      setZoom(next);
      return;
    }
    const rect = el.getBoundingClientRect();
    const scale = clamp(next.scale, 1, 4);
    const maxX = Math.max(0, ((scale - 1) * rect.width) / 2);
    const maxY = Math.max(0, ((scale - 1) * rect.height) / 2);
    setZoom({
      scale,
      x: clamp(next.x, -maxX, maxX),
      y: clamp(next.y, -maxY, maxY),
    });
  }, []);

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const cur = zoomRef.current;
      if (cur.scale > 1.01) {
        setZoom({ scale: 1, x: 0, y: 0 });
      } else {
        setZoomClamped({ scale: 2, x: cur.x, y: cur.y });
      }
    },
    [setZoomClamped],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only react to primary button on mouse; touch/pen ok.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsInteracting(true);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pts = Array.from(pointersRef.current.values());
    const cur = zoomRef.current;
    if (pts.length === 2) {
      const [a, b] = pts;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      pinchRef.current = {
        startScale: cur.scale,
        startX: cur.x,
        startY: cur.y,
        startDist: dist,
        startCenterX: (a.x + b.x) / 2,
        startCenterY: (a.y + b.y) / 2,
      };
      dragRef.current = null;
      return;
    }

    if (pts.length === 1 && cur.scale > 1.01) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startTx: cur.x,
        startTy: cur.y,
      };
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const pts = Array.from(pointersRef.current.values());
      if (pts.length === 2 && pinchRef.current) {
        const [a, b] = pts;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ratio = dist / (pinchRef.current.startDist || 1);
        const nextScale = clamp(pinchRef.current.startScale * ratio, 1, 4);

        // Keep pan roughly following finger center delta.
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        const dcx = cx - pinchRef.current.startCenterX;
        const dcy = cy - pinchRef.current.startCenterY;
        const nextX = pinchRef.current.startX + dcx;
        const nextY = pinchRef.current.startY + dcy;
        setZoomClamped({ scale: nextScale, x: nextX, y: nextY });
        return;
      }

      if (pts.length === 1 && dragRef.current && zoomRef.current.scale > 1.01) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setZoomClamped({
          scale: zoomRef.current.scale,
          x: dragRef.current.startTx + dx,
          y: dragRef.current.startTy + dy,
        });
      }
    },
    [setZoomClamped],
  );

  const onPointerUpOrCancel = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) {
      dragRef.current = null;
      queueMicrotask(() => setIsInteracting(false));
    }
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      // Trackpad/mouse zoom with Ctrl/Meta (Safari/Chrome).
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      e.stopPropagation();
      const cur = zoomRef.current;
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.08 : 1 / 1.08;
      const nextScale = clamp(cur.scale * factor, 1, 4);
      if (nextScale === cur.scale) return;
      setZoomClamped({ scale: nextScale, x: cur.x, y: cur.y });
    },
    [setZoomClamped],
  );

  const frameStyle = hasRatio
    ? {
        aspectRatio: `${arW} / ${arH}`,
        maxHeight: "min(86vh, 86dvh)",
        width: "min(100%, 1200px)",
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
          ref={frameRef}
          className={`relative shrink-0 overflow-hidden rounded-lg bg-neutral-900/55 shadow-2xl ${
            zoom.scale > 1.01 ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          style={frameStyle}
          aria-busy={!fullLoaded}
          onDoubleClick={onDoubleClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUpOrCancel}
          onPointerCancel={onPointerUpOrCancel}
          onWheel={onWheel}
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
            style={{
              transform: `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`,
              transformOrigin: "center",
              transition: isInteracting
                ? "none"
                : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
              touchAction: "none",
              willChange: "transform",
            }}
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
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4"
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
