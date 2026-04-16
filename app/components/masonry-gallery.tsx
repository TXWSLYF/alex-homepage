"use client";

import type { GalleryItem } from "@/lib/gallery";
import { softTransition } from "@/lib/motion-presets";
import { thumbHashBase64ToDataUrl } from "@/lib/thumbhash-dataurl";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { GalleryAlbum } from "./gallery-album";

function GalleryThumbTile({
  item,
  onOpen,
}: {
  item: GalleryItem;
  onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const thumbRef = useRef<HTMLImageElement>(null);
  const w = item.thumbWidth;
  const h = item.thumbHeight;
  const hasRatio = w > 0 && h > 0;

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
      onClick={onOpen}
      className="group w-full cursor-zoom-in rounded-2xl border border-border-base/80 bg-muted/40 text-left shadow-[0_12px_40px_-18px_rgba(0,0,0,0.35)] transition hover:border-brand/40 focus:outline-none"
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

export function MasonryGallery({ items }: { items: GalleryItem[] }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<boolean>(false);
  const [index, setIndex] = useState<number>(0);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={softTransition(reduced)}
      >
        <div
          className="columns-2 gap-x-2 gap-y-2 sm:columns-2 sm:gap-x-4 sm:gap-y-4 lg:columns-3"
          role="list"
        >
          {items.map((item, i) => (
            <div
              key={`${item.id}-${item.thumbnailUrl}`}
              role="listitem"
              className="mb-2 break-inside-avoid"
            >
              <GalleryThumbTile
                item={item}
                onOpen={() => {
                  setOpen(true);
                  setIndex(i);
                }}
              />
            </div>
          ))}
        </div>
      </motion.div>

      <GalleryAlbum
        items={items}
        open={open}
        setOpen={setOpen}
        index={index}
        setIndex={setIndex}
      />
    </>
  );
}
