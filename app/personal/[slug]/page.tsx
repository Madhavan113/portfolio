import { notFound } from "next/navigation";
import Link from "next/link";
import { getPersonalPostBySlug, getAllPersonalPostSlugs } from "@/lib/personal";
import { MDXRemote } from "next-mdx-remote/rsc";

export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPersonalPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPersonalPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} - Madhavan Prasanna`,
    description: post.description,
  };
}

export default async function PersonalPost({ params }: Props) {
  const { slug } = await params;
  const post = getPersonalPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-8">
      <header className="mb-8 rounded-2xl border border-charcoal/10 bg-white/55 px-6 py-5">
        <Link
          href="/personal"
          className="text-sm text-charcoal/60 hover:text-gold transition-colors"
        >
          ← Back to personal
        </Link>
        <h1 className="text-2xl font-bold mt-4">{post.title}</h1>
        <time className="text-sm text-charcoal/58 mt-2 block">{post.date}</time>
      </header>

      <div className="prose max-w-none text-charcoal">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}










