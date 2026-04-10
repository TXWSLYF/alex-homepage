"use client";

import type { ReactNode } from "react";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import { motion, useReducedMotion } from "motion/react";

/** Shared tokens for motion layouts (e.g. home hero). */
export const pageIntroStyles = {
  eyebrow: "text-xs font-medium uppercase tracking-[0.2em] text-text-mute",
  titlePage:
    "mt-2 w-full text-3xl font-semibold tracking-tight text-text-main sm:text-4xl",
  titleHero:
    "mt-2 text-4xl font-semibold tracking-tight text-text-main sm:text-5xl",
  description:
    "mt-3 max-w-2xl text-base leading-relaxed text-text-sub mx-auto text-pretty",
} as const;

export type PageIntroProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  const reduced = useReducedMotion();

  let step = 0;
  const eyebrowStep = step++;
  const titleStep = step++;
  const descriptionStep = step++;

  return (
    <header className="flex flex-col items-center text-center">
      {eyebrow ? (
        <motion.p
          className={pageIntroStyles.eyebrow}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: staggerDelay(reduced, eyebrowStep),
            ...softTransition(reduced),
          }}
        >
          {eyebrow}
        </motion.p>
      ) : null}
      <motion.h1
        className={pageIntroStyles.titlePage}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: staggerDelay(reduced, titleStep),
          ...softTransition(reduced),
        }}
      >
        {title}
      </motion.h1>
      {description ? (
        <motion.p
          className={pageIntroStyles.description}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: staggerDelay(reduced, descriptionStep),
            ...softTransition(reduced),
          }}
        >
          {description}
        </motion.p>
      ) : null}
    </header>
  );
}
