export const BRAND = {
  name: "FUSE",
  tagline: "Commit together. Make it happen.",
  explanation:
    "Bring people, funding, and suppliers into one conditional booking. It moves forward only when every requirement is met.",
  notice: "Interactive prototype — simulated funds. No real transactions.",
  solana:
    "The planned Solana integration will enforce deposits, supplier approvals, activation, and refunds through a smart contract.",
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
    "Do I need a wallet for this demo?",
    "No wallet, account, or extension is needed. Use the demo controls to explore mock participant roles. Those controls are a demonstration, not real authentication. All amounts are demo tokens stored locally in your browser.",
  ],
];
