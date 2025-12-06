import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "Blog - Madhavan Prasanna",
  description: "Thoughts and writings",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Blog</h1>

      {posts.length === 0 ? (
        <p className="text-charcoal/60">No posts yet. Check back soon!</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="flex items-baseline gap-4">
                  <time className="text-sm text-charcoal/60 shrink-0">
                    {post.date}
                  </time>
                  <h2 className="font-bold group-hover:text-gold transition-colors">
                    {post.title}
                  </h2>
                </div>
                {post.description && (
                  <p className="mt-1 text-sm text-charcoal/70 ml-[calc(theme(spacing.4)+theme(fontSize.sm))]">
                    {post.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

