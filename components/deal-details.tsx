"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  MapPin,
  Info,
} from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import { dealStatus, target } from "@/lib/domain";
import { IDENTITIES } from "@/lib/seed";
import { formatDate } from "@/lib/format";
import { BRAND } from "@/lib/copy";
import { Dialog, StatusBadge, WorkshopArtwork } from "./ui";
import { DemoControls } from "./demo-controls";
import { BookingSidebar } from "./booking-sidebar";
import {
  ActivationRequirements,
  SupplierCommitments,
  ActivityHistory,
} from "./deal-sections";
import type { DemoCommand } from "@/lib/models";

export function DealDetails({ id }: { id: string }) {
  const { state, ready, execute } = useDemo();
  const [quantity, setQuantity] = useState("1");
  const [dialog, setDialog] = useState<"commit" | "activate" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const deal = state.deals.find((d) => d.id === id);
  if (!deal)
    return (
      <div className="container empty-page">
        {!ready ? (
          <p role="status">Loading your local demo bookings…</p>
        ) : (
          <>
            <span className="eyebrow">BOOKING NOT FOUND</span>
            <h1>This demo booking isn’t here.</h1>
            <p>
              It may have been cleared by a demo reset or created in another
              browser.
            </p>
            <Link className="button button-primary" href="/marketplace">
              Back to marketplace
            </Link>
          </>
        )}
      </div>
    );
  const identity = IDENTITIES.find((i) => i.id === state.identityId)!;
  const run = (command: DemoCommand) => {
    const result = execute(command);
    setMessage({ ok: result.ok, text: result.message });
    setDialog(null);
  };
  return (
    <div className="container detail-page">
      <Link className="back-link" href="/marketplace">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to marketplace
      </Link>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">{deal.category} · DEMO EXAMPLE</span>
          <h1>{deal.title}</h1>
          <p>
            <MapPin size={16} aria-hidden="true" />
            {deal.location}
          </p>
        </div>
        <StatusBadge status={dealStatus(state, deal)} />
      </div>
      <DemoControls deal={deal} />
      {message && (
        <div
          className={`action-message ${message.ok ? "message-success" : "message-error"}`}
          role={message.ok ? "status" : "alert"}
        >
          {message.ok ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <Info size={18} aria-hidden="true" />
          )}
          <span>{message.text}</span>
        </div>
      )}
      <div className="detail-grid">
        <div className="detail-main">
          <div className="detail-art">
            <WorkshopArtwork art={deal.art} />
          </div>
          <section className="detail-section">
            <span className="eyebrow">THE SHARED PLAN</span>
            <h2>A little time to make something.</h2>
            <p>{deal.description}</p>
            <div className="terms-note">
              <LockKeyhole size={16} aria-hidden="true" />
              <span>
                Published terms are fixed. The price, seat target, suppliers,
                allocations, and deadline cannot be edited.
              </span>
            </div>
          </section>
          <ActivationRequirements state={state} deal={deal} />
          <SupplierCommitments
            state={state}
            deal={deal}
            ready={ready}
            run={run}
          />
          <ActivityHistory state={state} deal={deal} />
          <section className="limit-note detail-limit">
            <h2>Booking formation has limits.</h2>
            <p>
              FUSE does not guarantee that this physical workshop happens after
              suppliers are paid, and does not resolve later disputes.{" "}
              {BRAND.solana}
            </p>
          </section>
        </div>
        <BookingSidebar
          state={state}
          deal={deal}
          ready={ready}
          quantity={quantity}
          setQuantity={setQuantity}
          onReview={() => {
            setMessage(null);
            setDialog("commit");
          }}
          onActivate={() => {
            setMessage(null);
            setDialog("activate");
          }}
          run={run}
        />
      </div>
      {dialog === "commit" && (
        <Dialog title="Review your commitment." onClose={() => setDialog(null)}>
          <p>
            You’re committing as <strong>{identity.name}</strong> to{" "}
            <strong>{deal.title}</strong>.
          </p>
          <dl className="summary-list dialog-summary">
            <div>
              <dt>Seat quantity</dt>
              <dd>{Number(quantity)}</dd>
            </div>
            <div>
              <dt>Total deposit</dt>
              <dd>{Number(quantity) * deal.seatPrice} demo tokens</dd>
            </div>
            <div>
              <dt>Activation deadline</dt>
              <dd>{formatDate(deal.deadline)}</dd>
            </div>
          </dl>
          <div className="confirmation-note">
            <LockKeyhole size={18} aria-hidden="true" />
            <p>
              Your deposit is locked when you confirm. No cancellation before
              activation or expiry in this prototype. If this booking is
              unactivated at the deadline, you can claim your own deposit back.
              Activated bookings do not offer refunds.
            </p>
          </div>
          <p className="field-hint">
            Simulated funds only. No real transaction will be made.
          </p>
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-outline"
              autoFocus
              onClick={() => setDialog(null)}
            >
              Go back
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() =>
                run({
                  type: "commit",
                  dealId: deal.id,
                  seats: Number(quantity),
                })
              }
            >
              Confirm {Number(quantity) * deal.seatPrice} demo tokens
            </button>
          </div>
        </Dialog>
      )}
      {dialog === "activate" && (
        <Dialog
          title="Bring the booking together."
          onClose={() => setDialog(null)}
        >
          <p>
            Every requirement is met. Activation simulates one all-or-nothing
            update with these fixed payouts:
          </p>
          <dl className="summary-list dialog-summary">
            <div>
              <dt>Venue</dt>
              <dd>{deal.venue.allocation} demo tokens</dd>
            </div>
            <div>
              <dt>Instructor</dt>
              <dd>{deal.instructor.allocation} demo tokens</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{target(deal)} demo tokens</dd>
            </div>
          </dl>
          <div className="confirmation-note">
            <Info size={18} aria-hidden="true" />
            <p>
              Activation happens once. Deposits will no longer be refundable.
              FUSE does not guarantee the physical workshop happens after
              suppliers are paid.
            </p>
          </div>
          <div className="dialog-actions">
            <button
              className="button button-outline"
              autoFocus
              onClick={() => setDialog(null)}
            >
              Go back
            </button>
            <button
              className="button button-primary"
              onClick={() => run({ type: "activate", dealId: deal.id })}
            >
              Confirm activation
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
