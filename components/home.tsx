"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDashed,
  Layers3,
  LockKeyhole,
  Users,
  Sparkles,
  Plus,
} from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import { FLAGSHIP_ID } from "@/lib/seed";
import { activationBlockers, dealStatus } from "@/lib/domain";
import { BRAND, FAQ } from "@/lib/copy";
import {
  ApprovalLabel,
  DealCard,
  FundingProgress,
  StatusBadge,
  WorkshopArtwork,
} from "./ui";

const steps = [
  [
    "01",
    "Set the conditions",
    "Define the seats, suppliers, payment allocations, and deadline.",
  ],
  [
    "02",
    "Bring everyone in",
    "Attendees commit funds. The venue and instructor approve their part.",
  ],
  [
    "03",
    "Make it happen",
    "Activate before the deadline when every requirement is met.",
  ],
  [
    "04",
    "Or claim it back",
    "If it expires without activation, contributors can claim their deposits.",
  ],
];
export function Home() {
  const { state } = useDemo();
  const deal = state.deals.find((d) => d.id === FLAGSHIP_ID)!;
  const ready = activationBlockers(state, deal).length === 0;
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="small-dot" />
            GOOD PLANS NEED EVERYONE.
          </span>
          <h1>
            Commit together.
            <br />
            <span>Make it happen.</span>
          </h1>
          <p>{BRAND.explanation}</p>
          <div className="hero-actions">
            <Link
              className="button button-primary"
              href={`/marketplace/${FLAGSHIP_ID}`}
            >
              Try the workshop demo{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link className="button button-outline" href="/marketplace">
              Explore marketplace <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="hero-note">
            <span className="mini-avatars" aria-hidden="true">
              <i>O</i>
              <i>V</i>
              <i>I</i>
              <i>A</i>
            </span>
            <span>
              One booking. Everyone’s commitment.
              <br />
              <strong>No wallet needed to explore.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="preview-top">
            <span>
              <CircleDashed size={14} aria-hidden="true" /> THE WORKSHOP DEMO
            </span>
            <span>01 / FUSE</span>
          </div>
          <div className="hero-preview">
            <div className="preview-art">
              <WorkshopArtwork art={deal.art} compact />
              <span className="preview-art-tag">LET’S MAKE SOMETHING.</span>
            </div>
            <div className="preview-body">
              <div className="preview-title">
                <div>
                  <span className="eyebrow">
                    A SMALL WORKSHOP. A SHARED PLAN.
                  </span>
                  <h2>{deal.title}</h2>
                </div>
                <span className="preview-price">
                  20<small>demo tokens / seat</small>
                </span>
              </div>
              <FundingProgress state={state} deal={deal} />
              <div className="preview-approvals">
                <ApprovalLabel
                  approved={deal.venue.approvedAt !== null}
                  label="Venue"
                />
                <ApprovalLabel
                  approved={deal.instructor.approvedAt !== null}
                  label="Instructor"
                />
              </div>
              <div className="preview-readiness">
                <span>
                  {ready || deal.activatedAt !== null ? (
                    <Check size={17} />
                  ) : (
                    <LockKeyhole size={17} />
                  )}
                  <strong>
                    Booking:{" "}
                    {deal.activatedAt !== null
                      ? "activated"
                      : ready
                        ? "ready to activate"
                        : state.now >= deal.deadline
                          ? "expired"
                          : "not ready"}
                  </strong>
                </span>
                <StatusBadge status={dealStatus(state, deal)} />
              </div>
            </div>
          </div>
          <p className="preview-caption">
            <span className="small-dot" />
            Funding is one part. Supplier commitment is the other.
          </p>
        </div>
      </section>
      <div className="principles-bar">
        <div className="container">
          <span>
            <Users size={17} aria-hidden="true" />
            People + funding + suppliers
          </span>
          <span>
            <Layers3 size={17} aria-hidden="true" />
            One set of shared conditions
          </span>
          <span>
            <Check size={17} aria-hidden="true" />
            All requirements. One activation.
          </span>
        </div>
      </div>
      <section className="container section problem-section">
        <div>
          <span className="eyebrow">THE COORDINATION GAP</span>
          <h2>
            Everyone’s waiting
            <br />
            for someone else.
          </h2>
        </div>
        <div>
          <p>
            Attendees wait for the venue and instructor to commit. Suppliers
            wait for enough confirmed demand. The organizer is stuck in the
            middle.
          </p>
          <p className="muted">
            FUSE gives everyone the same conditions to commit to, and a clear
            view of what’s still missing.
          </p>
          <Link className="inline-link" href="/how-it-works">
            See how the pieces come together{" "}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="how-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM “MAYBE” TO A SHARED PLAN</span>
              <h2>Four steps. One booking.</h2>
            </div>
            <Link className="inline-link" href="/how-it-works">
              How it works <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="steps-grid">
            {steps.map(([number, title, copy]) => (
              <article key={number}>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              SMALL EXPERIENCES, SHARED COMMITMENTS
            </span>
            <h2>Good things to make happen.</h2>
            <p>
              Explore a few demo bookings. All listings and funds are simulated.
            </p>
          </div>
          <Link className="button button-outline" href="/marketplace">
            View marketplace <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="deals-grid">
          {state.deals.slice(0, 3).map((d) => (
            <DealCard key={d.id} deal={d} state={state} />
          ))}
        </div>
      </section>
      <section className="why-section">
        <div className="container section">
          <div className="why-intro">
            <span className="eyebrow">WHY FUSE</span>
            <h2>
              More than a funding target.
              <br />A commitment from every side.
            </h2>
            <p>
              Enough money alone is not enough. The required suppliers must
              approve too.
            </p>
          </div>
          <div className="why-grid">
            {[
              [
                Layers3,
                "Shared conditions",
                "A fixed price, seat target, supplier allocation, and deadline. Everyone agrees to the same booking.",
              ],
              [
                Users,
                "Visible commitments",
                "See funded seats and each supplier’s approval in one place. Know exactly what is still missing.",
              ],
              [
                LockKeyhole,
                "Conditional payouts",
                "The demo pays suppliers only on activation. If the booking expires first, contributors can claim refunds.",
              ],
            ].map(([Icon, title, copy]) => {
              const Symbol = Icon as typeof Layers3;
              return (
                <article key={String(title)}>
                  <Symbol size={24} aria-hidden="true" />
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </article>
              );
            })}
          </div>
          <div className="future-note">
            <Sparkles size={18} aria-hidden="true" />
            <p>
              <strong>Working today: an interactive local demo.</strong>{" "}
              {BRAND.solana} No smart contract is deployed in this prototype.
            </p>
          </div>
        </div>
      </section>
      <section className="container section faq-section">
        <div>
          <span className="eyebrow">A FEW GOOD QUESTIONS</span>
          <h2>
            Before you
            <br />
            commit.
          </h2>
          <p className="muted">
            Clear conditions.
            <br />
            Clear expectations.
          </p>
        </div>
        <div className="faq-list">
          {FAQ.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <Plus size={18} aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="container cta-section">
        <div>
          <span className="eyebrow">LET’S BRING THE PIECES TOGETHER.</span>
          <h2>
            A small workshop.
            <br />A good place to start.
          </h2>
          <p>Try a commitment, approve as a supplier, and see what changes.</p>
        </div>
        <Link
          className="button button-lime"
          href={`/marketplace/${FLAGSHIP_ID}`}
        >
          Enter the demo <ArrowUpRight size={19} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
