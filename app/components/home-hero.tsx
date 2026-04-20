"use client";

import { pageIntroStyles } from "@/app/components/page-intro";
import { homeContent, skillBadges } from "@/content/home";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useMemo, useState } from "react";

function columnsForWidth(width: number): number {
  // Keep in sync with Tailwind-ish breakpoints used on the site.
  if (width >= 1024) return 5;
  if (width >= 640) return 4;
  return 4;
}

function buildSkillRows(total: number, perRow: number): [number, number][] {
  const safePerRow = Math.max(1, perRow);
  const rows: [number, number][] = [];
  for (let start = 0; start < total; start += safePerRow) {
    rows.push([start, Math.min(total, start + safePerRow)]);
  }
  return rows;
}

export function HomeHero() {
  const reduced = useReducedMotion();
  const [columnsPerRow, setColumnsPerRow] = useState(3);

  useLayoutEffect(() => {
    const mqSm = window.matchMedia("(min-width: 640px)");
    const mqLg = window.matchMedia("(min-width: 1024px)");

    const sync = () => {
      setColumnsPerRow(columnsForWidth(window.innerWidth));
    };

    sync();

    // `change` fires when a media query's boolean evaluation flips (i.e. crossing a breakpoint).
    // That's exactly when `columnsForWidth(window.innerWidth)` can change for threshold-based layouts.
    mqSm.addEventListener("change", sync);
    mqLg.addEventListener("change", sync);

    return () => {
      mqSm.removeEventListener("change", sync);
      mqLg.removeEventListener("change", sync);
    };
  }, []);

  const skillRows = useMemo(
    () => buildSkillRows(skillBadges.length, columnsPerRow),
    [columnsPerRow],
  );

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
          {skillRows.map(([from, to]) => (
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
