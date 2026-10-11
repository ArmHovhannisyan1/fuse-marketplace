# FUSE pitch outline

This is preparation for the presentation video and deck. Business hypotheses
below are **unverified**; no customers, partnerships, traction or revenue are claimed.

## Elevator pitch

FUSE coordinates multi-party bookings that activate only when the required
funding and supplier approvals are secured.

## Customer problem

A small workshop organizer needs enough paid attendees, an available venue and
an instructor who accepts the terms. Attendees want to know the workshop can
proceed. Suppliers want enough committed demand. The organizer must align all
three before a deadline.

## Why existing tools may be insufficient

**Hypothesis:** chat, forms, calendars and separate payment links can collect
interest and payments, but organizers still manually check whether everyone has
committed to the same terms. Interview organizers to test whether that work is
painful enough to justify a new tool. Do not claim no competing solutions exist.

## Workshop example

Ten attendees commit twenty tokens each. The venue receives eighty and the
instructor receives one hundred twenty. Even two hundred tokens cannot activate
the booking without both supplier approvals. If the deadline passes before
activation, attendees can individually claim their deposits back. These are
prototype test amounts, not actual ticket prices or customer bookings.

## How FUSE solves it

The booking has fixed funding, supplier allocations and a deadline. Contributors
deposit tokens; designated suppliers sign approvals. Anyone can trigger activation
once all conditions hold. The program releases the agreed payouts together, or
allows contributor refunds after an unactivated campaign expires.

## Why blockchain fits this design

For this prototype, Solana holds the escrow and enforces the shared conditions
without giving the organizer a unilateral withdrawal button. Signatures bind
approvals to designated suppliers; atomic execution prevents a partial payout.
Public transactions make enforcement inspectable. A trusted centralized escrow
could implement similar rules; our hypothesis is that some organizers and
participants value independently verifiable rules across parties. Validate that
benefit against wallet friction, fees and operational complexity.

## What we built on Solana

A real Devnet Anchor program supports campaign creation, token deposits,
designated supplier approvals, exact payouts and expiry refunds. Confirmed public
transactions show success and expected failures. A separate browser page reads
live state and supports wallet-signed activation. The seven-page marketplace is
an interactive simulation; other on-chain actions are CLI-only. Installed wallet
compatibility still requires manual testing. The program is upgradeable and unaudited.

## First customer and go-to-market hypotheses

- **First customer hypothesis:** independent organizers of recurring small paid
  workshops who coordinate a separate instructor and venue.
- **Initial go-to-market hypothesis:** speak directly with local workshop
  organizers, learn how they collect commitments, then recruit a small opt-in
  pilot after usability and security review. Begin with test-network rehearsal;
  do not accept real deposits with this prototype.
- **Evidence to seek:** repeated coordination problems, willingness to use wallets,
  willingness to pay, and whether shared escrow makes a booking easier to form.
  These interviews and pilots have not been claimed as completed.

## Potential revenue model

**Hypothesis:** charge organizers a disclosed fee per activated booking, or offer
a subscription for organizers managing repeated events. No fee level, validated
willingness to pay or revenue is established. The current program has no platform
fee instruction.

## Future product vision

Complete participant wallet flows, improve onboarding, support more booking
templates and add organizer tools. Before handling valuable assets, obtain
independent security review and define upgrade governance, token policy and
service-dispute responsibilities. Payments currently resolve formation, not
physical delivery or later disputes.

## Team and closing

"We are two siblings building FUSE for the Colosseum Crypto World's Fair
hackathon. We built a working coordination prototype and real Solana Devnet
escrow evidence. Next, we want to test whether small workshop organizers need
this workflow and make it easier to use."

Keep names, experience and individual roles out until the team supplies them.
Show the [technical evidence](devnet-proof.json) and
[three-minute technical script](final-technical-video.md), then state the next
validation step. Do not imply an audit, live customers or production readiness.
