"use client";

import type { BlogListItem } from "@/lib/blog";
import { softTransition } from "@/lib/motion-presets";
import Link from "next/link";
import { FileText, Pin } from "lucide-react";
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
        <ul className="mt-10 flex flex-col">
          {posts.map((post) => (
            <motion.li
              key={post.slug}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={softTransition(reduced)}
            >
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
                <h2 className="min-w-0 flex-1 truncate text-[15px] font-medium leading-snug text-text-main transition-colors group-hover:text-brand sm:text-base">
                  {post.title}
                </h2>
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
        </ul>
      )}
    </>
  );
}
