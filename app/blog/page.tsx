import { getAllPosts } from "@/lib/blog";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata = {
  title: "Blog — Alex",
  description: "Notes on UI, performance, and building things on the web.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-24 sm:px-10">
      <h1 className="text-3xl font-semibold tracking-tight text-text-main sm:text-4xl">
        Blog
      </h1>
      <p className="mt-3 max-w-2xl text-text-sub">
        Long-form notes—mostly front-end, tooling, and experiments.
      </p>
      <ul className="mt-12 flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.slug}>
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
          </li>
        ))}
      </ul>
      {posts.length === 0 ? (
        <p className="mt-12 text-text-sub">No posts yet.</p>
      ) : null}
    </main>
  );
}
