import Link from "next/link";
import type { Metadata } from "next";
import LyricsWithAudio from "@/app/emotion/i-might/lyrics-with-audio";

const stanzas = [
  `Stand still
Time be moving by so fast so you gotta chill
And now my life heavy monetised that's how I feel
Chase your dreams so you live your life with no guilt she said`,
  `Cause you just might, might
(Oh yeah)
Cause you just might
Cause you just might - might
(Oh yeah)
Cause you just might
Cause you just might - might
(Yeah)`,
  `At a new crib in Paris
And you know that I'm fucking all night
And you know that she need the attention
When I come and then deep dive inside
It's like all of these hoes want a mention
When I turn around, look for the light
Don't try to get up in my section
My room was two meters in size
She asking me all of these questions
She the devil and I see it in her eyes
I think she gon' come and confess
She a demon but her body divine`,
  `I get this thing when I'm feeling connection
My heart on froze sometimes I fake affection
This bitch a curse but she act like a blessing
I don't know nun bout your life
I know that my life, I know it's in need of your essence
Let's make it right start confessing`,
  `I, just wanna know what's stopping us
I, just wanna know what's up with us
My visions fading out of (uh)
My visions fading out of sight
Hit the blunt, leave my body be-
Hit the blunt, leave my body behind
I cried, you cried and
I just wanna see the stars align`,
  `"What defines reality, what makes something real?
For all you know, we could all be a product of our
Universes imagination, flowing, in one state, of consciousness"`,
  `I might (just, just)
I might (just) go
I might (just)
Yeah baby yeah I might (yeah)
I just want some company
I want you on top of me
I just want you to (uh) confess
I don't think your a human being
I don't think you are meant for me
I think think that you came from beneath
You wearing all of these different faces
Don't play dumb I know you're into me`,
  `Into - Know your into me (Ah)
Into - Know your into me (Ah)
Into - Know your into me
Into - Know your into - into
Into - Know your into me (Ah)
Into - Know your into me (Ah)
Into - Know your into me
Into - Know your into - into`,
  `I did them things with you and I didn't know
I did them things with you and I didn't know
I did them things with you and I didn't know
(I did them things with you and I didn't know)
I didn't know
I didn't know`,
];

const lineTimeAnchors: Record<number, number> = {
  0: 4.5,
  1: 7.47,
  2: 11.32,
  3: 15.78,
  4: 19.9,
  5: 21.29,
  6: 22.68,
  7: 24.07,
  8: 25.46,
  9: 26.85,
  10: 28.24,
  11: 29.63,
  12: 31.04,
  13: 34.24,
  14: 36.6,
  15: 38.56,
  16: 40.88,
  17: 42.92,
  18: 45.32,
  19: 47.2,
  20: 49.52,
  21: 51.88,
  22: 53.78,
  23: 56.0,
  24: 58.04,
  25: 62.48,
  26: 64.76,
  27: 66.9,
  28: 69.68,
  29: 72.0,
  30: 74.24,
  31: 76.2,
  32: 78.6,
  33: 80.58,
  34: 83.06,
  35: 85.42,
  36: 87.68,
  37: 88.8,
  38: 92.36,
  39: 97.8,
  40: 101.08,
  41: 107.32,
  42: 110.08,
  43: 111.5,
  44: 120.84,
  45: 124.88,
  46: 127.88,
  47: 130.26,
  48: 132.46,
  49: 135.02,
  50: 137.3,
  51: 139.86,
  52: 142.18,
  53: 145.5,
  54: 147.5,
  55: 149.5,
  56: 151.5,
  57: 153.5,
  58: 155.5,
  59: 157.2,
  60: 159.0,
  61: 161.88,
  62: 167.18,
  63: 172.18,
  64: 176.5,
  65: 197.4,
  66: 199.86,
};

function buildLineStartTimes(
  totalLines: number,
  endingTime = 202.22,
  leadInTime = 6.5
) {
  const result = new Array<number>(totalLines).fill(0);
  const anchors = Object.entries(lineTimeAnchors)
    .map(([index, time]) => ({ index: Number(index), time }))
    .filter(({ index }) => index >= 0 && index < totalLines)
    .sort((a, b) => a.index - b.index);

  if (anchors.length === 0) return result;

  const first = anchors[0];
  for (let i = 0; i <= first.index; i += 1) {
    if (first.index === 0) {
      result[i] = first.time;
      continue;
    }
    result[i] = leadInTime + ((first.time - leadInTime) * i) / first.index;
  }

  for (let a = 0; a < anchors.length - 1; a += 1) {
    const current = anchors[a];
    const next = anchors[a + 1];
    result[current.index] = current.time;
    const distance = next.index - current.index;
    if (distance <= 0) continue;
    const step = (next.time - current.time) / distance;
    for (let i = current.index + 1; i < next.index; i += 1) {
      result[i] = current.time + step * (i - current.index);
    }
  }

  const last = anchors[anchors.length - 1];
  result[last.index] = last.time;
  if (last.index < totalLines - 1) {
    const distance = totalLines - 1 - last.index;
    const step = distance === 0 ? 0 : (endingTime - last.time) / distance;
    for (let i = last.index + 1; i < totalLines; i += 1) {
      result[i] = last.time + step * (i - last.index);
    }
  }

  return result.map((value) => Number(value.toFixed(2)));
}

const totalLines = stanzas.reduce(
  (count, stanza) => count + stanza.split("\n").length,
  0
);
const lineStartTimes = buildLineStartTimes(totalLines, 202.22, 6.5);

export const metadata: Metadata = {
  title: "i might — Madhavan Prasanna",
  description: "Lyrics from i might with ambient local playback.",
};

export default function IMightPost() {
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
            i might
          </h1>

          <LyricsWithAudio
            src="/audio/i-might.mp4"
            stanzas={stanzas}
            lineStartTimes={lineStartTimes}
          />
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
