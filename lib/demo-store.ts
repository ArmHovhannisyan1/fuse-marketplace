"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { DemoCommand, DemoState } from "./models";
import { createSeed } from "./seed";
import { transition } from "./domain";
import { decodeState, STORAGE_KEY } from "./storage";

interface Snapshot {
  state: DemoState;
  ready: boolean;
  notice: string;
}
const initial: Snapshot = { state: createSeed(), ready: false, notice: "" };
let snapshot = initial;
const listeners = new Set<() => void>();
let initialized = false;
function emit() {
  listeners.forEach((listener) => listener());
}
function save(state: DemoState) {
  let notice = snapshot.notice;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    notice =
      "Browser storage is unavailable. Changes will last for this session only.";
  }
  snapshot = { state, ready: true, notice };
  emit();
}
function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let state = createSeed();
  let notice = "";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const restored = decodeState(raw);
      if (restored) state = restored;
      else
        notice =
          "Saved demo data was invalid or from an older version. A fresh demo has been restored.";
    }
  } catch {
    notice =
      "Browser storage is unavailable. Changes will last for this session only.";
  }
  snapshot = { state, ready: true, notice };
  save(state);
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    const restored = decodeState(event.newValue);
    if (restored) {
      snapshot = { state: restored, ready: true, notice: "" };
      emit();
    }
  });
}

export interface ActionResult {
  ok: boolean;
  message: string;
  createdId?: string;
}
// The UI calls this adapter. A Solana adapter can later implement commands and
// snapshots using wallet authorization, contract accounts, and confirmed reads.
export const mockAdapter = {
  execute(command: DemoCommand): ActionResult {
    if (!snapshot.ready)
      return { ok: false, message: "The demo is loading. Please try again." };
    try {
      const next = transition(snapshot.state, command);
      save(next);
      return {
        ok: true,
        message:
          command.type === "commit"
            ? "Commitment recorded in the demo. Your deposit is now locked."
            : command.type === "approve"
              ? "Supplier approval recorded in the demo."
              : command.type === "activate"
                ? "Booking activated. The exact supplier payouts were simulated."
                : command.type === "refund"
                  ? "Your deposit was returned to your demo balance."
                  : command.type === "expire"
                    ? "Simulated clock advanced. All bookings use this shared clock."
                    : "Demo updated.",
        createdId:
          command.type === "create" ? next.deals.at(-1)?.id : undefined,
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to complete this demo action.",
      };
    }
  },
  reset() {
    snapshot = { state: createSeed(), ready: true, notice: "" };
    save(snapshot.state);
  },
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => snapshot;
const getServerSnapshot = () => initial;
export function useDemo() {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  useEffect(initialize, []);
  return { ...current, execute: mockAdapter.execute, reset: mockAdapter.reset };
}
