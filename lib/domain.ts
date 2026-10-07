import type {
  CreateDealInput,
  Deal,
  DealStatus,
  DemoCommand,
  DemoState,
} from "./models";
import { IDENTITIES } from "./seed";

export class RuleError extends Error {}
const positive = (value: number) => Number.isSafeInteger(value) && value > 0;
export const target = (deal: Deal) => deal.seatPrice * deal.requiredSeats;
export function contributionsFor(
  state: DemoState,
  dealId: string,
  identityId?: string,
) {
  return state.contributions.filter(
    (c) => c.dealId === dealId && (!identityId || c.identityId === identityId),
  );
}
export function fundedSeats(state: DemoState, deal: Deal) {
  return contributionsFor(state, deal.id)
    .filter((c) => c.refundedAt === null)
    .reduce((sum, c) => sum + c.seats, 0);
}
export function activationBlockers(state: DemoState, deal: Deal): string[] {
  if (deal.activatedAt !== null) return ["This booking has already activated."];
  if (state.now >= deal.deadline)
    return [
      "The activation deadline has passed. This booking cannot activate.",
    ];
  const reasons = [];
  if (contributionsFor(state, deal.id).some((c) => c.refundedAt !== null))
    reasons.push("A refunded booking cannot activate.");
  const remaining = deal.requiredSeats - fundedSeats(state, deal);
  if (remaining > 0)
    reasons.push(
      `Waiting for ${remaining} more funded ${remaining === 1 ? "seat" : "seats"}.`,
    );
  if (deal.venue.approvedAt === null)
    reasons.push("Waiting for venue approval.");
  if (deal.instructor.approvedAt === null)
    reasons.push("Waiting for instructor approval.");
  return reasons;
}
export function dealStatus(state: DemoState, deal: Deal): DealStatus {
  if (deal.activatedAt !== null) return "Activated";
  if (state.now >= deal.deadline) {
    const deposits = contributionsFor(state, deal.id);
    return deposits.length > 0 && deposits.every((c) => c.refundedAt !== null)
      ? "Fully refunded"
      : "Expired — refunds available";
  }
  if (activationBlockers(state, deal).length === 0) return "Ready to activate";
  return fundedSeats(state, deal) === deal.requiredSeats
    ? "Waiting for approval"
    : "Open";
}
export function refundAmount(
  state: DemoState,
  deal: Deal,
  identityId: string,
): number {
  if (deal.activatedAt !== null || state.now < deal.deadline) return 0;
  return contributionsFor(state, deal.id, identityId)
    .filter((c) => c.refundedAt === null)
    .reduce((sum, c) => sum + c.amount, 0);
}
export function commitmentBlocker(
  state: DemoState,
  deal: Deal,
  seats: number,
): string | null {
  if (IDENTITIES.find((i) => i.id === state.identityId)?.role !== "attendee")
    return "Select a demo attendee to commit seats.";
  if (deal.activatedAt !== null) return "This booking has already activated.";
  if (state.now >= deal.deadline)
    return "This booking has expired. New commitments are closed.";
  if (!positive(seats)) return "Choose a positive whole number of seats.";
  if (seats > deal.requiredSeats - fundedSeats(state, deal))
    return "That quantity exceeds the remaining seats.";
  if (
    !Number.isSafeInteger(seats * deal.seatPrice) ||
    seats * deal.seatPrice > state.balances[state.identityId]
  )
    return "Your demo balance is too low for this commitment.";
  return null;
}
export function createErrors(
  input: CreateDealInput,
  now: number,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of [
    "title",
    "description",
    "location",
    "venueName",
    "instructorName",
  ] as const) {
    if (!input[field].trim()) errors[field] = "This field is required.";
    else if (input[field].length > (field === "description" ? 1200 : 120))
      errors[field] = "Please use a shorter value.";
  }
  for (const field of [
    "seatPrice",
    "requiredSeats",
    "venueAllocation",
    "instructorAllocation",
  ] as const) {
    if (!positive(input[field]))
      errors[field] = "Enter a positive whole number.";
  }
  const total = input.seatPrice * input.requiredSeats;
  if (!positive(total))
    errors.seatPrice =
      "The funding target must be a safe positive whole number.";
  if (
    !Number.isSafeInteger(input.deadline) ||
    !Number.isFinite(new Date(input.deadline).getTime()) ||
    input.deadline <= now
  )
    errors.deadline = "Choose a deadline after the simulated clock.";
  if (input.venueAllocation + input.instructorAllocation !== total)
    errors.venueAllocation =
      "Both allocations must add up exactly to the funding target.";
  return errors;
}

// Every action is validated here. UI controls never grant permission or skip rules.
// Published terms have no update command. Transitions never mutate their input.
export function transition(state: DemoState, command: DemoCommand): DemoState {
  const next: DemoState = structuredClone(state);
  const identity = IDENTITIES.find((i) => i.id === state.identityId);
  if (!identity) throw new RuleError("Unknown demo identity.");
  const activity = (
    dealId: string,
    kind: DemoState["activity"][number]["kind"],
    message: string,
  ) => {
    next.activity.push({
      id: `activity-${++next.sequence}`,
      dealId,
      identityId: identity.id,
      at: next.now,
      kind,
      message,
    });
  };
  if (command.type === "identity") {
    if (!IDENTITIES.some((i) => i.id === command.identityId))
      throw new RuleError("Unknown demo identity.");
    next.identityId = command.identityId;
    return next;
  }
  if (command.type === "create") {
    if (identity.role !== "organizer")
      throw new RuleError("Select the demo organizer to publish a booking.");
    const errors = createErrors(command.input, state.now);
    if (Object.keys(errors).length)
      throw new RuleError(Object.values(errors)[0]);
    const input = command.input;
    const id = `workshop-${++next.sequence}`;
    next.deals.push({
      id,
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location.trim(),
      category: "COMMUNITY WORKSHOP",
      art: "clay",
      seatPrice: input.seatPrice,
      requiredSeats: input.requiredSeats,
      deadline: input.deadline,
      publishedAt: state.now,
      organizerId: identity.id,
      activatedAt: null,
      venue: {
        identityId: "venue",
        name: input.venueName.trim(),
        allocation: input.venueAllocation,
        approvedAt: null,
      },
      instructor: {
        identityId: "instructor",
        name: input.instructorName.trim(),
        allocation: input.instructorAllocation,
        approvedAt: null,
      },
    });
    activity(id, "published", "Organizer published the fixed booking terms.");
    return next;
  }
  const index = next.deals.findIndex((d) => d.id === command.dealId);
  if (index < 0) throw new RuleError("This demo booking does not exist.");
  const deal = next.deals[index];
  switch (command.type) {
    case "commit": {
      const reason = commitmentBlocker(state, deal, command.seats);
      if (reason) throw new RuleError(reason);
      const amount = command.seats * deal.seatPrice;
      next.balances[identity.id] -= amount;
      next.contributions.push({
        id: `deposit-${++next.sequence}`,
        dealId: deal.id,
        identityId: identity.id,
        seats: command.seats,
        amount,
        createdAt: state.now,
        refundedAt: null,
      });
      activity(
        deal.id,
        "commitment",
        `${identity.name} committed ${command.seats} ${command.seats === 1 ? "seat" : "seats"} · ${amount} demo tokens.`,
      );
      break;
    }
    case "approve": {
      const supplier = deal[command.supplier];
      if (identity.id !== supplier.identityId)
        throw new RuleError(
          `Only the designated ${command.supplier} can approve these terms.`,
        );
      if (deal.activatedAt !== null || state.now >= deal.deadline)
        throw new RuleError("Approvals are closed for this booking.");
      if (supplier.approvedAt !== null)
        throw new RuleError("This supplier has already approved.");
      next.deals[index] = {
        ...deal,
        [command.supplier]: { ...supplier, approvedAt: state.now },
      };
      activity(
        deal.id,
        "approval",
        `${command.supplier === "venue" ? "Venue" : "Instructor"} approved participation and the ${supplier.allocation} demo token allocation.`,
      );
      break;
    }
    case "activate": {
      const blockers = activationBlockers(state, deal);
      if (blockers.length) throw new RuleError(blockers.join(" "));
      next.deals[index] = { ...deal, activatedAt: state.now };
      next.balances[deal.venue.identityId] += deal.venue.allocation;
      next.balances[deal.instructor.identityId] += deal.instructor.allocation;
      next.payouts.push({
        dealId: deal.id,
        at: state.now,
        venue: deal.venue.allocation,
        instructor: deal.instructor.allocation,
      });
      activity(
        deal.id,
        "activation",
        `Booking activated. Simulated payouts: venue ${deal.venue.allocation} · instructor ${deal.instructor.allocation} demo tokens.`,
      );
      break;
    }
    case "refund": {
      const amount = refundAmount(state, deal, identity.id);
      if (!amount)
        throw new RuleError(
          deal.activatedAt !== null
            ? "Activated bookings do not offer refunds in this prototype."
            : state.now < deal.deadline
              ? "Deposits are locked until activation or expiry. No early withdrawal."
              : "You have no unclaimed deposit. A refund cannot be claimed twice or for another identity.",
        );
      next.contributions = next.contributions.map((c) =>
        c.dealId === deal.id &&
        c.identityId === identity.id &&
        c.refundedAt === null
          ? { ...c, refundedAt: state.now }
          : c,
      );
      next.balances[identity.id] += amount;
      activity(
        deal.id,
        "refund",
        `${identity.name} claimed their own ${amount} demo token refund.`,
      );
      break;
    }
    case "expire": {
      next.now = Math.max(state.now, deal.deadline + 1000);
      break;
    }
  }
  return next;
}
