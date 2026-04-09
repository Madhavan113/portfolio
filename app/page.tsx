import IntroVideo from "@/components/IntroVideo";

export default function Home() {
  return (
    <>
      <IntroVideo />

      <main
        className="relative z-10 min-h-screen px-8 pt-10 pb-24 md:px-16 lg:px-24 max-w-4xl"
        style={{ pointerEvents: "none" }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <h1
            className="text-[clamp(3.5rem,10vw,7.5rem)] leading-[0.95] tracking-[-0.02em] mb-16 text-black"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
          >
            Madhavan
          </h1>

          <div className="space-y-8 text-[1.05rem] leading-[1.75] max-w-2xl font-bold text-black">
            <p>
              I want to learn more from you.
            </p>

            <p>
              My website&rsquo;s content is contradictory and often incorrect.
              That&rsquo;s the point. If you disagree with anything I write,
              feel free to reach out. I believe disagreement is the highest
              form of respect.
            </p>

            <div className="pt-2">
              <p className="mb-3">Some of my interests:</p>
              <ol className="list-none space-y-1 pl-4">
                <li>1. Poker, Games, Incentive-Based Environments</li>
                <li>2. RL Agents, Computer Use Models, Optimization</li>
                <li>3. Financial Markets</li>
                <li>4. Philosophy of Purpose</li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      <nav
        className="fixed top-8 right-8 flex flex-col items-end gap-5 z-10"
        aria-label="Links"
      >
        <a href="/dreams" className="text-sm font-bold text-black hover:opacity-60 transition-opacity">Dreams</a>
        <a href="/emotion" className="text-sm font-bold text-black hover:opacity-60 transition-opacity">Emotion</a>
        <a href="/ideas" className="text-sm font-bold text-black hover:opacity-60 transition-opacity">Ideas</a>
        <a
          href="https://x.com/madteryx"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a
          href="https://github.com/Madhavan113"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/in/madhavan-prasanna-4a8591280/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
      </nav>
    </>
  );
}
