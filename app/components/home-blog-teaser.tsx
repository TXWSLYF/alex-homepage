"use client";

import { blogPreviewItems } from "@/content/blog-preview";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function HomeBlogTeaser() {
  const reduced = useReducedMotion();

  return (
    <section className="relative mx-auto w-full max-w-5xl px-6 py-16 sm:px-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-mute">
            Blog
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-main">
            最新文章
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-text-sub">
            两篇最近的更新；完整列表见 Blog。
          </p>
        </div>
        <Link
          href="/blog"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline sm:mt-0"
        >
          全部文章
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {blogPreviewItems.map((post, i) => (
          <motion.article
            key={post.slug}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              delay: staggerDelay(reduced, i),
              ...softTransition(reduced),
            }}
          >
            <Link
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border-base bg-background p-5 transition-colors hover:bg-ui-hover active:bg-ui-active"
            >
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
                阅读
                <ArrowUpRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
