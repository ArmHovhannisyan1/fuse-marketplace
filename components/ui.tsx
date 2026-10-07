"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  CircleDashed,
  X,
} from "lucide-react";
import type { Deal, DealStatus, DemoState, WorkshopArt } from "@/lib/models";
import { dealStatus, fundedSeats, target } from "@/lib/domain";
import { timeLeft, tokens } from "@/lib/format";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="FUSE home"
    >
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span>
        FUSE<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
export function StatusBadge({ status }: { status: DealStatus }) {
  const success = status === "Activated" || status === "Ready to activate";
  const expired = status.startsWith("Expired") || status === "Fully refunded";
  const Icon = success ? CheckCircle2 : expired ? Clock3 : CircleDashed;
  return (
    <span
      className={`status-badge ${success ? "status-success" : expired ? "status-expired" : ""}`}
    >
      <Icon size={13} aria-hidden="true" />
      {status}
    </span>
  );
}
export function WorkshopArtwork({
  art,
  compact = false,
}: {
  art: WorkshopArt;
  compact?: boolean;
}) {
  return (
    <div
      className={`workshop-art art-${art} ${compact ? "art-compact" : ""}`}
      aria-hidden="true"
    >
      <div className="art-grid" />
      <div className="art-orbit" />
      <div className="art-object object-one" />
      <div className="art-object object-two" />
      <div className="art-object object-three" />
      <span className="art-caption">
        {art === "clay"
          ? "a little clay. a little company."
          : art === "print"
            ? "make your mark."
            : art === "coffee"
              ? "good things, brewed together."
              : art === "botanical"
                ? "room to grow."
                : "made by hand."}
      </span>
      <span className="art-spark">✳</span>
    </div>
  );
}
export function FundingProgress({
  state,
  deal,
}: {
  state: DemoState;
  deal: Deal;
}) {
  const seats = fundedSeats(state, deal);
  const amount = seats * deal.seatPrice;
  return (
    <div className="funding">
      <div className="funding-label">
        <span>
          <strong>{seats}</strong> of {deal.requiredSeats} seats funded
        </span>
        <span>{Math.round((seats / deal.requiredSeats) * 100)}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Seats funded"
        aria-valuenow={seats}
        aria-valuemin={0}
        aria-valuemax={deal.requiredSeats}
      >
        <span style={{ width: `${(seats / deal.requiredSeats) * 100}%` }} />
      </div>
      <div className="funding-amount">
        {tokens(amount)} of {tokens(target(deal))} demo tokens
      </div>
    </div>
  );
}
export function ApprovalLabel({
  approved,
  label,
}: {
  approved: boolean;
  label: string;
}) {
  return (
    <span
      className={`approval-label ${approved ? "is-approved" : "is-pending"}`}
    >
      {approved ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Clock3 size={14} aria-hidden="true" />
      )}
      <span>
        {label}: {approved ? "approved" : "awaiting approval"}
      </span>
    </span>
  );
}
export function DealCard({ deal, state }: { deal: Deal; state: DemoState }) {
  return (
    <article className="deal-card">
      <Link
        href={`/marketplace/${deal.id}`}
        className="art-link"
        aria-label={`View ${deal.title}`}
      >
        <WorkshopArtwork art={deal.art} />
        <span className="art-demo-label">DEMO EXAMPLE</span>
      </Link>
      <div className="deal-card-body">
        <div className="card-eyebrow">
          <span>{deal.category}</span>
          <StatusBadge status={dealStatus(state, deal)} />
        </div>
        <h3>
          <Link href={`/marketplace/${deal.id}`}>{deal.title}</Link>
        </h3>
        <p className="card-description">{deal.description}</p>
        <div className="card-price">
          <strong>{deal.seatPrice}</strong>
          <span>demo tokens / seat</span>
        </div>
        <FundingProgress state={state} deal={deal} />
        <div className="card-approvals">
          <ApprovalLabel
            approved={deal.venue.approvedAt !== null}
            label="Venue"
          />
          <ApprovalLabel
            approved={deal.instructor.approvedAt !== null}
            label="Instructor"
          />
        </div>
        <div className="card-bottom">
          <span>
            <Clock3 size={14} aria-hidden="true" />
            {deal.activatedAt !== null
              ? "Booking activated"
              : timeLeft(state.now, deal.deadline)}
          </span>
          <Link
            href={`/marketplace/${deal.id}`}
            aria-label={`Details for ${deal.title}`}
          >
            Details <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    // React's autoFocus can run while <dialog> is still closed. Focus only after
    // showModal so the first safe action is focused and native focus trapping works.
    dialog?.querySelector<HTMLButtonElement>(".dialog-actions button")?.focus();
    return () => {
      dialog?.close();
      opener?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-inner">
        <button
          className="icon-button dialog-close"
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">SIMULATED DEMO ACTION</span>
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow">
        <span className="small-dot" />
        {eyebrow}
      </span>
      <h1>{title}</h1>
      <div className="page-intro-copy">{children}</div>
    </div>
  );
}
