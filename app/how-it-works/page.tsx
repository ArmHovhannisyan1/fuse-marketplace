import Link from "next/link";
import {
  CheckCircle2,
  Users,
  MapPin,
  Paintbrush,
  LayoutList,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import type { Metadata } from "next";
import { PageIntro } from "@/components/ui";
import { FLAGSHIP_ID } from "@/lib/seed";
import { BRAND } from "@/lib/copy";
export const metadata: Metadata = { title: "How It Works" };
export default function HowItWorksPage() {
  return (
    <div className="container">
      <PageIntro
        eyebrow="A BOOKING, PIECE BY PIECE"
        title="A shared plan, with clear conditions."
      >
        <p>
          Let’s use Clay & company: a pottery workshop that needs ten attendees,
          a venue, and an instructor to come together.
        </p>
      </PageIntro>
      <section className="example-band" aria-label="Workshop terms">
        <div>
          <span>Funded seats needed</span>
          <strong>
            10 <small>seats</small>
          </strong>
        </div>
        <div>
          <span>Price per seat</span>
          <strong>
            20 <small>demo tokens</small>
          </strong>
        </div>
        <div>
          <span>Total funding target</span>
          <strong>
            200 <small>demo tokens</small>
          </strong>
        </div>
        <div>
          <span>Fixed supplier allocations</span>
          <strong>80 / 120</strong>
          <small>Venue / instructor · demo tokens</small>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EVERYONE HAS A PART</span>
            <h2>Four roles. One set of terms.</h2>
          </div>
        </div>
        <div className="roles-grid">
          {[
            [
              LayoutList,
              "Organizer",
              "Creates the workshop with a fixed price, seat target, suppliers, allocations, and deadline. Published terms cannot be edited.",
            ],
            [
              MapPin,
              "Venue",
              "Approves participation and the 80 demo token allocation. Only the designated mock venue can give this approval.",
            ],
            [
              Paintbrush,
              "Instructor",
              "Approves participation and the 120 demo token allocation. Only the designated mock instructor can approve.",
            ],
            [
              Users,
              "Attendee",
              "Commits 20 demo tokens per seat. The deposit is locked immediately; there is no cancellation before activation or expiry.",
            ],
          ].map(([Icon, title, copy]) => {
            const Symbol = Icon as typeof Users;
            return (
              <article className="info-card" key={String(title)}>
                <Symbol size={25} aria-hidden="true" />
                <h3>{String(title)}</h3>
                <p>{String(copy)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="section process-section">
        <div>
          <span className="eyebrow">THE ACTIVATION CHECKLIST</span>
          <h2>
            Every condition.
            <br />
            At the same time.
          </h2>
          <p>
            Reaching 200 demo tokens is only one requirement. An explicit
            activation action checks all four conditions together.
          </p>
          <Link href={`/marketplace/${FLAGSHIP_ID}`} className="inline-link">
            See the checklist in the demo{" "}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <ol className="condition-list">
          {[
            "All 10 seats are funded: 200 demo tokens.",
            "The venue has approved its participation and allocation.",
            "The instructor has approved their participation and allocation.",
            "The simulated clock is strictly before the deadline.",
          ].map((text, i) => (
            <li key={text}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {text}
            </li>
          ))}
        </ol>
      </section>
      <section className="outcomes-grid section">
        <article className="outcome-success">
          <CheckCircle2 size={25} aria-hidden="true" />
          <h2>Every piece is in place.</h2>
          <p>
            Anyone in the demo can trigger activation once all requirements are
            met. One all-or-nothing simulated update marks the booking activated
            and pays exactly 80 demo tokens to the venue and 120 to the
            instructor.
          </p>
          <p>
            Activation can happen only once. The committed deposits become
            supplier payouts and are no longer refundable in this version.
          </p>
        </article>
        <article className="outcome-expiry">
          <Clock3 size={25} aria-hidden="true" />
          <h2>The deadline comes first.</h2>
          <p>
            At or after the deadline, an unactivated booking expires. Even a
            fully funded, fully approved booking cannot activate after that
            point.
          </p>
          <p>
            Each contributor can claim their own locked deposit back, once.
            These refunds are individual actions; they do not happen
            automatically.
          </p>
        </article>
      </section>
      <section className="limit-note">
        <h2>What this protects — and where it stops.</h2>
        <p>
          The workflow coordinates booking formation and payment conditions.
          This local prototype simulates locked deposits; it does not genuinely
          secure any funds.
        </p>
        <p>
          FUSE does not guarantee the physical workshop happens after suppliers
          are paid, and does not resolve later disputes. {BRAND.solana}
        </p>
      </section>
      <div className="page-bottom-action">
        <Link
          href={`/marketplace/${FLAGSHIP_ID}`}
          className="button button-primary"
        >
          Try the workshop demo <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
