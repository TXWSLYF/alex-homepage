"use client";

import type { BlogListItem } from "@/lib/blog";
import {
  homeSectionFadeUpItem,
  homeSectionInnerStagger,
  homeSectionStaggerContainer,
  homeSectionViewport,
} from "@/lib/motion-presets";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
        <motion.div
          className="grid gap-4 md:grid-cols-2"
          variants={gridStagger}
        >
          {posts.map((post) => (
            <motion.article
              key={post.slug}
              variants={item}
              whileHover={
                reduced
                  ? undefined
                  : {
                      y: -4,
                      transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                    }
              }
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-base bg-background transition-[background-color] duration-300 hover:bg-ui-hover active:bg-ui-active"
              >
                <div className="flex h-full flex-col p-5">
                  <time
                    dateTime={post.date}
                    className="text-xs font-medium text-text-mute"
                  >
                    {post.date}
                  </time>
                  <h3 className="mt-3 text-lg font-semibold text-text-main group-hover:text-brand">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text-sub">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
                    Read
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      )}
    </motion.section>
  );
}
