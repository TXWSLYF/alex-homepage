import { BlogMarkdown } from "@/app/components/blog-markdown";
import { BlogToc } from "@/app/components/blog-toc";
import { PageEnter } from "@/app/components/page-enter";
import { extractBlogToc } from "@/lib/blog-toc";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";
export const revalidate = false;

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  const expanded = slugs.flatMap((slug) => {
    const encoded = encodeURIComponent(slug);
    return encoded === slug ? [slug] : [slug, encoded];
  });
  return Array.from(new Set(expanded)).map((slug) => ({ slug }));
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
      ? {
          title,
          description: post.excerpt || undefined,
          images: [{ url: post.ogImage }],
        }
      : { title, description: post.excerpt || undefined },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const toc = extractBlogToc(post.content);
  const hasToc = toc.items.length > 0;

  return (
    <main
      className={`mx-auto w-full min-w-0 flex-1 px-6 py-24 sm:px-10 ${
        hasToc ? "max-w-6xl" : "max-w-4xl"
      }`}
    >
      <div
        className={
          hasToc
            ? "xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-14"
            : undefined
        }
      >
        <div className="min-w-0">
          <PageEnter>
            <article className="min-w-0 max-w-full overflow-x-clip">
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
              {hasToc ? (
                <div className="mt-8 xl:hidden">
                  <BlogToc items={toc.items} collapsible />
                </div>
              ) : null}
              <div className={hasToc ? "mt-8 xl:mt-10" : "mt-10"}>
                <BlogMarkdown
                  content={post.content}
                  slug={post.slug}
                  headingIds={toc.headingIds}
                />
              </div>
            </article>
          </PageEnter>
        </div>
        {hasToc ? (
          <aside className="hidden xl:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
              <BlogToc items={toc.items} />
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
