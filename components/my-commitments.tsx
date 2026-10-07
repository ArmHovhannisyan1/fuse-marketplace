"use client";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import { contributionsFor, dealStatus, refundAmount } from "@/lib/domain";
import { IDENTITIES } from "@/lib/seed";
import { DemoControls } from "./demo-controls";
import { PageIntro, StatusBadge } from "./ui";
export function MyCommitments() {
  const { state } = useDemo();
  const identity = IDENTITIES.find((i) => i.id === state.identityId)!;
  const deals = state.deals.filter(
    (d) => contributionsFor(state, d.id, state.identityId).length > 0,
  );
  return (
    <div className="container commitments-page">
      <PageIntro eyebrow="YOUR PART IN THE PLAN" title="My commitments.">
        <p>
          Seats, deposits, and refunds for {identity.name}, your current mock
          identity. All balances and contributions are simulated.
        </p>
      </PageIntro>
      <DemoControls />
      {deals.length ? (
        <div className="commitment-list">
          {deals.map((d) => {
            const contributions = contributionsFor(
              state,
              d.id,
              state.identityId,
            );
            const amount = contributions.reduce((s, c) => s + c.amount, 0);
            const seats = contributions.reduce((s, c) => s + c.seats, 0);
            const refunded = contributions.every((c) => c.refundedAt !== null);
            const available = refundAmount(state, d, state.identityId);
            return (
              <article key={d.id} className="commitment-card">
                <div>
                  <span className="eyebrow">DEMO BOOKING</span>
                  <h2>
                    <Link href={`/marketplace/${d.id}`}>{d.title}</Link>
                  </h2>
                  <StatusBadge status={dealStatus(state, d)} />
                </div>
                <dl>
                  <div>
                    <dt>Funded seats</dt>
                    <dd>{seats}</dd>
                  </div>
                  <div>
                    <dt>Amount committed</dt>
                    <dd>{amount} demo tokens</dd>
                  </div>
                  <div>
                    <dt>Deposit / refund</dt>
                    <dd>
                      {refunded
                        ? "Refund completed"
                        : d.activatedAt !== null
                          ? "Paid to suppliers · no refund"
                          : available
                            ? `${available} demo tokens to claim`
                            : "Locked · until activation or expiry"}
                    </dd>
                  </div>
                </dl>
                <Link
                  className="button button-outline button-small"
                  href={`/marketplace/${d.id}`}
                >
                  {available ? "Claim on details page" : "View booking"}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <LockKeyhole size={30} aria-hidden="true" />
          <h2>No attendee commitments for this identity.</h2>
          <p>
            Select Sam or Robin to explore existing attendee deposits, or browse
            the marketplace to make a commitment as an attendee.
          </p>
          <Link href="/marketplace" className="button button-primary">
            Browse workshops
          </Link>
        </div>
      )}
    </div>
  );
}
