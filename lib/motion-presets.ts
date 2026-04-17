import type { Transition, Variants } from "motion/react";

export function softTransition(reducedMotion: boolean | null): Transition {
  if (reducedMotion) return { duration: 0 };
  return { duration: 0.45, ease: [0.22, 1, 0.36, 1] };
}

export function staggerDelay(reducedMotion: boolean | null, i: number) {
  if (reducedMotion) return 0;
  return i * 0.06;
}

/** Viewport for home sections below the hero (scroll-driven entrance). */
export const homeSectionViewport = {
  once: true as const,
  amount: 0.12,
};

/** Parent: orchestrates staggered children (headers, cards, etc.). */
export function homeSectionStaggerContainer(
  reducedMotion: boolean | null,
): Variants {
  return {
    hidden: {},
    visible: {
      transition:
        reducedMotion === true
          ? { duration: 0 }
          : { staggerChildren: 0.08, delayChildren: 0.04 },
    },
  };
}

/** Child: fade up into place (pair with `homeSectionStaggerContainer`). */
export function homeSectionFadeUpItem(
  reducedMotion: boolean | null,
): Variants {
  return {
    hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: softTransition(reducedMotion),
    },
  };
}

/** Nested list wrapper: staggers only its own children (e.g. grid cards). */
export function homeSectionInnerStagger(
  reducedMotion: boolean | null,
  stagger: number,
  delayChildren: number,
): Variants {
  return {
    hidden: {},
    visible: {
      transition:
        reducedMotion === true
          ? { duration: 0 }
          : { staggerChildren: stagger, delayChildren },
    },
  };
}
