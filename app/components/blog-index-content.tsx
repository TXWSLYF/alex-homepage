"use client";

import type { BlogListItem } from "@/lib/blog";
import { softTransition } from "@/lib/motion-presets";
import Link from "next/link";
import { Pin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageIntro } from "./page-intro";

type Props = {
  posts: BlogListItem[];
};

export function BlogIndexContent({ posts }: Props) {
  const reduced = useReducedMotion();

  return (
    <>
      <PageIntro
        eyebrow="Blog"
        title="Posts"
        description="Building with code, sharing stories from life."
      />

      {posts.length === 0 ? (
        <p className="mt-10 text-text-sub">No posts yet.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {posts.map((post) => (
            <motion.li
              key={post.slug}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={softTransition(reduced)}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border-base bg-background transition-colors hover:bg-ui-hover active:bg-ui-active"
              >
                <div className="relative p-5">
                  {post.pinned ? (
                    <span
                      className="absolute right-5 top-5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-brand dark:border-brand/50 dark:bg-brand/30"
                      aria-label="Pinned"
                      title="Pinned"
                    >
                      <Pin className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  ) : null}
                  <time
                    dateTime={post.date}
                    className="text-xs font-medium text-text-mute"
                  >
                    {post.date}
                  </time>
                  <h2
                    className={`mt-2 text-lg font-semibold text-text-main group-hover:text-brand lg:line-clamp-1${post.pinned ? " pr-8" : ""}`}
                  >
                    {post.title}
                  </h2>
                  {post.excerpt ? (
                    <p className="mt-2 text-sm leading-relaxed text-text-sub lg:line-clamp-1">
                      {post.excerpt}
                    </p>
                  ) : null}
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </>
  );
}
