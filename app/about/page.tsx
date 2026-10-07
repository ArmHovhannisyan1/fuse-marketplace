import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Layers3, Users } from "lucide-react";
import { PageIntro } from "@/components/ui";
import { BRAND } from "@/lib/copy";
export const metadata: Metadata = { title: "About" };
export default function AboutPage() {
  return (
    <div className="container">
      <PageIntro
        eyebrow="WHY WE’RE BUILDING FUSE"
        title="Good ideas deserve a way to come together."
      >
        <p>
          Our mission is to make interdependent commitments easier to
          coordinate. When a plan needs several people to say yes, everyone
          should be able to see the same conditions.
        </p>
      </PageIntro>
      <section className="about-story section">
        <div className="about-brand-art" aria-hidden="true">
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <span>
            Better,
            <br />
            together.
          </span>
        </div>
        <div>
          <span className="eyebrow">A SMALL TEAM. A SHARED START.</span>
          <h2>
            Two siblings.
            <br />
            Our first hackathon together.
          </h2>
          <p>
            We’re two siblings building FUSE for a Colosseum submission. This is
            our first hackathon project together.
          </p>
          <p>
            We’re starting with one practical example: a small paid workshop. It
            makes the coordination problem tangible — attendees, a venue, and an
            instructor all need to commit before the booking can move forward.
          </p>
          <p>
            Our first milestone is a clear website and a working interactive
            demo. The next step is to bring the same conditions to Solana.
          </p>
        </div>
      </section>
      <section className="about-values section">
        <article>
          <Users size={24} aria-hidden="true" />
          <h2>Useful before technical.</h2>
          <p>
            People need to know who has committed, what is still missing, and
            what happens if the booking doesn’t activate. That comes before
            blockchain terminology.
          </p>
        </article>
        <article>
          <Layers3 size={24} aria-hidden="true" />
          <h2>Honest about what works.</h2>
          <p>
            This prototype uses demo tokens and local browser state.{" "}
            {BRAND.solana} There is no deployed contract, live escrow, or real
            wallet transaction yet.
          </p>
        </article>
      </section>
      <section className="limit-note">
        <h2>A focused first version.</h2>
        <p>
          FUSE coordinates booking formation and payment conditions. It does not
          guarantee that a physical event happens after suppliers are paid, and
          it does not resolve later disputes.
        </p>
      </section>
      <div className="page-bottom-action">
        <Link className="button button-primary" href="/marketplace">
          Explore the demo marketplace{" "}
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
