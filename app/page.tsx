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
          <p className="italic">&ldquo;Disagreement is the highest form of respect.&rdquo;</p>
        </blockquote>
      </section>
    </div>
    
  );
}

