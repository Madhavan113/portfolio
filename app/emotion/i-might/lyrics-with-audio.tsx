"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LyricsWithAudioProps = {
  src: string;
  stanzas: string[];
  lineStartTimes: number[];
};

export default function LyricsWithAudio({
  src,
  stanzas,
  lineStartTimes,
}: LyricsWithAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeLine, setActiveLine] = useState(-1);

  const stanzaLines = useMemo(() => stanzas.map((stanza) => stanza.split("\n")), [
    stanzas,
  ]);

  const lineOffsets = useMemo(() => {
    let runningTotal = 0;
    return stanzaLines.map((lines) => {
      const start = runningTotal;
      runningTotal += lines.length;
      return start;
    });
  }, [stanzaLines]);

  const totalLines = useMemo(
    () => stanzaLines.reduce((sum, lines) => sum + lines.length, 0),
    [stanzaLines]
  );

  const hasStarted = activeLine >= 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const attemptPlayback = () => {
      audio.play().catch(() => {
        // Browser autoplay policies may block unmuted playback.
      });
    };

    attemptPlayback();

    const resumeOnInteraction = () => {
      if (audio.paused) attemptPlayback();
    };

    window.addEventListener("pointerdown", resumeOnInteraction, { once: true });
    window.addEventListener("keydown", resumeOnInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", resumeOnInteraction);
      window.removeEventListener("keydown", resumeOnInteraction);
    };
  }, []);

  const syncActiveLine = () => {
    const audio = audioRef.current;
    if (!audio || totalLines === 0 || lineStartTimes.length === 0) return;

    const t = audio.currentTime;

    if (t < lineStartTimes[0]) {
      setActiveLine(-1);
      return;
    }

    let low = 0;
    let high = Math.min(totalLines - 1, lineStartTimes.length - 1);
    let nextLine = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lineStartTimes[mid] <= t) {
        nextLine = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    setActiveLine(nextLine);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        autoPlay
        loop
        preload="auto"
        onLoadedMetadata={syncActiveLine}
        onTimeUpdate={syncActiveLine}
        onSeeked={syncActiveLine}
        className="hidden"
        aria-hidden="true"
      />

      <div className="relative">
        <article className="relative z-10 space-y-8 text-[1.05rem] leading-[1.9] max-w-2xl">
          {stanzaLines.map((lines, stanzaIndex) => (
            <p key={`stanza-${stanzaIndex}`} className="space-y-1">
              {lines.map((line, lineIndex) => {
                const absoluteLineIndex = lineOffsets[stanzaIndex] + lineIndex;
                const isActive = absoluteLineIndex === activeLine;
                const isNearby =
                  activeLine >= 0 && Math.abs(absoluteLineIndex - activeLine) <= 1;

                return (
                  <span
                    key={`line-${stanzaIndex}-${lineIndex}`}
                    className={`block transition-colors duration-300 ${
                      !hasStarted
                        ? "text-black/45"
                        : isActive
                        ? "text-black bg-amber-200/70 rounded-sm px-1 -mx-1 font-medium"
                        : isNearby
                        ? "text-black/85"
                        : "text-black/55"
                    }`}
                  >
                    {line}
                  </span>
                );
              })}
            </p>
          ))}
        </article>
      </div>
    </>
  );
}
