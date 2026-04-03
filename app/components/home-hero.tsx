"use client";

import { homeContent } from "@/content/home";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export function HomeHero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-24 pb-16 text-center sm:px-10">
      <motion.p
        className="text-xs font-medium uppercase tracking-[0.2em] text-text-mute"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: staggerDelay(reduced, 0),
          ...softTransition(reduced),
        }}
      >
        {homeContent.eyebrow}
      </motion.p>
      <motion.h1
        className="mt-4 text-4xl font-semibold tracking-tight text-text-main sm:text-5xl"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: staggerDelay(reduced, 1),
          ...softTransition(reduced),
        }}
      >
        <span className="block">{homeContent.name}</span>
        <span className="mt-2 block text-2xl font-medium text-brand sm:text-3xl">
          {homeContent.role}
        </span>
      </motion.h1>
      <motion.p
        className="mt-5 max-w-lg text-base leading-relaxed text-text-sub sm:text-lg"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: staggerDelay(reduced, 2),
          ...softTransition(reduced),
        }}
      >
        {homeContent.tagline}
      </motion.p>
      <motion.div
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: staggerDelay(reduced, 3),
          ...softTransition(reduced),
        }}
      >
        <Link
          href={homeContent.ctaPrimary.href}
          className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-6 text-sm font-medium text-brand-fg transition-colors hover:opacity-90 active:opacity-80"
        >
          {homeContent.ctaPrimary.label}
        </Link>
        <Link
          href={homeContent.ctaSecondary.href}
          className="inline-flex h-10 items-center justify-center rounded-full border border-border-base bg-background px-6 text-sm font-medium text-text-main transition-colors hover:bg-ui-hover active:bg-ui-active"
        >
          {homeContent.ctaSecondary.label}
        </Link>
      </motion.div>
      <motion.ul
        className="mt-10 flex flex-wrap justify-center gap-2"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: staggerDelay(reduced, 4),
          ...softTransition(reduced),
        }}
      >
        {homeContent.highlights.map((item) => (
          <li
            key={item}
            className="rounded-full border border-border-base/80 bg-surface-muted/50 px-3 py-1 text-xs font-medium text-text-sub"
          >
            {item}
          </li>
        ))}
      </motion.ul>
    </section>
  );
}
