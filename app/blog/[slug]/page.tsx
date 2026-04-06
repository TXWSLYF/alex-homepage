import { BlogMarkdown } from "@/app/components/blog-markdown";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";
export const revalidate = false;

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not found" };
  const title = `${post.title} — Alex`;
  return {
    title,
    description: post.excerpt || undefined,
    openGraph: post.ogImage
      ? { title, description: post.excerpt || undefined, images: [{ url: post.ogImage }] }
      : { title, description: post.excerpt || undefined },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full min-w-0 max-w-3xl flex-1 overflow-x-clip px-6 py-24 sm:px-10">
      <Link
        href="/blog"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← Back to Blog
      </Link>
      <article className="mt-10 min-w-0 max-w-full">
        <time className="text-sm text-text-mute" dateTime={post.date}>
          {post.date}
        </time>
        {post.author ? (
          <p className="mt-1 text-sm text-text-sub">{post.author}</p>
        ) : null}
        <h1 className="mt-3 wrap-break-word text-3xl font-semibold tracking-tight text-text-main sm:text-4xl">
          {post.title}
        </h1>
        {post.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-border-base bg-surface-muted px-2.5 py-0.5 text-xs text-text-sub"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-10">
          <BlogMarkdown content={post.content} slug={post.slug} />
        </div>
      </article>
    </main>
  );
}
