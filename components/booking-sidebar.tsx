"use client";
import Link from "next/link";
import { Clock3, Users, ArrowUpRight, Check, LockKeyhole } from "lucide-react";
import type { Deal, DemoState, DemoCommand } from "@/lib/models";
import {
  activationBlockers,
  commitmentBlocker,
  contributionsFor,
  fundedSeats,
  refundAmount,
} from "@/lib/domain";
import { IDENTITIES } from "@/lib/seed";
import { formatDate, timeLeft, tokens } from "@/lib/format";
import { FundingProgress } from "./ui";
interface BookingSidebarProps {
  state: DemoState;
  deal: Deal;
  ready: boolean;
  quantity: string;
  setQuantity: (quantity: string) => void;
  onReview: () => void;
  onActivate: () => void;
  run: (command: DemoCommand) => void;
}
export function BookingSidebar({
  state,
  deal,
  ready,
  quantity,
  setQuantity,
  onReview,
  onActivate,
  run,
}: BookingSidebarProps) {
  const seats = fundedSeats(state, deal);
  const own = contributionsFor(state, deal.id, state.identityId);
  const ownAmount = own.reduce((sum, c) => sum + c.amount, 0);
  const ownSeats = own.reduce((sum, c) => sum + c.seats, 0);
  const refunded = own
    .filter((c) => c.refundedAt !== null)
    .reduce((sum, c) => sum + c.amount, 0);
  const eligibleRefund = refundAmount(state, deal, state.identityId);
  const isActivated = deal.activatedAt !== null;
  const expired = state.now >= deal.deadline && !isActivated;
  const blockers = activationBlockers(state, deal);
  const commitReason = commitmentBlocker(state, deal, Number(quantity));
  const identity = IDENTITIES.find((i) => i.id === state.identityId)!;

  return (
    <aside className="booking-sidebar">
      <section className="booking-panel">
        <span className="eyebrow">YOUR PART IN THE PLAN</span>
        <div className="detail-price">
          <strong>{deal.seatPrice}</strong>
          <span>
            demo tokens
            <br />
            per seat
          </span>
        </div>
        <FundingProgress state={state} deal={deal} />
        <div className="deadline-row">
          <Clock3 size={17} aria-hidden="true" />
          <div>
            <span>Activation deadline</span>
            <strong>{formatDate(deal.deadline)}</strong>
            <small>
              {isActivated
                ? "Activated before deadline"
                : timeLeft(state.now, deal.deadline)}
            </small>
          </div>
        </div>
        <label htmlFor="seat-quantity">Seats to commit</label>
        <div className="seat-input">
          <Users size={18} aria-hidden="true" />
          <input
            id="seat-quantity"
            type="number"
            inputMode="numeric"
            min="1"
            max={Math.max(1, deal.requiredSeats - seats)}
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={isActivated || expired || seats === deal.requiredSeats}
          />
          <span>
            {tokens(
              Number(quantity) > 0 ? Number(quantity) * deal.seatPrice : 0,
            )}{" "}
            demo tokens
          </span>
        </div>
        <button
          type="button"
          className="button button-primary full-width"
          disabled={!ready || !!commitReason}
          aria-describedby="commit-reason"
          onClick={onReview}
        >
          Review commitment <ArrowUpRight size={17} aria-hidden="true" />
        </button>
        <p id="commit-reason" className="action-reason">
          {commitReason ??
            "Review the amount and locked-deposit terms before confirming."}
        </p>
        <div className="activation-action">
          <button
            type="button"
            className="button button-lime full-width"
            disabled={!ready || blockers.length > 0}
            aria-describedby="activation-reason"
            onClick={onActivate}
          >
            {isActivated ? "Booking activated" : "Activate booking"}
            {isActivated ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <ArrowUpRight size={17} aria-hidden="true" />
            )}
          </button>
          <div id="activation-reason" className="action-reason">
            {blockers.length ? (
              blockers.map((reason) => <p key={reason}>{reason}</p>)
            ) : (
              <p>
                Every requirement is met. Any demo participant can trigger
                activation.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="contribution-panel">
        <div className="contribution-heading">
          <LockKeyhole size={17} aria-hidden="true" />
          <h2>Your contribution</h2>
        </div>
        <p className="field-hint">
          {identity.name} · mock {identity.role}
        </p>
        {own.length ? (
          <>
            <dl className="summary-list">
              <div>
                <dt>Funded seats</dt>
                <dd>{ownSeats}</dd>
              </div>
              <div>
                <dt>Committed amount</dt>
                <dd>{ownAmount} demo tokens</dd>
              </div>
              <div>
                <dt>Deposit status</dt>
                <dd>
                  {refunded === ownAmount
                    ? "Refund claimed"
                    : isActivated
                      ? "Paid to suppliers"
                      : expired
                        ? "Refund available"
                        : "Locked"}
                </dd>
              </div>
              {refunded > 0 && (
                <div>
                  <dt>Returned to balance</dt>
                  <dd>{refunded} demo tokens</dd>
                </div>
              )}
            </dl>
            <button
              type="button"
              className="button button-outline full-width"
              disabled={!ready || !eligibleRefund}
              onClick={() => run({ type: "refund", dealId: deal.id })}
            >
              {refunded === ownAmount
                ? "Refund already claimed"
                : eligibleRefund
                  ? `Claim ${eligibleRefund} demo token refund`
                  : "Claim refund"}
            </button>
            <p className="action-reason">
              {refunded === ownAmount
                ? "Your deposit has been returned. A second claim is blocked."
                : isActivated
                  ? "Activated bookings do not offer refunds in this version."
                  : !expired
                    ? "No early withdrawals. Refunds become available at expiry if the booking has not activated."
                    : "This claim returns only your own unclaimed deposit."}
            </p>
          </>
        ) : (
          <p className="action-reason">
            This identity has no contribution to this booking. Choose Sam or
            Robin to explore the seeded attendee deposits.
          </p>
        )}
        <Link className="inline-link" href="/my-commitments">
          All my commitments <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </aside>
  );
}
