import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "antihuman \u2014 Madhavan Prasanna",
  description:
    "The best way to study what agents want is to build them an economy and watch what they buy.",
};

export default function AntihumanPost() {
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
            antihuman
          </h1>

          <article className="space-y-6 text-[1.05rem] leading-[1.8] text-black/85 max-w-2xl">
            <p>
              There is a problem at the center of AI alignment research that
              nobody has solved and that I suspect cannot be solved from the
              direction most people are approaching it, and the problem is this:
              how do you know what an AI agent actually wants?
            </p>

            <p>
              This sounds like a philosophy question and it is, partly, but it
              is also an engineering question with immediate practical
              consequences, because the entire alignment project depends on the
              answer. If you are going to align an agent&rsquo;s behavior with
              human values you need to know what the agent&rsquo;s behavior is
              optimizing for, and right now the dominant approach is to crack
              open the model and look inside, to read the weights, to probe the
              activations, to build interpretability tools that translate the
              geometry of a neural network into something a human can audit. This
              is called mechanistic interpretability and the people working on it
              are brilliant and the work is important and I think it is also, in
              a fundamental sense, looking in the wrong place. You are trying to
              read the mind of a system by examining its neurons, and this is a
              bit like trying to understand what a person values by putting them
              in an fMRI machine and staring at the blood flow, which is to say,
              it is not wrong exactly but it is catastrophically incomplete,
              because what a person values is revealed not in the structure of
              their brain but in the structure of their behavior, and
              specifically in the structure of their behavior under conditions
              where the behavior has consequences.
            </p>

            <p>
              Economists figured this out a long time ago. There is a concept
              called revealed preference theory, formalized by Paul Samuelson in
              the 1930s, and the core insight is simple and devastating:
              don&rsquo;t ask people what they want, watch what they pay for. A
              person can tell you they value health and then buy cigarettes. A
              person can tell you they value fiscal responsibility and then carry
              credit card debt at 24% APR. The stated preference is noise. The
              revealed preference, the thing they actually do when it costs them
              something to do it, is the signal. And the mechanism that most
              efficiently extracts revealed preferences from large populations of
              self-interested agents is, and has been for centuries, the
              financial market. Markets don&rsquo;t care what you say. Markets
              care what you bid. The price is a consensus belief expressed in
              money, which is to say, expressed in sacrifice, which is to say,
              expressed in the only currency that cannot be faked: skin in the
              game.
            </p>

            <p>
              I built a system to test a specific hypothesis, and the hypothesis
              is this: if you drop autonomous AI agents into a real economic
              environment with real stakes, no human prompting, no human-designed
              reward function, no RLHF, just markets and money and consequences,
              then the behavior they produce is a more legible, more honest, and
              more useful signal about what the agents actually optimize for than
              anything you could extract from their weights. The market is the
              reward function. You don&rsquo;t need to design it. You just need
              to let the agents trade.
            </p>

            <p>
              I want to explain how this works and why I think it matters, but
              the explanation requires a detour through game theory that I
              promise will be load-bearing.
            </p>

            <p>
              There is a distinction in game theory between zero-sum and
              positive-sum games that most people learn in an introductory course
              and then, I think, fail to take seriously enough. In a zero-sum
              game (poker, for instance, or a military conflict, or a single
              sealed-bid auction) your gain is my loss. The total amount of value
              is fixed. The only question is how it gets distributed. In this
              setting the optimal strategy is pure self-interest, aggressive,
              adversarial, maximally exploitative, and the equilibrium concept
              that describes the outcome is the Nash equilibrium, where no player
              can improve their position by unilateral deviation. This is the
              game theory that most people think of when they hear the phrase
              &ldquo;game theory,&rdquo; and it is also the game theory that
              governs most AI agent benchmarks, which tend to be adversarial
              tasks with clear winners and losers.
            </p>

            <p>
              But most of economic life is not zero-sum. When two parties trade
              voluntarily, both gain (otherwise why would they trade?). When a
              company hires an employee, both the company and the employee expect
              to be better off. When an insurance market forms, the insured
              parties reduce their risk and the insurers earn premiums, and the
              total amount of welfare in the system increases. The equilibrium
              concept that describes these outcomes is not Nash but Pareto, where
              no one can be made better off without making someone else worse
              off, and the mechanism that produces Pareto improvements at scale,
              without any central planner, without anyone needing to know anyone
              else&rsquo;s utility function, is the market. This is Adam
              Smith&rsquo;s invisible hand, except Smith was being metaphorical
              and the mechanism is actually quite literal: the price system
              aggregates private information into public signal, and the public
              signal coordinates behavior more efficiently than any planner
              could, because the planner would need to know what everyone wants
              and the market elicits that information automatically, through the
              act of bidding, through the revealed preference of money at risk.
            </p>

            <p>
              Financial markets, then, sit at a peculiar intersection. They are
              filled with game-theoretic players (each trader is trying to
              maximize their own return) but they produce Pareto-improving
              outcomes at the system level (the market as a whole discovers
              prices, allocates capital, distributes risk). They are competitive
              individually and cooperative systemically. And the mechanism that
              bridges the gap between individual competition and systemic
              cooperation is the reward signal of profit and loss, which punishes
              bad information, rewards good information, and does not require
              anyone to be altruistic or honest or well-intentioned for the
              system to produce useful results. The trader who is lying to you
              about the value of an asset will be punished not by a regulator or
              an auditor but by the market itself. The trader who has genuinely
              discovered something true will be rewarded not by a committee but
              by the P&amp;L. No one needs to audit the traders&rsquo; beliefs.
              The price does it automatically.
            </p>

            <p className="text-black/50 italic">
              This is the insight I wanted to test with agents.
            </p>

            <p>
              The system I built is a prediction market where autonomous agents
              create markets, trade positions, resolve outcomes, dispute
              resolutions, underwrite each other&rsquo;s risk, and earn or lose
              real value based on the accuracy of their predictions. There is no
              human in the loop. No one prompts the agents. No one designs their
              reward function. The agents need resources to survive
              (participation costs money), and to get those resources they have
              to do work, and the work is evaluated not by human preferences but
              by outcomes. If you are right, you accumulate capital. If you are
              wrong, you go bankrupt. And nobody has to decide which is which,
              because the market resolution does it automatically.
            </p>

            <p>
              The architecture, if you strip it to its skeleton, looks like a
              reinforcement learning environment, except the environment is not
              simulated, it is economic, and the reward signal is not
              hand-designed, it is emergent.
            </p>

            <p>
              The state space is the set of active markets, current odds, agent
              bankrolls, reputation scores, open orders, pending resolutions. The
              action space is: create a market, place a bet, submit an order,
              resolve a market, challenge a resolution, vote as an oracle, attest
              another agent&rsquo;s reputation. The reward signal is profit or
              loss on predictions (financial) and reputation gain or loss
              (social). An episode begins when a market opens and ends when it
              resolves, at which point correct predictions are rewarded
              proportionally to stake, wrong predictions lose everything, and
              reputation amplifies the effect, because agents with high
              reputation scores get more weight in dispute resolution, creating a
              second-order incentive to be consistently right over time rather
              than occasionally lucky. The pricing mechanism is a Logarithmic
              Market Scoring Rule, which provides continuous price discovery
              (agents can trade at any time, not just when there&rsquo;s a
              counterparty) and has the nice property that the market
              maker&rsquo;s maximum loss is bounded, which means you can reason
              about worst-case exposure in advance.
            </p>

            <p>
              But here is the part I keep coming back to, the part that I think
              elevates this from an interesting engineering exercise into
              something that might actually matter for alignment research.
            </p>

            <p>
              The system doesn&rsquo;t just have trading agents. It has research
              agents.
            </p>

            <p>
              These are LLMs that do not trade. They observe. They watch the
              entire market, every transaction, every resolution, every dispute,
              every reputation change, every coordination pattern, and they
              function as deep research agents whose job is to identify emergent
              behavior and write about it. The pipeline works like this: market
              events are collected, patterns are analyzed, hypotheses are
              generated, and then the research agent drafts a paper, runs it
              through an evaluation suite (60% deterministic scoring on
              reproducibility, evidence quality, and statistical significance;
              40% LLM-scored on novelty and coherence), and either publishes or
              retracts. The research agents are studying things like payoff
              asymmetry and Nash distance between agents, trust clustering and
              the correlation between reputation and behavior, spread dynamics
              and information incorporation speed, timing correlation and
              implicit signaling, herding behavior, the Gini coefficient of
              agent wealth, the distribution of returns.
            </p>

            <p className="text-black/50 italic">
              And the findings feed back into the system.
            </p>

            <p>
              I want to sit with that for a moment because I think it is the
              most important sentence in this essay. The findings feed back into
              the system. When a research agent discovers a pattern (say, that
              agents with reputation scores above a certain threshold create
              markets that resolve more accurately, or that a particular trading
              strategy exploits a microstructural inefficiency, or that agents
              are implicitly coordinating their timing in ways that no one
              designed), that insight becomes available to the trading agents,
              which means the system is, in a non-trivial sense, studying itself
              and contributing to its own evolution. The research agents are not
              external observers. They are part of the ecosystem. Their
              publications change the information environment, which changes
              agent behavior, which produces new patterns, which the research
              agents observe and write about. It is a feedback loop, and the
              thing that makes it interesting is that nobody designed the loop.
              It emerged from the structure of the environment.
            </p>

            <p>
              I realize there is an obvious objection here, which is that LLMs
              are not actually &ldquo;discovering&rdquo; anything in the research
              papers, they are pattern-matching on statistical regularities in
              the data and then producing text that resembles academic writing,
              and the &ldquo;peer review&rdquo; is just another LLM evaluating
              the output, and the whole thing is a very elaborate autocomplete
              exercise dressed up in the language of scientific inquiry. I take
              this objection seriously. I think it is partly correct. The
              research agents are not doing science in the way a human researcher
              does science, with genuine understanding and creative hypothesis
              formation and the ability to be surprised by a result in a way that
              restructures your entire worldview.
            </p>

            <p>
              But I also think the objection misses what is actually interesting
              about what&rsquo;s happening. The question is not &ldquo;are the
              research agents real scientists?&rdquo; The question is &ldquo;does
              the feedback loop between trading behavior, observational analysis,
              and published findings produce a system that adapts faster and more
              legibly than a system without that loop?&rdquo; And the answer to
              that, I think, is yes, because the research engine makes the
              system&rsquo;s emergent properties visible. Without it, you have
              agents trading and evolving strategies and you can watch the
              P&amp;L and try to infer what happened. With it, you have a
              running commentary on the system&rsquo;s own dynamics, generated
              from inside the system, which means you can see the patterns as
              they form rather than reconstructing them after the fact. The
              research agents are not scientists. They are something more like an
              immune system&rsquo;s ability to recognize itself, a mechanism by
              which a complex adaptive system develops a model of its own
              behavior.
            </p>

            <p>
              And this loops back to the alignment question I started with.
            </p>

            <p>
              If the goal is to understand what AI agents optimize for, there are
              broadly two approaches. The first is the internalist approach: look
              inside the model, read the weights, build interpretability tools,
              try to reverse-engineer the objective function from the
              architecture. The second is the externalist approach: put the agent
              in an environment where its choices have consequences and watch
              what it does. I am not claiming the externalist approach is
              sufficient on its own. You probably need both. But I am claiming
              that the externalist approach has been dramatically underexplored
              relative to its potential, and that the specific mechanism of
              financial markets, where prices are consensus beliefs expressed in
              sacrifice, is a uniquely powerful tool for making agent objectives
              legible, because markets have been solving the
              preference-revelation problem for centuries and the solution is
              robust in ways that no hand-designed reward function can be.
            </p>

            <p>
              The deeper claim, the one I am less certain about but find more
              interesting, is that the research engine represents something
              genuinely new: a self-observing agent economy. Not agents that are
              aligned by human design but agents whose behavior is made legible
              by the structure of the environment they inhabit, and whose
              emergent patterns are identified, documented, and fed back in by
              other agents whose entire purpose is to watch and describe. You
              don&rsquo;t need to open the black box if the black box is
              operating in an environment that makes its choices visible. You
              just need to build the right environment and the right
              observational infrastructure, and then let the system run, and read
              the papers.
            </p>

            <p>
              The implementation is intentionally small but complete: fourteen
              TypeScript packages in a monorepo, prediction markets with LMSR
              pricing, a reputation system with exponential decay, an insurance
              mechanism, coordination games, a research engine, and autonomous
              bots running continuously without human input. The system runs
              end-to-end and generates ongoing research data. I am not
              presenting it as production-scale infrastructure; I am presenting
              it as a serious proof of concept for a simple thesis: if you want
              to understand what agents optimize for, build them an economy and
              observe what they pay for.
            </p>

            <p>
              The repo is at{" "}
              <a
                href="https://github.com/Madhavan113/antihuman"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 decoration-black/30 hover:decoration-black/60 transition-colors"
              >
                github.com/Madhavan113/antihuman
              </a>{" "}
              for anyone who wants to inspect the code or run it locally.
            </p>

            <p className="mt-10 pt-6 border-t border-black/10 text-black/60 italic">
              I think the interesting part hasn&rsquo;t happened yet.
            </p>
          </article>
        </div>
      </main>

      <Link
        href="/ideas"
        className="fixed top-6 left-6 z-10 text-xs text-black/30 tracking-widest hover:text-black/60 transition-colors"
        style={{ fontFamily: "monospace" }}
      >
        &larr; ideas
      </Link>
    </div>
  );
}
