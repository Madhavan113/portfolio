import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Vault They Can\u2019t Open \u2014 Madhavan Prasanna",
  description:
    "The entire history of cybersecurity has been organized around a single premise: prevent the breach. What if you made breach useless instead?",
};

export default function VaultPost() {
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
            The Vault They Can&rsquo;t Open
          </h1>

          <article className="space-y-6 text-[1.05rem] leading-[1.8] text-black/85 max-w-2xl">
            <p>
              There is a well-known asymmetry in cybersecurity that nobody has
              solved and I am increasingly convinced nobody can solve, at least
              not on its own terms, and the asymmetry is this: it costs more to
              defend than it does to attack. The defender has to protect every
              surface, every endpoint, every forgotten S3 bucket and every
              intern&rsquo;s laptop and every dependency six layers deep in the
              supply chain. The attacker needs one crack. One misconfigured port,
              one reused password, one moment of inattention on a Tuesday
              afternoon, and the perimeter is not breached so much as it is
              revealed to have been imaginary all along, a line drawn in water.
              This is sometimes called the defender&rsquo;s dilemma, and despite
              decades of firewalls and endpoint detection and zero trust
              architectures and security operations centers staffed by people who
              mass-consume energy drinks at two in the morning staring at
              dashboards, the fundamental calculus has not moved. The attacker is
              playing offense and the defender is playing defense, and offense is
              cheaper, and everyone in the industry knows this, and yet the
              entire industry is organized around the premise that defense, if
              you just do enough of it, will eventually work. It won&rsquo;t.
              Not on those terms.
            </p>

            <p>So what if you changed the terms?</p>

            <p>
              I want to describe an idea that I arrived at by a somewhat
              circuitous route, and the route matters because the idea in its
              final form only makes sense if you understand why the obvious
              versions of it fail, and they fail in ways that are instructive not
              just about cybersecurity but about the relationship between
              aggression and strategy more broadly, and I realize that sounds
              grandiose for what is ultimately a technical architecture proposal
              but I think the grandiosity is earned, or at least I hope it is, so
              bear with me.
            </p>

            <p>
              The first version of the idea is the one that occurs to you at 1am
              when you&rsquo;re angry about the asymmetry and not thinking
              clearly, and it goes like this: what if we planted files in our
              infrastructure that, once stolen, behaved like a remote access
              trojan aimed back at the attacker? A honeypot, except the honey is
              poisoned, except the poison is surgical, it reaches back through
              whatever channel the attacker used to exfiltrate the data, finds
              the stolen files on their machine, and destroys them. Or encrypts
              them. Or phones home with the attacker&rsquo;s IP and filesystem
              layout. Your data becomes a Trojan horse in the original Homeric
              sense: the enemy takes it inside their walls believing it is a
              prize, and in the night it opens and the soldiers pour out.
            </p>

            <p>
              The appeal is visceral and immediate. Suddenly the attacker has to
              worry about every file they steal. Is this real data or is it a
              weapon aimed at me? The cost asymmetry inverts. The attacker
              becomes the one who has to be paranoid about every move. You can
              feel, when you think about this, the same satisfaction that
              Archimedes presumably felt when he proposed using mirrors to set
              the Roman fleet on fire, the pleasure of turning the enemy&rsquo;s
              aggression back on itself, of making the act of attack into its own
              punishment. It is deeply, deeply appealing. It is also, when you
              think about it for more than fifteen minutes, wrong in at least
              three ways that matter.
            </p>

            <p>
              The first way it is wrong is legal. The moment your code executes
              on someone else&rsquo;s machine without their authorization, you
              have committed what most jurisdictions consider unauthorized
              access, and this is true regardless of your intent, regardless of
              whether the target stole from you first, regardless of whether your
              payload only touches &ldquo;your&rdquo; data. The Computer Fraud
              and Abuse Act does not have a self-defense clause. The Computer
              Misuse Act does not care that they started it. You might argue, as
              I initially did, that this is analogous to Apple remotely bricking
              a stolen iPhone, or Tesla disabling features on a car that&rsquo;s
              behind on payments, or John Deere turning a tractor into a very
              expensive paperweight because the farmer had the audacity to repair
              it himself. But those cases rest on a contractual foundation that
              your scenario lacks entirely. Apple can brick your phone because
              you agreed to let them when you clicked through sixty pages of
              terms of service that nobody reads. Your attacker signed no such
              agreement. The EULA defense does not extend to adversaries, however
              satisfying it would be if it did.
            </p>

            <p>
              The second way it is wrong is the attribution problem, which is
              subtler and in some ways worse. How do you know the machine your
              payload lands on actually belongs to the threat actor? Sophisticated
              attackers operate through layers of compromised intermediaries, a
              botnet here, a VPN there, a hacked university server in a country
              whose extradition treaties are more theoretical than practical.
              Your retaliatory payload might execute on a machine belonging to a
              hospital, or a school, or a journalist whose laptop was compromised
              months ago and who has no idea it&rsquo;s being used as a proxy.
              You&rsquo;ve now attacked a victim in the name of attacking an
              attacker, and the legal and moral calculus of that should give
              anyone pause.
            </p>

            <p>
              The third way it is wrong is the most fundamental, and it is this:
              it doesn&rsquo;t work against anyone worth worrying about. Any
              competent attacker (and the ones you&rsquo;re actually afraid of
              are competent, the nation-state actors and the serious ransomware
              operators and the corporate espionage teams) will open your
              exfiltrated data inside a sandboxed virtual machine with no network
              access. They will strip any executable components. They will
              extract the raw data and discard the container. Your embedded
              payload, your carefully crafted Trojan horse, sits inert inside a
              sandbox while the attacker reads your database in a text editor.
              You have built, at considerable expense and legal risk, a defense
              that catches only amateurs, and the amateurs were not the threat
              model you were worried about. The cost asymmetry has not inverted.
              It has gotten worse, because now you&rsquo;re spending resources on
              offensive capabilities that don&rsquo;t work in addition to
              defensive capabilities that don&rsquo;t work, and the attacker is
              laughing, or would be if they knew, which they don&rsquo;t, because
              they never triggered your payload in the first place.
            </p>

            <p>
              This is where I sat for a while, frustrated, because the intuition
              underneath the bad idea felt right even as the implementation was
              clearly wrong. The intuition is: stop playing defense on
              defense&rsquo;s terms. Make the attacker&rsquo;s success costly to
              the attacker. Change the game rather than playing the existing game
              harder. That impulse is correct. The execution was the problem.
            </p>

            <p>
              And then I thought about what it would mean if the data, instead of
              attacking the attacker, simply refused to be useful outside its
              authorized environment. Not a weapon. Not a payload. Not code that
              executes on a foreign machine. Just data that doesn&rsquo;t work
              when you take it out of context, the way a key doesn&rsquo;t work
              when you take it to the wrong door, except the key looks like
              every other key and the attacker has no way of knowing it
              won&rsquo;t work until they try it and find ciphertext where they
              expected plaintext.
            </p>

            <p>
              This is, I think, the right version of the idea, and the right
              version is better than the wrong version in every dimension: it is
              legal (you are not executing code on anyone&rsquo;s machine), it is
              attribution-independent (you don&rsquo;t need to know who stole
              your data or where it went), and it works against sophisticated
              attackers (because no amount of sandbox isolation helps you decrypt
              data when you don&rsquo;t have the keys and the keys are
              physically bound to hardware you don&rsquo;t possess).
            </p>

            <p>
              The architecture has four layers and each one addresses a different
              failure mode.
            </p>

            <p>
              The first layer is hardware attestation. Your data is encrypted at
              rest, always, and the decryption keys live inside a Trusted
              Platform Module or secure enclave on your authorized servers and
              nowhere else. The keys are not files you can copy. They are bound
              to specific hardware through an attestation chain that the hardware
              itself enforces. An attacker who exfiltrates your database gets
              ciphertext. The keys are on hardware they do not control and cannot
              replicate. They have stolen a vault with no combination.
            </p>

            <p>
              The second layer is context-aware key release. Hardware identity
              alone is not enough, because hardware can be compromised, so the
              key server evaluates a set of environmental claims before it will
              release decryption material. Is this request originating from an
              authorized network range? Is the requesting process signed with a
              known binary hash? Is the database running inside its expected
              container image, with its expected configuration, in its expected
              orchestration environment? Workload identity frameworks like
              SPIFFE/SPIRE exist precisely for this kind of multi-factor
              environmental assertion. The key server doesn&rsquo;t just ask
              &ldquo;who are you?&rdquo; It asks &ldquo;where are you, what are
              you, and can you prove it?&rdquo;
            </p>

            <p>
              The third layer is where the idea gets, I think, genuinely
              interesting, and it involves zero-knowledge proofs used not as a
              buzzword (the way most blockchain projects use them, as a kind of
              cryptographic cologne sprayed over an architecture that
              doesn&rsquo;t need it) but as a structural necessity. The
              authorized application proves to the key server that it satisfies
              all access conditions without revealing what those conditions are.
              This matters because if an attacker can observe the attestation
              protocol, they can learn what environmental signals they&rsquo;d
              need to spoof. Zero-knowledge enforcement means the protocol leaks
              nothing. The attacker doesn&rsquo;t just lack the keys, they
              don&rsquo;t even know what locks they&rsquo;d need to pick.
            </p>

            <p>
              The fourth layer is an append-only audit trail, and this is where a
              blockchain or transparency log serves an actual purpose rather than
              a marketing one. Every key release event is logged in a
              tamper-evident ledger. Not for the encryption itself but for
              accountability. If your data surfaces somewhere it shouldn&rsquo;t,
              on a dark web marketplace, in a competitor&rsquo;s product, in a
              leaked document, you can cryptographically demonstrate that it was
              never released through any authorized decryption channel. The proof
              is not &ldquo;we think they stole it.&rdquo; The proof is
              &ldquo;here is a mathematical guarantee that no legitimate access
              produced this data.&rdquo;
            </p>

            <p>
              The beauty of this scheme, the thing that makes it fundamentally
              different from the retaliatory honeypot, is that it is entirely
              passive. You are not attacking anyone. You are not executing code
              on foreign machines. You are not risking collateral damage or legal
              exposure. The data simply does not function outside its authorized
              context, the way a fish does not function outside water, not
              because anyone is punishing the fish but because the fish was built
              for water and the data was built for your environment. An attacker
              who spends weeks or months breaching your perimeter, mapping your
              infrastructure, exfiltrating your crown jewels, walks away with
              encrypted blobs and no path to decryption. The cost asymmetry has
              finally, actually inverted: they spent everything and got nothing.
            </p>

            <p>
              I should be honest about the failure modes, because intellectual
              honesty requires it and because anyone who tells you their security
              architecture has no failure modes is selling you something.
            </p>

            <p>
              The first failure mode is the application layer. If an attacker
              compromises your application, through SQL injection, stolen
              credentials, a supply chain attack on a dependency, they
              don&rsquo;t need the encrypted files. They query data through your
              app, which can pass attestation because it is running in the
              authorized environment, and the data comes back decrypted because
              the system is working exactly as designed. At some point the data
              has to be plaintext in memory for your application to use it, and
              that point is the window, and it is a window that no amount of
              at-rest encryption can close.
            </p>

            <p>
              The second failure mode is insider threat. An authorized employee
              operating within the trusted environment can export decrypted data
              at will. Your entire encryption layer is invisible to them because
              they are the context the system was designed to trust. This is not
              a bug in the architecture so much as a boundary of what it
              addresses, the way a lock on your front door does not protect you
              from someone who lives in your house.
            </p>

            <p>
              Which is why the strongest version of this idea, the version I
              actually believe in, combines the environment-bound encryption with
              the deception layer from the original honeypot concept, not the
              retaliatory payload, but the misdirection. You seed your real data
              with decoy records that are indistinguishable from legitimate
              entries but that function as canary tokens. If a decoy surfaces
              outside the system, you know you have a breach, you know which data
              set was compromised, and you know approximately when. The
              encryption handles the external smash-and-grab. The decoys handle
              the insider threat and the application-layer compromise. Together
              they form a defense that addresses multiple threat vectors without
              requiring you to break any laws or execute code on anyone&rsquo;s
              machine.
            </p>

            <p className="mt-10 pt-6 border-t border-black/10 text-black/60 italic">
              And here is the thing I keep coming back to, the thing that makes
              me think this is more than a technical proposal. The entire history
              of cybersecurity has been organized around a single premise:
              prevent the breach. Build the wall higher. Make the perimeter
              stronger. Detect faster. Respond quicker. And this premise is
              correct as far as it goes but it does not go far enough, because
              the attacker only has to be right once and the defender has to be
              right every time, and over a long enough timeline the defender will
              not be right every time, and everyone knows this, and yet the
              industry keeps playing the same game because the game is familiar
              and the tooling is mature and the quarterly reports need to show
              something. The idea I&rsquo;ve been describing is not about
              preventing breach. It is about making breach useless. About
              building a world in which the attacker gets in, gets what they came
              for, gets out, sits down to examine their prize, and finds that
              they are holding a vault they cannot open, seeded with decoys they
              cannot distinguish from reality, logged by a system they cannot
              tamper with. They won. And it didn&rsquo;t matter.
            </p>

            <p className="text-black/60 italic">
              That, I think, is what it looks like when the best defense is the
              best offense, not retaliation, not counter-intrusion, not the
              fantasy of striking back, but the quiet, structural guarantee that
              the thing they came to steal was never stealable in the first
              place.
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
