"use client";

import type { BlogListItem } from "@/lib/blog";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import Image from "next/image";
import Link from "next/link";
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
        <ul className="mt-10 flex flex-col gap-4">
          {posts.map((post, i) => (
            <motion.li
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
                className="group block overflow-hidden rounded-2xl border border-border-base bg-background transition-colors hover:bg-ui-hover active:bg-ui-active"
              >
                {post.coverImage ? (
                  <div className="relative aspect-21/9 w-full border-b border-border-base bg-surface-muted">
                    <Image
                      src={post.coverImage}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-cover"
                      priority={i === 0}
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  <time
                    dateTime={post.date}
                    className="text-xs font-medium text-text-mute"
                  >
                    {post.date}
                  </time>
                  <h2 className="mt-2 text-lg font-semibold text-text-main group-hover:text-brand">
                    {post.title}
                  </h2>
                  {post.excerpt ? (
                    <p className="mt-2 text-sm leading-relaxed text-text-sub">
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
