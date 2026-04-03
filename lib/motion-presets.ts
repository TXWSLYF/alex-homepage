import type { Transition } from "motion/react";

export function softTransition(reducedMotion: boolean | null): Transition {
  if (reducedMotion) return { duration: 0 };
  return { duration: 0.45, ease: [0.22, 1, 0.36, 1] };
}

export function staggerDelay(reducedMotion: boolean | null, i: number) {
  if (reducedMotion) return 0;
  return i * 0.06;
}
