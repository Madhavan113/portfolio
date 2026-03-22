import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "Blog - Madhavan Prasanna",
  description: "Thoughts and writings",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold">Blog</h1>
        <p className="max-w-2xl text-charcoal/72">
          Writing, notes, and half-formed ideas that are worth keeping around.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-charcoal/65">No posts yet. Check back soon!</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-charcoal/10 bg-white/55 px-5 py-4 transition-colors hover:border-charcoal/20 hover:bg-white/72"
              >
                <div className="flex items-baseline gap-4">
                  <time className="text-sm text-charcoal/55 shrink-0">
                    {post.date}
                  </time>
                  <h2 className="font-bold group-hover:text-gold transition-colors">
                    {post.title}
                  </h2>
                </div>
                {post.description && (
                  <p className="mt-2 text-sm text-charcoal/72 ml-[calc(theme(spacing.4)+theme(fontSize.sm))]">
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

