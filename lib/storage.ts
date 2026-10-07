import type { DemoState } from "./models";
import { DEMO_START, IDENTITIES, INITIAL_BALANCES } from "./seed";
import { target } from "./domain";

export const STORAGE_KEY = "fuse-demo-v1";
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const int = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const string = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;
const timestamp = (v: unknown): v is number =>
  int(v) && Number.isFinite(new Date(v).getTime());
const optionalTime = (v: unknown) => v === null || timestamp(v);
const identity = (v: unknown): v is string =>
  typeof v === "string" && IDENTITIES.some((i) => i.id === v);

// Local persistence is convenience, never production security. Reject corrupt
// structure AND contradictory accounting instead of blindly trusting JSON.
export function decodeState(raw: string): DemoState | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !record(value) ||
      value.version !== 1 ||
      !timestamp(value.now) ||
      value.now < DEMO_START ||
      !int(value.sequence) ||
      !identity(value.identityId) ||
      !record(value.balances)
    )
      return null;
    if (
      ![value.deals, value.contributions, value.activity, value.payouts].every(
        Array.isArray,
      )
    )
      return null;
    const deals = value.deals as unknown[];
    const contributions = value.contributions as unknown[];
    const activity = value.activity as unknown[];
    const payouts = value.payouts as unknown[];
    if (
      !deals.length ||
      deals.length > 500 ||
      contributions.length > 10000 ||
      activity.length > 20000
    )
      return null;
    for (const d of deals) {
      if (
        !record(d) ||
        ![d.id, d.title, d.description, d.location, d.category].every(string) ||
        !["clay", "print", "coffee", "botanical", "wood"].includes(
          String(d.art),
        ) ||
        !int(d.seatPrice) ||
        !d.seatPrice ||
        !int(d.requiredSeats) ||
        !d.requiredSeats ||
        !timestamp(d.deadline) ||
        !timestamp(d.publishedAt) ||
        d.deadline <= d.publishedAt ||
        d.publishedAt > value.now ||
        d.organizerId !== "organizer" ||
        !optionalTime(d.activatedAt)
      )
        return null;
      for (const role of ["venue", "instructor"]) {
        const supplier = d[role];
        if (
          !record(supplier) ||
          supplier.identityId !== role ||
          !string(supplier.name) ||
          !int(supplier.allocation) ||
          !supplier.allocation ||
          !optionalTime(supplier.approvedAt)
        )
          return null;
        if (
          typeof supplier.approvedAt === "number" &&
          (supplier.approvedAt < d.publishedAt ||
            supplier.approvedAt >= d.deadline ||
            supplier.approvedAt > value.now)
        )
          return null;
      }
    }
    for (const c of contributions) {
      if (
        !record(c) ||
        !string(c.id) ||
        !string(c.dealId) ||
        !["sam", "robin"].includes(String(c.identityId)) ||
        !int(c.seats) ||
        !c.seats ||
        !int(c.amount) ||
        !c.amount ||
        !timestamp(c.createdAt) ||
        !optionalTime(c.refundedAt)
      )
        return null;
    }
    for (const e of activity) {
      if (
        !record(e) ||
        !string(e.id) ||
        !string(e.dealId) ||
        !identity(e.identityId) ||
        !timestamp(e.at) ||
        e.at > value.now ||
        !string(e.message) ||
        ![
          "published",
          "commitment",
          "approval",
          "activation",
          "refund",
        ].includes(String(e.kind))
      )
        return null;
    }
    for (const p of payouts) {
      if (
        !record(p) ||
        !string(p.dealId) ||
        !timestamp(p.at) ||
        !int(p.venue) ||
        !int(p.instructor)
      )
        return null;
    }
    // Shape is verified above; check cross-record and balance invariants below.
    const state = value as unknown as DemoState;
    const dealIds = new Set(state.deals.map((d) => d.id));
    if (
      ![
        "clay-and-company",
        "print-club",
        "coffee-lab",
        "botanical-studio",
        "weekend-woodworking",
      ].every((id) => dealIds.has(id))
    )
      return null;
    if (
      dealIds.size !== state.deals.length ||
      new Set(state.contributions.map((c) => c.id)).size !==
        state.contributions.length ||
      new Set(state.activity.map((e) => e.id)).size !== state.activity.length
    )
      return null;
    const expectedBalances = { ...INITIAL_BALANCES };
    for (const c of state.contributions) {
      const d = state.deals.find((d) => d.id === c.dealId);
      if (
        !d ||
        c.amount !== c.seats * d.seatPrice ||
        c.createdAt < d.publishedAt ||
        c.createdAt >= d.deadline ||
        c.createdAt > state.now
      )
        return null;
      if (
        c.refundedAt !== null &&
        (d.activatedAt !== null ||
          c.refundedAt < d.deadline ||
          c.refundedAt > state.now)
      )
        return null;
      expectedBalances[c.identityId] -= c.amount;
      if (c.refundedAt !== null) expectedBalances[c.identityId] += c.amount;
    }
    if (state.activity.some((e) => !dealIds.has(e.dealId))) return null;
    for (const d of state.deals) {
      if (
        !Number.isSafeInteger(target(d)) ||
        d.venue.allocation + d.instructor.allocation !== target(d)
      )
        return null;
      const deposits = state.contributions.filter((c) => c.dealId === d.id);
      const seats = deposits.reduce((sum, c) => sum + c.seats, 0);
      if (seats > d.requiredSeats) return null;
      const paid = state.payouts.filter((p) => p.dealId === d.id);
      if (d.activatedAt === null ? paid.length !== 0 : paid.length !== 1)
        return null;
      if (d.activatedAt !== null) {
        const activatedAt = d.activatedAt;
        if (
          activatedAt >= d.deadline ||
          activatedAt > state.now ||
          d.venue.approvedAt === null ||
          d.instructor.approvedAt === null ||
          d.venue.approvedAt > activatedAt ||
          d.instructor.approvedAt > activatedAt ||
          deposits.some(
            (c) => c.refundedAt !== null || c.createdAt > activatedAt,
          ) ||
          seats !== d.requiredSeats
        )
          return null;
        const p = paid[0];
        if (
          p.at !== d.activatedAt ||
          p.venue !== d.venue.allocation ||
          p.instructor !== d.instructor.allocation
        )
          return null;
        expectedBalances[d.venue.identityId] += p.venue;
        expectedBalances[d.instructor.identityId] += p.instructor;
      }
    }
    if (state.payouts.some((p) => !dealIds.has(p.dealId))) return null;
    for (const i of IDENTITIES)
      if (
        !int(state.balances[i.id]) ||
        state.balances[i.id] !== expectedBalances[i.id]
      )
        return null;
    return state;
  } catch {
    return null;
  }
}
