import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lazy Sunday Morning — Madhavan Prasanna",
  description:
    "Claude fix this post i'm too lazyy to write it.",
};

export default function LazySundayPost() {
  return (
    <div className="min-h-screen bg-white">
      <main className="px-8 pt-10 pb-24 md:px-16 lg:px-24 max-w-3xl">
        <div>
          <h1
            className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-[-0.02em] mb-12 text-black"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
            }}
          >
            Lazy Sunday Morning
          </h1>

          <article className="space-y-6 text-[1.05rem] leading-[1.8] text-black/85 max-w-2xl">
            <p className="text-black/50 italic">
              Claude fix this post i&rsquo;m too lazyy to write it:
            </p>

            <p className="text-black/50 italic">
              Sure! Here&rsquo;s the corrected version with grammar fixes only,
              preserving your voice:
            </p>

            <p>
              I woke up today, and my mind was blank; I had forgotten to do the
              dishes, to the dismay of my roommates, and I had yet to hang the
              laundry. For most of my life, I found deep introspection to be
              corny, and I don&rsquo;t think I have really overcome this belief;
              however, recently, I think that my prolonged periods of isolation
              have unfortunately forced me to think about things more. I have
              completely immersed myself in escapism and addiction to fuel my
              narcissistic fantasies of grandiosity, but on Sunday, the humble
              reality of my true laziness hits. In reality, I&rsquo;m not very
              smart, not very hardworking, and, to be honest, not very likeable.
              I feel that I pursue meaningless things not to feel something, but
              rather to not feel the other.
            </p>

            <p>
              On this lazy Sunday morning, I believe I have not done much, and
              yet feel the privilege of no angst or fear of failure. I feel like
              I have earned this day. Most people assume that success is
              glorious, but to me, all I ever wanted was a break.
            </p>

            <p>
              Ever since I was a kid, I have had vivid, memorable, and
              modifiable dreams. And I have always dreamed of seclusion in a
              lazy town, doing a lazy job, and not worrying about anything.
            </p>

            <p>Ironic if you know me.</p>

            <p className="mt-10 pt-6 border-t border-black/10 text-black/50 italic text-[0.95rem]">
              The changes: &ldquo;corny&rdquo; lowercased, added a comma after
              it, &ldquo;purpose&rdquo; to &ldquo;pursue,&rdquo;
              &ldquo;gloriful&rdquo; to &ldquo;glorious,&rdquo; &ldquo;i&rdquo;
              to &ldquo;I,&rdquo; comma splice after &ldquo;this day&rdquo;
              became a period, &ldquo;Lazy Sunday Morning&rdquo; decapitalized.
              Everything else is untouched.
            </p>

            <p className="text-black/50 italic text-[0.95rem]">What?</p>
          </article>
        </div>
      </main>

      <Link
        href="/emotion"
        className="fixed top-6 left-6 z-10 text-xs text-black/30 tracking-widest hover:text-black/60 transition-colors"
        style={{ fontFamily: "monospace" }}
      >
        &larr; emotion
      </Link>
    </div>
  );
}
