export default function Home() {
  return (
    <div className="space-y-8">
      {/* Intro Section */}
      <section className="space-y-6">
        <p>
          I&apos;m trying to understand how to make better decisions under uncertainty.
        </p>
        <p>
          My interests include game theory, international relations, distributed systems, multi-agent RL, inference, prediction markets, and poker.
        </p>
      </section>

      {/* Quote Block */}
      <section className="mt-16">
        <blockquote className="border-l-2 border-charcoal pl-6 ml-4 max-w-md">
          <p className="italic">&ldquo;The map precedes the territory.&rdquo;</p>
          <footer className="mt-4 text-sm">
            — Jean Baudrillard
          </footer>
        </blockquote>
      </section>

      <p>
        I should point out: I don&apos;t think Baudrillard is smart, actually, I think every moral philosopher is wrong.
      </p>
    </div>
    
  );
}

