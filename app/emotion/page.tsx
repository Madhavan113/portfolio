import Link from "next/link";

const posts = [
  {
    slug: "dominoes",
    title: "instrumental relics",
  },
  {
    slug: "i-might",
    title: "i might",
  },
  {
    slug: "lazy-sunday",
    title: "Lazy Sunday Morning",
    lede: "Claude fix this post i'm too lazyy to write it.",
  },
];

export default function EmotionPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="px-8 pt-10 pb-24 md:px-16 lg:px-24 max-w-4xl">
        <h1
          className="text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-[-0.02em] mb-16 text-black"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
          }}
        >
          Emotion
        </h1>

        <div className="space-y-12 max-w-2xl">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/emotion/${post.slug}`}
              className="block group"
            >
              <h2 className="text-2xl font-bold text-black leading-tight mb-2 group-hover:opacity-60 transition-opacity">
                {post.title}
              </h2>
              {post.lede ? (
                <p className="text-[0.95rem] leading-[1.7] text-black/60">
                  {post.lede}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </main>

      <Link
        href="/"
        className="fixed top-6 left-6 z-10 text-xs text-black/30 tracking-widest hover:text-black/60 transition-colors"
        style={{ fontFamily: "monospace" }}
      >
        &larr; back
      </Link>
    </div>
  );
}
