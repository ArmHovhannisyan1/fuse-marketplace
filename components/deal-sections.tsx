"use client";
import {
  CheckCircle2,
  Circle,
  MapPin,
  Paintbrush,
  Check,
  History,
} from "lucide-react";
import type { Deal, DemoState, DemoCommand } from "@/lib/models";
import { fundedSeats, target } from "@/lib/domain";
import { formatDate, timeLeft } from "@/lib/format";
type SectionProps = { state: DemoState; deal: Deal };
export function ActivationRequirements({ state, deal }: SectionProps) {
  const seats = fundedSeats(state, deal);
  const isActivated = deal.activatedAt !== null;
  const expired = state.now >= deal.deadline && !isActivated;
  const requirements = [
    {
      done: seats === deal.requiredSeats,
      label: `${deal.requiredSeats} funded seats`,
      detail: `${seats} of ${deal.requiredSeats} seats · ${seats * deal.seatPrice} of ${target(deal)} demo tokens`,
    },
    {
      done: deal.venue.approvedAt !== null,
      label: "Venue approval",
      detail:
        deal.venue.approvedAt !== null
          ? "Participation and allocation approved"
          : "Waiting for the designated venue",
    },
    {
      done: deal.instructor.approvedAt !== null,
      label: "Instructor approval",
      detail:
        deal.instructor.approvedAt !== null
          ? "Participation and allocation approved"
          : "Waiting for the designated instructor",
    },
    {
      done: isActivated || state.now < deal.deadline,
      label: "Before the activation deadline",
      detail: isActivated
        ? "Activated before the deadline"
        : expired
          ? "The deadline has passed"
          : timeLeft(state.now, deal.deadline),
    },
  ];

  return (
    <section className="detail-section">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">EVERY PIECE MATTERS</span>
          <h2>Activation requirements</h2>
        </div>
      </div>
      <ul className="requirement-list">
        {requirements.map((item) => (
          <li key={item.label} className={item.done ? "requirement-done" : ""}>
            {item.done ? (
              <CheckCircle2 size={21} aria-hidden="true" />
            ) : (
              <Circle size={21} aria-hidden="true" />
            )}
            <div>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
            <small>{item.done ? "Met" : "Unmet"}</small>
          </li>
        ))}
      </ul>
      <p className="field-hint">
        Funding alone never activates a booking. Activation is an explicit
        action.
      </p>
    </section>
  );
}
export function SupplierCommitments({
  state,
  deal,
  ready,
  run,
}: SectionProps & { ready: boolean; run: (command: DemoCommand) => void }) {
  const isActivated = deal.activatedAt !== null;
  const expired = state.now >= deal.deadline && !isActivated;
  const payout = state.payouts.find((p) => p.dealId === deal.id);
  return (
    <section className="detail-section">
      <span className="eyebrow">FIXED PARTICIPATION & PAYOUTS</span>
      <h2>The people behind the workshop.</h2>
      <div className="supplier-grid">
        {(["venue", "instructor"] as const).map((role) => {
          const supplier = deal[role];
          const approved = supplier.approvedAt !== null;
          const authorized = state.identityId === supplier.identityId;
          const blocked = approved || isActivated || expired || !authorized;
          const reason = approved
            ? "Participation and allocation approved."
            : isActivated || expired
              ? "Approvals are closed for this booking."
              : !authorized
                ? `Switch to the designated ${role} in Demo controls to approve.`
                : "Approve the fixed participation and payout terms.";
          return (
            <article className="supplier-card" key={role}>
              <div className="supplier-icon">
                {role === "venue" ? (
                  <MapPin size={22} aria-hidden="true" />
                ) : (
                  <Paintbrush size={22} aria-hidden="true" />
                )}
              </div>
              <span className="eyebrow">
                {role.toUpperCase()} · MOCK IDENTITY
              </span>
              <h3>{supplier.name}</h3>
              <p className="supplier-allocation">
                <strong>{supplier.allocation}</strong> demo tokens{" "}
                <span>on activation</span>
              </p>
              <button
                type="button"
                className={`button button-small ${approved ? "button-approved" : "button-outline"}`}
                disabled={!ready || blocked}
                onClick={() =>
                  run({
                    type: "approve",
                    dealId: deal.id,
                    supplier: role,
                  })
                }
              >
                {approved ? <Check size={15} aria-hidden="true" /> : null}
                {approved ? "Approved" : `Approve as ${role}`}
              </button>
              <small>{reason}</small>
            </article>
          );
        })}
      </div>
      {payout && (
        <div className="payout-receipt">
          <CheckCircle2 size={22} aria-hidden="true" />
          <div>
            <h3>Simulated payout completed</h3>
            <p>
              Venue: <strong>{payout.venue}</strong> · Instructor:{" "}
              <strong>{payout.instructor}</strong> demo tokens
            </p>
            <small>
              {formatDate(payout.at)} · One all-or-nothing local update. No real
              transaction.
            </small>
          </div>
        </div>
      )}
    </section>
  );
}
export function ActivityHistory({ state, deal }: SectionProps) {
  return (
    <section className="detail-section">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">SIMULATED ACTIVITY</span>
          <h2>A shared view of commitments.</h2>
        </div>
        <History size={21} aria-hidden="true" />
      </div>
      <p className="field-hint">
        Local demo history, including seeded examples. These are not blockchain
        confirmations.
      </p>
      <ol className="activity-list">
        {state.activity
          .filter((a) => a.dealId === deal.id)
          .toSorted((a, b) => b.at - a.at || b.id.localeCompare(a.id))
          .map((a) => (
            <li key={a.id}>
              <span className="activity-dot" aria-hidden="true" />
              <div>
                <p>{a.message}</p>
                <time dateTime={new Date(a.at).toISOString()}>
                  {formatDate(a.at)}
                </time>
              </div>
            </li>
          ))}
      </ol>
    </section>
  );
}
