"use client";

import type { BlogListItem } from "@/lib/blog";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type Props = {
  posts: BlogListItem[];
};

export function HomeBlogTeaser({ posts }: Props) {
  const reduced = useReducedMotion();

  return (
    <section className="relative mx-auto w-full max-w-5xl px-6 pt-10 pb-16 sm:px-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
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
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-text-sub">
          Nothing here yet—check back soon or visit{" "}
          <Link href="/blog" className="font-medium text-brand hover:underline">
            Blog
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post, i) => (
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
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-base bg-background transition-colors hover:bg-ui-hover active:bg-ui-active"
              >
                {post.coverImage ? (
                  <div className="relative aspect-video w-full border-b border-border-base bg-surface-muted">
                    <Image
                      src={post.coverImage}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      priority={i === 0}
                    />
                  </div>
                ) : null}
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
        </div>
      )}
    </section>
  );
}
