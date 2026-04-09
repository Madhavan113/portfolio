import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Environment Bottleneck — Madhavan Prasanna",
  description:
    "The binding constraint on computer-use AI is shifting from \"can the agent act?\" to \"can we generate enough worlds to evaluate and train it in?\"",
};

export default function EnvironmentBottleneckPost() {
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
            The Environment Bottleneck
          </h1>

          <article className="space-y-6 text-[1.05rem] leading-[1.8] text-black/85 max-w-2xl">
            <h2 className="text-lg font-bold text-black mt-10 mb-2">
              Three Properties of the Current Pipeline
            </h2>

            <p>
              Suppose you want to evaluate a computer-use agent on an HR
              platform. You need a seed state (right employees, right
              permissions, right leave balances), a task prompt, a golden run
              executed by hand, and a rubric. That&rsquo;s one environment. Now
              do it for an ERP system. Now do it for a project management tool.
              Now do it for every edge case you care about.
            </p>

            <p>The trouble is:</p>

            <p>
              <strong>Environments don&rsquo;t compose.</strong> The seed state
              for a leave approval shares almost nothing with an inventory
              reconciliation. Each encodes domain-specific semantics that resist
              abstraction. You cannot write a function that generalizes across
              them.
            </p>

            <p>
              <strong>Coverage is sparse.</strong> You test what you think of.
              The long tail, unusual state configurations, rare feature
              interactions, goes unexamined. This is exactly where capable
              agents fail.
            </p>

            <p>
              <strong>Benchmarks saturate.</strong> Benchmark grows linearly,
              agent capability grows exponentially. You stop measuring progress
              and start measuring benchmark-fit.
            </p>

            <p className="text-black/50 italic">
              N engineers produce ~kN environments. You can optimize k. You
              cannot escape the linearity.
            </p>

            <h2 className="text-lg font-bold text-black mt-10 mb-2">
              The Asymmetry
            </h2>

            <p>
              FDM-1 demonstrates that the agent side of computer action scales
              beautifully. Train on more video, get better agents. The dataset is
              internet-scale. The architecture handles hours of context. Scaling
              laws apply cleanly.
            </p>

            <p>
              The environment side has no such property. Every eval task is a
              bespoke artifact. Hand-authored by someone who understands both the
              application&rsquo;s semantics and the evaluation&rsquo;s intent.
              There is no dataset of environments to scale on. There is no
              architecture that compresses the problem. There is just labor.
            </p>

            <p>
              This is the asymmetry. And it means the binding constraint on
              computer-use AI is shifting from &ldquo;can the agent act?&rdquo;
              to &ldquo;can we generate enough worlds to evaluate and train it
              in?&rdquo;
            </p>

            <h2 className="text-lg font-bold text-black mt-10 mb-2">
              An Environment Model
            </h2>

            <p>
              Here is the idea. Same intuition FDM-1 applied to agents, applied
              to environments.
            </p>

            <p>
              A model that takes as input the surface of a web
              application, DOM structure, API topology, state schema, and
              jointly generates complete evaluation worlds. Not task prompts in
              isolation. Not templates. Coherent units consisting of:
            </p>

            <p>
              <strong>Seed states.</strong> Database configurations that are
              semantically coherent, not random. The kind of state that creates
              interesting decision surfaces for an agent.
            </p>

            <p>
              <strong>Task specs.</strong> Instructions where difficulty comes
              from requiring reasoning across multiple views, not from length.
            </p>

            <p>
              <strong>Adversarial inputs.</strong> Files with merged cells, mixed
              date formats, hidden sheets, generated from understanding
              which malformations are meaningful for the task, not from a
              library.
            </p>

            <p>
              <strong>Rubrics.</strong> Machine-evaluable success conditions
              generated by reasoning backward from the task and the app&rsquo;s
              state model.
            </p>

            <p>
              The key property is <em>jointness</em>. A template system can
              produce a thousand variations of &ldquo;change the status of
              ticket X to Y.&rdquo; What it cannot do is generate a seed state
              where that change has non-obvious downstream consequences, an
              adversarial file that triggers exactly the wrong behavior, and a
              rubric that checks the cascade. This compositional generation under
              semantic constraints is what makes it a learned model rather than a
              programmatic system.
            </p>

            <h2 className="text-lg font-bold text-black mt-10 mb-2">
              What Changes
            </h2>

            <p>If this works, three things happen.</p>

            <p>
              <strong>The linearity breaks.</strong> Marginal cost of a new
              environment drops from hours of engineering to seconds of compute.
              The constraint moves from human throughput to GPU throughput, which
              is the thing that scales exponentially.
            </p>

            <p>
              <strong>Coverage explodes.</strong> A generative model trained on
              the full surface of an application can explore the long tail that
              hand-authored benchmarks miss.
            </p>

            <p>
              <strong>Evaluation becomes adaptive.</strong> Instead of a fixed
              benchmark that agents saturate, you have a generator that produces
              harder environments in response to improving capabilities. The
              benchmark is no longer a set. It&rsquo;s a distribution that
              shifts.
            </p>

            <h2 className="text-lg font-bold text-black mt-10 mb-2">
              The Hard Parts
            </h2>

            <p>This is cleaner on paper than in practice.</p>

            <p>
              <strong>Semantic depth.</strong> The model needs to understand apps
              well enough to generate coherent seed states. Beyond DOM
              structure, entity relationships, business logic, permission
              models. Whether this can be learned from observation or requires
              access to source code is open.
            </p>

            <p>
              <strong>Rubric precision.</strong> Generating tasks is creative,
              many valid options. Generating rubrics is specification work, much
              narrower correctness band. Errors in rubrics corrupt the entire
              evaluation signal. This requires a kind of precision generative
              models don&rsquo;t typically have.
            </p>

            <p>
              <strong>Bootstrapping.</strong> You need high-quality environments
              to train the generator, but producing those is the bottleneck
              you&rsquo;re trying to break. Probably requires a
              curriculum, small hand-authored seed set, train, filter with
              human review, iterate.
            </p>

            <p className="mt-10 pt-6 border-t border-black/10 text-black/60 italic">
              FDM-1 showed that computer action scales when you find the right
              data and the right encoder. The environment side is waiting for the
              same treatment. I think whoever builds this closes the loop on
              scalable computer-use AI.
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
