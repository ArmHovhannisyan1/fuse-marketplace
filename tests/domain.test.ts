import { describe, expect, it } from "vitest";
import {
  activationBlockers,
  commitmentBlocker,
  createErrors,
  dealStatus,
  fundedSeats,
  refundAmount,
  transition,
} from "../lib/domain";
import { createSeed, FLAGSHIP_ID, INITIAL_BALANCES } from "../lib/seed";
import { decodeState } from "../lib/storage";
import type { CreateDealInput, DemoState } from "../lib/models";

const flagship = (state: DemoState) =>
  state.deals.find((d) => d.id === FLAGSHIP_ID)!;
const identity = (state: DemoState, identityId: string) =>
  transition(state, { type: "identity", identityId });
function fullyFunded() {
  return transition(createSeed(), {
    type: "commit",
    dealId: FLAGSHIP_ID,
    seats: 2,
  });
}
function ready() {
  return transition(identity(fullyFunded(), "instructor"), {
    type: "approve",
    dealId: FLAGSHIP_ID,
    supplier: "instructor",
  });
}
const createInput: CreateDealInput = {
  title: "Community workshop",
  description: "A small hands-on session.",
  location: "Yerevan",
  seatPrice: 20,
  requiredSeats: 10,
  deadline: createSeed().now + 100000,
  venueName: "Demo venue",
  instructorName: "Demo instructor",
  venueAllocation: 80,
  instructorAllocation: 120,
};

describe("booking conditions and funds", () => {
  it("starts with 8 seats / 160 tokens and instructor approval missing", () => {
    const state = createSeed();
    expect(fundedSeats(state, flagship(state))).toBe(8);
    expect(flagship(state).instructor.approvedAt).toBeNull();
    expect(dealStatus(state, flagship(state))).toBe("Open");
  });
  it("blocks full funding without supplier approval", () => {
    const state = fullyFunded();
    expect(activationBlockers(state, flagship(state))).toEqual([
      "Waiting for instructor approval.",
    ]);
    expect(() =>
      transition(state, { type: "activate", dealId: FLAGSHIP_ID }),
    ).toThrow("instructor");
    expect(dealStatus(state, flagship(state))).toBe("Waiting for approval");
  });
  it("blocks both approvals without full funding", () => {
    const state = transition(identity(createSeed(), "instructor"), {
      type: "approve",
      dealId: FLAGSHIP_ID,
      supplier: "instructor",
    });
    expect(() =>
      transition(state, { type: "activate", dealId: FLAGSHIP_ID }),
    ).toThrow("2 more funded seats");
  });
  it("permits activation when every condition is met before deadline", () => {
    const state = ready();
    expect(activationBlockers(state, flagship(state))).toEqual([]);
    expect(dealStatus(state, flagship(state))).toBe("Ready to activate");
  });
  it("pays exact allocations atomically, only once, with immutable terms", () => {
    const state = ready();
    const before = structuredClone(state);
    const activated = transition(state, {
      type: "activate",
      dealId: FLAGSHIP_ID,
    });
    expect(activated.balances.venue - state.balances.venue).toBe(80);
    expect(activated.balances.instructor - state.balances.instructor).toBe(120);
    expect(
      activated.payouts.filter((p) => p.dealId === FLAGSHIP_ID),
    ).toHaveLength(1);
    expect(state).toEqual(before);
    expect({ ...flagship(activated), activatedAt: null }).toEqual({
      ...flagship(state),
      activatedAt: null,
    });
    expect(() =>
      transition(activated, { type: "activate", dealId: FLAGSHIP_ID }),
    ).toThrow("already activated");
  });
  it("blocks activation exactly at the deadline and enables refunds, even when ready", () => {
    const state = ready();
    state.now = flagship(state).deadline;
    expect(() =>
      transition(state, { type: "activate", dealId: FLAGSHIP_ID }),
    ).toThrow("deadline");
    expect(refundAmount(state, flagship(state), "sam")).toBe(80);
  });
  it("returns only the current identity's own deposit and blocks a second refund", () => {
    const state = transition(createSeed(), {
      type: "expire",
      dealId: FLAGSHIP_ID,
    });
    const refunded = transition(state, { type: "refund", dealId: FLAGSHIP_ID });
    expect(refunded.balances.sam - state.balances.sam).toBe(40);
    expect(refunded.balances.robin).toBe(state.balances.robin);
    expect(refundAmount(refunded, flagship(refunded), "robin")).toBe(120);
    expect(() =>
      transition(refunded, { type: "refund", dealId: FLAGSHIP_ID }),
    ).toThrow("cannot be claimed twice");
    expect(() =>
      transition(identity(refunded, "venue"), {
        type: "refund",
        dealId: FLAGSHIP_ID,
      }),
    ).toThrow("another identity");
  });
  it("derives fully refunded only after every contributor has claimed", () => {
    let state = transition(createSeed(), {
      type: "expire",
      dealId: FLAGSHIP_ID,
    });
    state = transition(state, { type: "refund", dealId: FLAGSHIP_ID });
    expect(dealStatus(state, flagship(state))).toBe(
      "Expired — refunds available",
    );
    state = transition(identity(state, "robin"), {
      type: "refund",
      dealId: FLAGSHIP_ID,
    });
    expect(dealStatus(state, flagship(state))).toBe("Fully refunded");
    expect(() =>
      transition(state, { type: "activate", dealId: FLAGSHIP_ID }),
    ).toThrow();
  });
  it("does not allow early withdrawals", () => {
    expect(() =>
      transition(createSeed(), { type: "refund", dealId: FLAGSHIP_ID }),
    ).toThrow("No early withdrawal");
  });
  it("never refunds activated deals, even after their deadline", () => {
    let state = transition(ready(), { type: "activate", dealId: FLAGSHIP_ID });
    state = transition(identity(state, "sam"), {
      type: "expire",
      dealId: FLAGSHIP_ID,
    });
    expect(refundAmount(state, flagship(state), "sam")).toBe(0);
    expect(() =>
      transition(state, { type: "refund", dealId: FLAGSHIP_ID }),
    ).toThrow("do not offer refunds");
  });
  it.each([0, -1, 1.5, NaN, Infinity, 3, Number.MAX_SAFE_INTEGER])(
    "rejects invalid or excess contribution quantity %s",
    (seats) => {
      expect(() =>
        transition(createSeed(), {
          type: "commit",
          dealId: FLAGSHIP_ID,
          seats,
        }),
      ).toThrow();
    },
  );
  it("rejects contributions above the balance without changing state", () => {
    const state = createSeed();
    state.balances.sam = 19;
    const before = structuredClone(state);
    expect(commitmentBlocker(state, flagship(state), 1)).toContain("balance");
    expect(() =>
      transition(state, { type: "commit", dealId: FLAGSHIP_ID, seats: 1 }),
    ).toThrow("balance");
    expect(state).toEqual(before);
  });
  it("restricts supplier approvals to their designated mock identities", () => {
    expect(() =>
      transition(createSeed(), {
        type: "approve",
        dealId: FLAGSHIP_ID,
        supplier: "instructor",
      }),
    ).toThrow("designated instructor");
    expect(() =>
      transition(identity(createSeed(), "venue"), {
        type: "approve",
        dealId: FLAGSHIP_ID,
        supplier: "instructor",
      }),
    ).toThrow();
  });
  it("rejects repeated and expired approvals and commitments", () => {
    expect(() =>
      transition(identity(createSeed(), "venue"), {
        type: "approve",
        dealId: FLAGSHIP_ID,
        supplier: "venue",
      }),
    ).toThrow("already approved");
    const state = transition(identity(createSeed(), "instructor"), {
      type: "expire",
      dealId: FLAGSHIP_ID,
    });
    expect(() =>
      transition(state, {
        type: "approve",
        dealId: FLAGSHIP_ID,
        supplier: "instructor",
      }),
    ).toThrow("closed");
    expect(() =>
      transition(identity(state, "sam"), {
        type: "commit",
        dealId: FLAGSHIP_ID,
        seats: 1,
      }),
    ).toThrow("expired");
  });
  it("does not restart or reverse the simulated clock", () => {
    const state = transition(createSeed(), {
      type: "expire",
      dealId: "print-club",
    });
    expect(transition(state, { type: "expire", dealId: FLAGSHIP_ID }).now).toBe(
      state.now,
    );
  });
  it("conserves all tokens across activation and refunds", () => {
    let state = transition(ready(), { type: "activate", dealId: FLAGSHIP_ID });
    state = transition(identity(state, "sam"), {
      type: "refund",
      dealId: "weekend-woodworking",
    });
    const locked = state.contributions
      .filter(
        (c) =>
          c.refundedAt === null &&
          state.deals.find((d) => d.id === c.dealId)?.activatedAt === null,
      )
      .reduce((s, c) => s + c.amount, 0);
    expect(
      Object.values(state.balances).reduce((s, b) => s + b, 0) + locked,
    ).toBe(Object.values(INITIAL_BALANCES).reduce((s, b) => s + b, 0));
  });
});
describe("publication and persistence", () => {
  it("validates required fields, integer amounts, deadline, and exact allocations", () => {
    expect(createErrors(createInput, createSeed().now)).toEqual({});
    const errors = createErrors(
      {
        ...createInput,
        title: " ",
        seatPrice: 1.5,
        requiredSeats: 0,
        deadline: createSeed().now,
        instructorAllocation: 121,
      },
      createSeed().now,
    );
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining([
        "title",
        "seatPrice",
        "requiredSeats",
        "deadline",
        "venueAllocation",
      ]),
    );
  });
  it("allows only the organizer to publish fixed terms with pending approvals", () => {
    expect(() =>
      transition(createSeed(), { type: "create", input: createInput }),
    ).toThrow("organizer");
    const state = transition(identity(createSeed(), "organizer"), {
      type: "create",
      input: createInput,
    });
    const d = state.deals.at(-1)!;
    expect(d.venue.approvedAt).toBeNull();
    expect(d.instructor.approvedAt).toBeNull();
    expect(d.deadline).toBe(createInput.deadline);
    expect(decodeState(JSON.stringify(state))).toEqual(state);
  });
  it("round trips seed, success, expiry, and fully refunded states without changing deadlines", () => {
    const expired = transition(createSeed(), {
      type: "expire",
      dealId: FLAGSHIP_ID,
    });
    const refunded = transition(expired, {
      type: "refund",
      dealId: FLAGSHIP_ID,
    });
    for (const state of [
      createSeed(),
      ready(),
      transition(ready(), { type: "activate", dealId: FLAGSHIP_ID }),
      expired,
      refunded,
      transition(identity(refunded, "robin"), {
        type: "refund",
        dealId: FLAGSHIP_ID,
      }),
    ])
      expect(decodeState(JSON.stringify(state))).toEqual(state);
  });
  it.each(["broken json", "null", "{}", '{"version":99}'])(
    "rejects invalid or outdated stored data: %s",
    (raw) => expect(decodeState(raw)).toBeNull(),
  );
  it("rejects contradictory balances, duplicate payouts, and altered terms", () => {
    const balance = createSeed();
    balance.balances.sam += 1;
    expect(decodeState(JSON.stringify(balance))).toBeNull();
    const payouts = createSeed();
    payouts.payouts.push(payouts.payouts[0]);
    expect(decodeState(JSON.stringify(payouts))).toBeNull();
    const terms = createSeed();
    terms.deals[0] = { ...terms.deals[0], seatPrice: 25 };
    expect(decodeState(JSON.stringify(terms))).toBeNull();
  });
  it("rejects impossible timestamps and missing required examples", () => {
    const state = createSeed();
    state.now = Number.MAX_SAFE_INTEGER;
    expect(decodeState(JSON.stringify(state))).toBeNull();
    const missing = createSeed();
    missing.deals = missing.deals.slice(1);
    expect(decodeState(JSON.stringify(missing))).toBeNull();
  });
});
