"use client";

import type { BlogListItem } from "@/lib/blog";
import {
  homeSectionFadeUpItem,
  homeSectionInnerStagger,
  homeSectionStaggerContainer,
  homeSectionViewport,
} from "@/lib/motion-presets";
import Link from "next/link";
import { ArrowUpRight, FileText, Pin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";

type Props = {
  posts: BlogListItem[];
};

export function HomeBlogTeaser({ posts }: Props) {
  const reduced = useReducedMotion();
  const container = useMemo(
    () => homeSectionStaggerContainer(reduced),
    [reduced],
  );
  const item = useMemo(() => homeSectionFadeUpItem(reduced), [reduced]);
  const gridStagger = useMemo(
    () => homeSectionInnerStagger(reduced, 0.1, 0.03),
    [reduced],
  );

  return (
    <motion.section
      className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pt-10 pb-16 sm:px-10"
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
            Blog
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-main">
            Latest posts
          </h2>
        </div>
        <Link
          href="/blog"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline sm:mt-0"
        >
          All posts
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </motion.div>
      {posts.length === 0 ? (
        <motion.p variants={item} className="text-sm text-text-sub">
          Nothing here yet—check back soon or visit{" "}
          <Link href="/blog" className="font-medium text-brand hover:underline">
            Blog
          </Link>
          .
        </motion.p>
      ) : (
        <motion.ul className="flex flex-col" variants={gridStagger}>
          {posts.map((post) => (
            <motion.li key={post.slug} variants={item}>
              <Link
                href={`/blog/${post.slug}`}
                className="group -mx-3 flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-ui-hover active:bg-ui-active sm:gap-4"
              >
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-text-mute transition-colors group-hover:text-brand"
                  aria-hidden
                >
                  {post.pinned ? (
                    <Pin className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </span>
                <h3 className="min-w-0 flex-1 truncate text-[15px] leading-snug text-text-main transition-colors group-hover:text-brand sm:text-base">
                  {post.title}
                </h3>
                {post.date ? (
                  <time
                    dateTime={post.date}
                    className="shrink-0 font-mono text-xs text-text-mute sm:text-sm"
                  >
                    {post.date}
                  </time>
                ) : null}
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.section>
  );
}
