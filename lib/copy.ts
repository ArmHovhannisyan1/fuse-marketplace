export const BRAND = {
  name: "FUSE",
  tagline: "Commit together. Make it happen.",
  explanation:
    "Bring people, funding, and suppliers into one conditional booking. It moves forward only when every requirement is met.",
  notice: "Marketplace demo — simulated funds. No Solana transactions.",
  solana:
    "An unaudited escrow smart contract is deployed on Solana Devnet with valueless test tokens. The separate /onchain-demo shows genuine historical Devnet transactions and live RPC state. Browser activation is supported; creation, deposits, supplier approvals, and refunds require developer scripts.",
};
export const FAQ = [
  [
    "When does a booking activate?",
    "When every seat is funded, both the designated venue and instructor have approved, and the activation deadline has not passed. Someone must then explicitly activate the booking; it never activates on funding alone.",
  ],
  [
    "When are deposits locked?",
    "As soon as you confirm a commitment, the demo deducts its amount from your simulated balance. You cannot cancel or withdraw early. On activation it pays suppliers; if the booking expires without activation, you can claim your own deposit back.",
  ],
  [
    "When can someone claim a refund?",
    "At or after the activation deadline, if the booking has not activated. Each contributor claims only their own deposit, once. Refunds are individual actions, rather than automatic payments.",
  ],
  [
    "What if the target is funded but a supplier has not approved?",
    "The booking stays blocked. Enough funding alone is not sufficient: both required suppliers must approve before activation. If the deadline passes first, contributors can claim refunds.",
  ],
  [
    "Does FUSE guarantee the event will happen afterward?",
    "No. FUSE coordinates booking formation and payment conditions. This version does not guarantee a physical workshop happens after suppliers are paid, and it does not resolve later disputes.",
  ],
  [
    "Do I need a wallet for the marketplace demo?",
    "No wallet is needed for the marketplace simulation. Use Demo controls to explore mock roles; this is not real authentication. Its demo tokens are saved locally in your browser. The separate /onchain-demo can show real Devnet evidence without a wallet; signing a real activation requires a compatible wallet.",
  ],
];
