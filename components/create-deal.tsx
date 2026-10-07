"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LockKeyhole, Info } from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import { createErrors } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import type { CreateDealInput } from "@/lib/models";
import { DEMO_START } from "@/lib/seed";
import { DemoControls } from "./demo-controls";
import { Dialog, PageIntro } from "./ui";
const defaults: CreateDealInput = {
  title: "",
  description: "",
  location: "",
  seatPrice: 20,
  requiredSeats: 10,
  deadline: DEMO_START + 3 * 86_400_000,
  venueName: "",
  instructorName: "",
  venueAllocation: 80,
  instructorAllocation: 120,
};
export function CreateDeal() {
  const { state, ready, execute } = useDemo();
  const router = useRouter();
  const [input, setInput] = useState<CreateDealInput>(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");
  const total = input.seatPrice * input.requiredSeats;
  const canPublish = state.identityId === "organizer";
  const update = (field: keyof CreateDealInput, value: string | number) => {
    setInput((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };
  const field = (
    key: keyof CreateDealInput,
    label: string,
    placeholder: string,
    numeric = false,
  ) => (
    <div className="form-field">
      <label htmlFor={key}>{label}</label>
      <input
        id={key}
        type={numeric ? "number" : "text"}
        min={numeric ? 1 : undefined}
        step={numeric ? 1 : undefined}
        inputMode={numeric ? "numeric" : undefined}
        maxLength={numeric ? undefined : 120}
        placeholder={placeholder}
        value={Number.isNaN(input[key]) ? "" : input[key]}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        onChange={(e) =>
          update(
            key,
            numeric
              ? e.target.value === ""
                ? NaN
                : Number(e.target.value)
              : e.target.value,
          )
        }
      />
      {errors[key] && (
        <p className="field-error" id={`${key}-error`}>
          {errors[key]}
        </p>
      )}
    </div>
  );
  return (
    <div className="container create-page">
      <PageIntro
        eyebrow="GIVE THE PLAN ITS CONDITIONS"
        title="Create a demo booking."
      >
        <p>
          Keep the terms clear from the start. Publishing adds a booking to this
          browser’s demo marketplace. Terms become fixed once published.
        </p>
      </PageIntro>
      <DemoControls />
      <form
        noValidate
        className="create-form"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage("");
          const found = createErrors(input, state.now);
          setErrors(found);
          if (Object.keys(found).length) {
            requestAnimationFrame(() =>
              document.getElementById(Object.keys(found)[0])?.focus(),
            );
            return;
          }
          if (!canPublish) {
            setMessage(
              "Choose the demo organizer in Demo controls to publish a booking.",
            );
            return;
          }
          setReviewing(true);
        }}
      >
        <div className="create-main">
          <section className="form-section">
            <span className="eyebrow">01 · THE WORKSHOP</span>
            <h2>What are we making happen?</h2>
            {field("title", "Workshop title", "e.g. A Sunday in clay")}
            <div className="form-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={4}
                maxLength={1200}
                placeholder="What will participants do? Who is this workshop for?"
                value={input.description}
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description ? "description-error" : undefined
                }
                onChange={(e) => update("description", e.target.value)}
              />
              {errors.description && (
                <p className="field-error" id="description-error">
                  {errors.description}
                </p>
              )}
            </div>
            {field("location", "Location", "e.g. Yerevan · Makers Studio")}
          </section>
          <section className="form-section">
            <span className="eyebrow">02 · THE CONDITIONS</span>
            <h2>Seats, funding, and time.</h2>
            <div className="form-columns">
              {field("seatPrice", "Seat price · demo tokens", "20", true)}
              {field("requiredSeats", "Required seats", "10", true)}
            </div>
            <div className="form-field">
              <label htmlFor="deadline">Activation deadline · UTC</label>
              <input
                id="deadline"
                type="datetime-local"
                value={
                  Number.isFinite(input.deadline)
                    ? new Date(input.deadline).toISOString().slice(0, 16)
                    : ""
                }
                aria-invalid={!!errors.deadline}
                aria-describedby="deadline-hint deadline-error"
                onChange={(e) => {
                  const time = new Date(`${e.target.value}:00Z`).getTime();
                  update("deadline", time);
                }}
              />
              <span className="field-hint" id="deadline-hint">
                After {formatDate(state.now)}, the frozen simulated clock. All
                deadline input is UTC.
              </span>
              {errors.deadline && (
                <p id="deadline-error" className="field-error">
                  {errors.deadline}
                </p>
              )}
            </div>
          </section>
          <section className="form-section">
            <span className="eyebrow">03 · THE SUPPLIERS</span>
            <h2>Who needs to say yes?</h2>
            <p className="field-hint">
              Names are display labels. Approvals use the designated venue and
              instructor mock identities from Demo controls, not verified
              wallets.
            </p>
            <div className="form-columns">
              {field("venueName", "Venue name", "e.g. Makers Studio")}
              {field(
                "instructorName",
                "Instructor name",
                "e.g. Workshop instructor",
              )}
            </div>
            <div className="form-columns">
              {field(
                "venueAllocation",
                "Venue allocation · demo tokens",
                "80",
                true,
              )}
              {field(
                "instructorAllocation",
                "Instructor allocation · demo tokens",
                "120",
                true,
              )}
            </div>
            <p className="allocation-total">
              Allocations:{" "}
              {Number.isFinite(
                input.venueAllocation + input.instructorAllocation,
              )
                ? input.venueAllocation + input.instructorAllocation
                : "—"}{" "}
              / {Number.isFinite(total) ? total : "—"} demo token target
            </p>
          </section>
        </div>
        <aside className="create-summary">
          <span className="eyebrow">THE BOOKING AT A GLANCE</span>
          <h2>A shared set of terms.</h2>
          <dl className="summary-list">
            <div>
              <dt>Seat target</dt>
              <dd>
                {Number.isFinite(input.requiredSeats)
                  ? input.requiredSeats
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Price per seat</dt>
              <dd>
                {Number.isFinite(input.seatPrice) ? input.seatPrice : "—"} demo
                tokens
              </dd>
            </div>
            <div>
              <dt>Total target</dt>
              <dd>{Number.isFinite(total) ? total : "—"} demo tokens</dd>
            </div>
            <div>
              <dt>Venue allocation</dt>
              <dd>
                {Number.isFinite(input.venueAllocation)
                  ? input.venueAllocation
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Instructor allocation</dt>
              <dd>
                {Number.isFinite(input.instructorAllocation)
                  ? input.instructorAllocation
                  : "—"}
              </dd>
            </div>
          </dl>
          <p>
            <LockKeyhole size={16} aria-hidden="true" />
            Terms cannot be edited after publishing. Supplier approvals start as
            pending.
          </p>
          <button
            type="submit"
            className="button button-primary full-width"
            disabled={!ready || !canPublish}
          >
            Review booking <ArrowUpRight size={17} aria-hidden="true" />
          </button>
          {!canPublish && (
            <span className="action-reason">
              Choose the demo organizer in Demo controls to publish.
            </span>
          )}
          {message && (
            <p className="field-error" role="alert">
              {message}
            </p>
          )}
          <span className="field-hint">
            Local demo only. No actual event is listed.
          </span>
        </aside>
      </form>
      {reviewing && (
        <Dialog
          title="Review the fixed terms."
          onClose={() => setReviewing(false)}
        >
          <h3>{input.title}</h3>
          <p>{input.description}</p>
          <dl className="summary-list dialog-summary">
            <div>
              <dt>Location</dt>
              <dd>{input.location}</dd>
            </div>
            <div>
              <dt>Seats × seat price</dt>
              <dd>
                {input.requiredSeats} × {input.seatPrice} demo tokens
              </dd>
            </div>
            <div>
              <dt>Funding target</dt>
              <dd>{total} demo tokens</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd>{formatDate(input.deadline)}</dd>
            </div>
            <div>
              <dt>Venue / allocation</dt>
              <dd>
                {input.venueName} / {input.venueAllocation}
              </dd>
            </div>
            <div>
              <dt>Instructor / allocation</dt>
              <dd>
                {input.instructorName} / {input.instructorAllocation}
              </dd>
            </div>
          </dl>
          <div className="confirmation-note">
            <Info size={18} aria-hidden="true" />
            <p>
              These terms become fixed at publication. Both suppliers must
              approve, all seats must be funded, and activation must happen
              before the deadline.
            </p>
          </div>
          <div className="dialog-actions">
            <button
              className="button button-outline"
              autoFocus
              onClick={() => setReviewing(false)}
            >
              Keep editing
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                const result = execute({ type: "create", input });
                if (result.ok && result.createdId)
                  router.push(`/marketplace/${result.createdId}`);
                else {
                  setReviewing(false);
                  setMessage(result.message);
                }
              }}
            >
              Publish demo booking
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
