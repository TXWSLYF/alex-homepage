import { blogPreviewItems } from "@/content/blog-preview";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPreviewItems.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-24 sm:px-10">
      <Link
        href="/blog"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← Back to Blog
      </Link>
      <article className="mt-10">
        <time className="text-sm text-text-mute" dateTime={post.date}>
          {post.date}
        </time>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-main">
          {post.title}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-text-sub">
          {post.excerpt}
        </p>
        <p className="mt-10 text-sm text-text-mute">
          Full post placeholder—wire up MDX or a CMS next.
        </p>
      </article>
    </main>
  );
}
