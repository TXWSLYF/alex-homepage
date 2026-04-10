"use client";

import { pageIntroStyles } from "@/app/components/page-intro";
import { homeContent, skillBadges } from "@/content/home";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

const SKILL_ROWS: [number, number][] = [
  [0, 4],
  [4, 8],
];

export function HomeHero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-24 pb-10 text-center sm:px-10">
      <motion.p
        className={pageIntroStyles.eyebrow}
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
        className={pageIntroStyles.titleHero}
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
        className={pageIntroStyles.description}
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
        className="mt-12 w-full max-w-2xl"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: staggerDelay(reduced, 3),
          ...softTransition(reduced),
        }}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2">
          {SKILL_ROWS.map(([from, to]) => (
            <ul key={from} className="flex flex-wrap justify-center gap-2">
              {skillBadges.slice(from, to).map((badge) => (
                <li key={badge.alt} className="leading-none">
                  <Image
                    src={badge.src}
                    alt={badge.alt}
                    width={160}
                    height={24}
                    unoptimized
                    className="h-5 w-auto max-w-full rounded-[4px] sm:h-6"
                    style={{ width: "auto" }}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
