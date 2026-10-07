<h1 align="center">FUSE Marketplace</h1>

<p align="center">
  <strong>Commit together. Make it happen.</strong>
</p>

<p align="center">
  Conditional group bookings, designed for Solana.
</p>

---

> **Project status:** Early development.
> The application and on-chain integration are not implemented yet.
> Our first milestone is a responsive website and an interactive demo
> using clearly labeled simulated funds.

## What is FUSE?

FUSE is a marketplace for deals that move forward only when all
required commitments are in place.

Our first use case is a small paid workshop: attendees commit to
seats, while the venue and instructor approve their participation
and payment terms.

The booking can activate only when the funding target is reached,
both suppliers have approved, and the deadline has not passed.

**Enough money alone is not enough. The required people must
commit too.**

## The problem

Organizing a workshop creates a coordination problem:

- Attendees want confidence that the venue and instructor are secured.
- Suppliers want confidence that enough people will pay.
- Organizers must coordinate these commitments across separate tools.

FUSE brings the conditions and commitments into one shared workflow.

## Planned workflow

1. **Create a booking:** Define the suppliers, seat price, funding
   target, payout allocations, and deadline.
2. **Collect commitments:** Suppliers approve the terms, and attendees
   fund their seats.
3. **Activate together:** Release the agreed supplier payouts only
   when every required condition is satisfied before the deadline.
4. **Refund on expiry:** Contributors can claim their deposits back
   if the booking never activates before the deadline.

## Example

A workshop requires 10 seats at 20 demo tokens each.

| Requirement | Target |
| --- | --- |
| Funded seats | 10 |
| Total funding | 200 demo tokens |
| Venue approval and allocation | Approved; 80 demo tokens |
| Instructor approval and allocation | Approved; 120 demo tokens |

If all requirements are satisfied before the deadline, the booking
can activate. Otherwise, deposits become refundable after expiry.

## Build roadmap

- [ ] Responsive landing page and product information pages.
- [ ] Marketplace and interactive booking demo.
- [ ] Tests for approvals, activation, expiry, and refunds.
- [ ] Solana Devnet integration for the core booking flow.
- [ ] Demonstration video and hackathon submission materials.

## Scope and safety

The initial frontend demo will use simulated balances, not real funds.

The planned Solana integration will enforce booking conditions,
deposits, payouts, and refunds through a smart contract.

FUSE's first version addresses booking formation. It does not
guarantee that a physical workshop takes place after supplier
payouts, and it does not handle later service disputes.

This project is not audited or ready for production use.

## Development

Application setup and run instructions will be added with the first
runnable implementation. Completed features and simulations will
be documented separately.

## Team

Built by two siblings preparing FUSE for a Colosseum hackathon
submission.
