"use client";

import { photoSpotlightItems } from "@/content/photos";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export function HomePhotoSpotlight() {
  const reduced = useReducedMotion();

  return (
    <section className="relative mx-auto w-full max-w-5xl px-6 pb-24 pt-4 sm:px-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-mute">
            Gallery
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-main">
            精选摄影
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-text-sub">
            错落叠放 + 轻 hover；图片为渐变占位，可替换为真实照片。
          </p>
        </div>
        <Link
          href="/gallery"
          className="mt-4 text-sm font-medium text-brand hover:underline sm:mt-0"
        >
          查看图集
        </Link>
      </div>

      <div className="relative min-h-[220px] sm:min-h-[260px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {photoSpotlightItems.map((photo, i) => (
            <motion.div
              key={photo.id}
              className="relative aspect-4/5 overflow-hidden rounded-2xl border border-border-base/80 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.35)]"
              style={{
                backgroundImage: photo.gradient,
                zIndex: photoSpotlightItems.length - i,
              }}
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
            >
              <span className="absolute bottom-3 left-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-text-main backdrop-blur-sm dark:bg-surface-muted/80">
                {photo.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
