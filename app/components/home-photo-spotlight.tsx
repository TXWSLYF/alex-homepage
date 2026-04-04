"use client";

// TODO: After `/gallery` is fleshed out, load the full gallery set from a single source
// and show 4 randomly chosen photos here on each visit (SSR shuffle or client-side pick).

import type { PhotoSpotlightItem } from "@/content/photos";
import { photoSpotlightItems } from "@/content/photos";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import Image from "next/image";
import Link from "next/link";
import { Reorder, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useState } from "react";

export function HomePhotoSpotlight() {
  const reduced = useReducedMotion();
  const [items, setItems] = useState(() => [...photoSpotlightItems]);

  const onReorder = useCallback((next: PhotoSpotlightItem[]) => {
    setItems(next);
  }, []);

  return (
    <section className="relative mx-auto w-full max-w-5xl px-6 pb-24 pt-4 sm:px-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-mute">
            Gallery
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-main">
            Featured photos
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-text-sub">
            Personal frames from travel and everyday light—highlights below,
            with the full set in the gallery.
          </p>
        </div>
        <Link
          href="/gallery"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline sm:mt-0"
        >
          View gallery
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="relative min-h-[220px] sm:min-h-[260px]">
        <Reorder.Group
          axis="x"
          values={items}
          onReorder={onReorder}
          className="isolate flex flex-wrap content-start justify-center gap-3 sm:gap-4"
          aria-label="Featured photos"
        >
          {items.map((photo, i) => (
            <Reorder.Item
              key={photo.id}
              value={photo}
              className="relative aspect-4/5 w-[calc(50%-0.375rem)] max-w-[calc(50%-0.375rem)] flex-[0_0_auto] cursor-default overflow-hidden rounded-2xl border border-border-base/80 bg-muted shadow-[0_12px_40px_-16px_rgba(0,0,0,0.35)] sm:w-[calc(25%-0.75rem)] sm:max-w-[calc(25%-0.75rem)]"
              initial={
                reduced
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      y: 18,
                      scale: 0.96,
                      rotate: i % 2 === 0 ? -2.5 : 2.5,
                    }
              }
              whileInView={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: reduced ? 0 : i % 2 === 0 ? -2.5 : 2.5,
              }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                delay: staggerDelay(reduced, i),
                ...softTransition(reduced),
              }}
              whileHover={
                reduced
                  ? undefined
                  : {
                      scale: 1.04,
                      rotate: 0,
                      transition: { duration: 0.25 },
                    }
              }
              whileDrag={{ scale: 1.05, rotate: 0 }}
            >
              <Image
                src={photo.src}
                alt={photo.alt ?? photo.label}
                fill
                draggable={false}
                sizes="(max-width: 640px) 45vw, 22vw"
                className="pointer-events-none object-cover select-none"
              />
              <span className="absolute bottom-3 left-3 z-10 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-text-main backdrop-blur-sm dark:bg-surface-muted/80">
                {photo.label}
              </span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </section>
  );
}
