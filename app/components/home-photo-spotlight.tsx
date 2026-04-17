"use client";

import {
  homeSectionFadeUpItem,
  homeSectionInnerStagger,
  homeSectionStaggerContainer,
  homeSectionViewport,
  softTransition,
} from "@/lib/motion-presets";
import type { GalleryItem, GalleryManifest } from "@/lib/gallery";
import manifest from "@/data/gallery.json";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const data = manifest as GalleryManifest;

function pickRandom<T>(arr: readonly T[], count: number): T[] {
  if (count <= 0) return [];
  if (arr.length <= count) return [...arr];
  const copy = [...arr];
  // Fisher–Yates shuffle partial
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function spotlightSlotVariants(
  reduced: boolean | null,
  index: number,
): Variants {
  const tilt = index % 2 === 0 ? -2.5 : 2.5;
  return {
    hidden: reduced
      ? { opacity: 0 }
      : { opacity: 0, y: 22, scale: 0.94, rotate: tilt },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: reduced ? 0 : tilt,
      transition: softTransition(reduced),
    },
  };
}

export function HomePhotoSpotlight() {
  const reduced = useReducedMotion();
  const [items, setItems] = useState(() => [] as GalleryManifest["items"]);

  // Avoid hydration mismatch: SSR + client must render the same initial markup.
  // Pick randomly only after client mount.
  useEffect(() => {
    const pickFrom = data.items.filter((it) => Boolean(it.thumbnailUrl));
    queueMicrotask(() => setItems(pickRandom(pickFrom, 4)));
  }, []);

  const container = useMemo(
    () => homeSectionStaggerContainer(reduced),
    [reduced],
  );
  const item = useMemo(() => homeSectionFadeUpItem(reduced), [reduced]);
  const listStagger = useMemo(
    () => homeSectionInnerStagger(reduced, 0.09, 0.04),
    [reduced],
  );

  const slots: (GalleryItem | null)[] =
    items.length > 0 ? [...items] : [null, null, null, null];

  return (
    <motion.section
      className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-24 pt-4 sm:px-10"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={homeSectionViewport}
    >
      <motion.div
        variants={item}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-mute">
            Gallery
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-main">
            Featured photos
          </h2>
        </div>
        <Link
          href="/gallery"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline sm:mt-0"
        >
          View gallery
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </motion.div>

      <motion.ul
        className="relative isolate flex min-h-[220px] flex-wrap content-start justify-center gap-3 sm:min-h-[260px] sm:gap-4"
        aria-label="Featured photos"
        variants={listStagger}
      >
          {slots.map((photo, i) => (
            <motion.li
              key={`spotlight-slot-${i}`}
              variants={spotlightSlotVariants(reduced, i)}
              className="relative aspect-4/5 w-[calc(50%-0.375rem)] max-w-[calc(50%-0.375rem)] flex-[0_0_auto] cursor-default overflow-hidden rounded-2xl border border-border-base/80 bg-muted shadow-[0_12px_40px_-16px_rgba(0,0,0,0.35)] sm:w-[calc(25%-0.75rem)] sm:max-w-[calc(25%-0.75rem)]"
              whileHover={
                reduced
                  ? undefined
                  : {
                      scale: 1.04,
                      rotate: 0,
                      transition: { duration: 0.25 },
                    }
              }
            >
              {photo ? (
                <Image
                  src={photo.thumbnailUrl}
                  alt={photo.thumbName ?? "Featured photo"}
                  fill
                  draggable={false}
                  sizes="(max-width: 640px) 45vw, 22vw"
                  className="pointer-events-none object-cover select-none"
                />
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-muted to-surface-muted" />
              )}
            </motion.li>
          ))}
      </motion.ul>
    </motion.section>
  );
}
