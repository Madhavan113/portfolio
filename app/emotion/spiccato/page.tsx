"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function SpiccatoPost() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.play().catch(() => {});

    const resume = () => {
      if (audio.paused) audio.play().catch(() => {});
    };

    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });

    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <audio
        ref={audioRef}
        src="/audio/spiccato.mp4"
        autoPlay
        loop
        preload="auto"
        className="hidden"
        aria-hidden="true"
      />

      <main className="px-8 pt-10 pb-24 md:px-16 lg:px-24 max-w-3xl">
        <div>
          <h1
            className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-[-0.02em] mb-12 text-black"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
            }}
          >
            spiccato
          </h1>

          <article className="space-y-6 text-[1.05rem] leading-[1.8] text-black/85 max-w-2xl">
            <p>
              I write very informally and out of place, but I hope you can
              listen to how the jumble can come up with coherence.
            </p>

            <p
              className="italic text-black/70"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Spiccato.
            </p>
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
