export type IdentityRole = "organizer" | "venue" | "instructor" | "attendee";
export interface Identity {
  id: string;
  name: string;
  role: IdentityRole;
}
export interface Supplier {
  readonly identityId: string;
  readonly name: string;
  readonly allocation: number;
  readonly approvedAt: number | null;
}
export type WorkshopArt = "clay" | "print" | "coffee" | "botanical" | "wood";
export interface Deal {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly category: string;
  readonly art: WorkshopArt;
  readonly seatPrice: number;
  readonly requiredSeats: number;
  readonly deadline: number;
  readonly publishedAt: number;
  readonly organizerId: string;
  readonly venue: Supplier;
  readonly instructor: Supplier;
  readonly activatedAt: number | null;
}
export interface Contribution {
  id: string;
  dealId: string;
  identityId: string;
  seats: number;
  amount: number;
  createdAt: number;
  refundedAt: number | null;
}
export interface Activity {
  id: string;
  dealId: string;
  identityId: string;
  at: number;
  kind: "published" | "commitment" | "approval" | "activation" | "refund";
  message: string;
}
export interface Payout {
  dealId: string;
  at: number;
  venue: number;
  instructor: number;
}
export interface DemoState {
  version: 1;
  now: number;
  sequence: number;
  identityId: string;
  deals: Deal[];
  contributions: Contribution[];
  activity: Activity[];
  payouts: Payout[];
  balances: Record<string, number>;
}
export type DealStatus =
  | "Open"
  | "Waiting for approval"
  | "Ready to activate"
  | "Activated"
  | "Expired — refunds available"
  | "Fully refunded";
export interface CreateDealInput {
  title: string;
  description: string;
  location: string;
  seatPrice: number;
  requiredSeats: number;
  deadline: number;
  venueName: string;
  instructorName: string;
  venueAllocation: number;
  instructorAllocation: number;
}
export type DemoCommand =
  | { type: "identity"; identityId: string }
  | { type: "commit"; dealId: string; seats: number }
  | { type: "approve"; dealId: string; supplier: "venue" | "instructor" }
  | { type: "activate"; dealId: string }
  | { type: "refund"; dealId: string }
  | { type: "expire"; dealId: string }
  | { type: "create"; input: CreateDealInput };
