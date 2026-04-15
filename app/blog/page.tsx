import { BlogIndexContent } from "@/app/components/blog-index-content";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata = {
  title: "Blog — Alex",
  description: "Notes on UI, performance, and building things on the web.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-24 sm:px-10">
      <BlogIndexContent posts={posts} />
    </main>
  );
}
