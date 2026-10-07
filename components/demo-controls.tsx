"use client";

import { useState } from "react";
import { Clock3, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { Deal } from "@/lib/models";
import { useDemo } from "@/lib/demo-store";
import { IDENTITIES } from "@/lib/seed";
import { formatDate, tokens } from "@/lib/format";
import { Dialog } from "./ui";

export function DemoControls({ deal }: { deal?: Deal }) {
  const { state, ready, execute, reset } = useDemo();
  const [confirmation, setConfirmation] = useState<"reset" | "expire" | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const expired = deal && state.now >= deal.deadline;
  return (
    <section className="demo-controls" aria-label="Demo controls">
      <div className="controls-heading">
        <SlidersHorizontal size={17} aria-hidden="true" />
        <h2>Demo controls</h2>
        <span>NOT A LOGIN</span>
      </div>
      <p>
        Explore the participant roles. These mock identities do not provide real
        authentication or access security.
      </p>
      <div className="controls-grid">
        <div>
          <label htmlFor="demo-identity">Act as</label>
          <select
            id="demo-identity"
            value={state.identityId}
            disabled={!ready}
            onChange={(event) => {
              execute({ type: "identity", identityId: event.target.value });
              setMessage("");
            }}
          >
            {IDENTITIES.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} · {i.role}
              </option>
            ))}
          </select>
          <span className="field-hint">
            Balance: <strong>{tokens(state.balances[state.identityId])}</strong>{" "}
            demo tokens
          </span>
        </div>
        <div className="clock-display">
          <span>
            <Clock3 size={14} aria-hidden="true" /> Simulated clock · frozen
          </span>
          <strong>{formatDate(state.now)}</strong>
          <small>Only the advance control changes time.</small>
        </div>
        <div className="controls-buttons">
          {deal && (
            <button
              type="button"
              className="button button-small button-outline"
              disabled={!ready || expired || deal.activatedAt !== null}
              onClick={() => setConfirmation("expire")}
            >
              Advance past deadline
            </button>
          )}
          <button
            type="button"
            className="text-button"
            disabled={!ready}
            onClick={() => setConfirmation("reset")}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset entire demo
          </button>
          {expired && <small>The deadline has already passed.</small>}
        </div>
      </div>
      {message && (
        <p role="status" className="inline-message">
          {message}
        </p>
      )}
      {confirmation && (
        <Dialog
          title={
            confirmation === "reset"
              ? "Reset the entire demo?"
              : "Advance the demo clock?"
          }
          onClose={() => setConfirmation(null)}
        >
          <p>
            {confirmation === "reset"
              ? "This clears your local commitments, approvals, payouts, and published bookings. All five examples and the original simulated clock will be restored."
              : "The shared simulated clock will move just beyond this booking’s deadline. Other unactivated bookings with earlier deadlines will also expire. Activation rules still apply."}
          </p>
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-outline"
              autoFocus
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                if (confirmation === "reset") {
                  reset();
                  setMessage("The original demo has been restored.");
                } else if (deal)
                  setMessage(
                    execute({ type: "expire", dealId: deal.id }).message,
                  );
                setConfirmation(null);
              }}
            >
              {confirmation === "reset" ? "Reset demo" : "Advance clock"}
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
