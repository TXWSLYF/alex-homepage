"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { softTransition } from "@/lib/motion-presets";

export function PageEnter({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softTransition(reduced)}
    >
      {children}
    </motion.div>
  );
}

