import IntroVideo from "@/components/IntroVideo";

export default function DreamsPage() {
  return (
    <>
      <IntroVideo />

      <main
        className="relative z-10 flex min-h-screen items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <p
          className="text-black/40 text-sm tracking-[0.2em] uppercase"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          refactoring
        </p>
      </main>

      <a
        href="/"
        className="fixed top-6 left-6 z-10 text-xs text-black/30 tracking-widest hover:text-black/60 transition-colors"
        style={{ fontFamily: "monospace" }}
      >
        &larr; back
      </a>
    </>
  );
}
