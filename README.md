<h1 align="center">FUSE Marketplace</h1>

<p align="center">
  <strong>Commit together. Make it happen.</strong>
</p>

<p align="center">
  Conditional group bookings, designed for Solana.
</p>

---

> **Project status:** Website and interactive frontend demo implemented.
> **Interactive prototype — simulated funds. No real transactions.**
> Solana integration is planned. No smart contract is deployed.

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

## Working prototype workflow

1. **Create a booking:** Define the suppliers, seat price, funding
   target, payout allocations, and deadline.
2. **Collect commitments:** Suppliers approve the terms, and attendees
   fund their seats.
3. **Activate together:** Simulate the agreed supplier payouts only
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

- [x] Responsive landing page and product information pages.
- [x] Marketplace and interactive booking demo.
- [x] Domain rules, persistence, and tests for approvals, activation, expiry, and refunds.
- [x] Validated creation form and current identity's commitments.
- [ ] Solana Devnet integration for the core booking flow.
- [ ] Demonstration video and hackathon submission materials.

## Scope and safety

The frontend demo uses simulated balances, not real funds. Amounts are integer
**demo tokens**, with no financial value. They are not USDC or on-chain assets.

The planned Solana integration will enforce booking conditions,
deposits, payouts, and refunds through a smart contract.

FUSE's first version addresses booking formation. It does not
guarantee that a physical workshop takes place after supplier
payouts, and it does not handle later service disputes.

This project is not audited or ready for production use.

## Development

Run these commands **in this repository root**. No nested project directory,
environment file, API key, wallet extension, or paid service is needed.

Use Node.js 22 or later and npm. Clean installation and execution were verified
on Windows with Node.js **24.21.0** and npm **11.19.0**. Exact dependency versions
are recorded in `package.json` and `package-lock.json`.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Stop the development server
with Ctrl+C before starting a production server on the same port.

To build and serve the production version locally:

```sh
npm run build
npm run start -- --hostname 127.0.0.1
```

Both development and production serving have been exercised. The application
uses Next.js App Router, React, TypeScript, Tailwind CSS, and Lucide icons.
Workshop illustrations are CSS and fonts use the system stack; there are no
remote image or font dependencies.

## Available routes

| Route | Working functionality |
| --- | --- |
| `/` | Product explanation, shared workshop preview, featured demo listings, FAQ |
| `/how-it-works` | Workshop terms, participant responsibilities, activation and refunds |
| `/about` | Mission, honest team introduction, scope and limitations |
| `/marketplace` | Five seeded scenarios, title search, status filters, empty state |
| `/marketplace/[id]` | Contributions, approvals, activation, personal refunds, simulated activity, demo controls |
| `/create` | Validated form, review before publication, fixed published terms |
| `/my-commitments` | Current mock identity's seats, deposits, booking and refund status |

The five seeded bookings are:

| ID | Starting scenario |
| --- | --- |
| `clay-and-company` | Flagship: 8/10 funded, venue approved, instructor awaiting approval |
| `print-club` | Fully funded, awaiting venue approval |
| `coffee-lab` | Fully funded and approved, ready for explicit activation |
| `botanical-studio` | Already activated, with a seeded simulated payout |
| `weekend-woodworking` | Expired, individual deposits available to refund |

All listing names, venues, workshops, activity, and balances are fictional demo
examples, not actual available events. Sam and Robin are mock attendees,
not team members or customer claims.

## Demonstrate the two core flows

### Success

1. Open `/marketplace/clay-and-company`.
2. In **Demo controls**, reset the entire demo and confirm. The default identity
   is **Sam · attendee**. The booking has 8/10 seats and 160/200 demo tokens.
3. Set **Seats to commit** to **2**. Select **Review commitment**, then confirm
   **40 demo tokens** after reviewing the deadline and locked-deposit terms.
4. The booking is fully funded. **Activate booking** remains disabled with
   **Waiting for instructor approval**.
5. Switch **Act as** to **Designated instructor · instructor**. Select
   **Approve as instructor**.
6. Select **Activate booking**, review the payouts, and **Confirm activation**.
   Any demo participant can trigger an eligible activation.
7. Status becomes **Activated**. The receipt displays the simulated **80** venue
   and **120** instructor payouts. Activation and refunds are now blocked.
8. Refresh: approvals, contributions, status, balances, and receipt persist.

Sam already has two seeded seats; after this flow, Sam has four seats and an
80 demo token contribution. The new commitment costs only 40 demo tokens.

### Expiry and refunds

1. Open `/marketplace/clay-and-company` and reset the entire demo.
2. Keep **Sam · attendee** selected. Sam has a seeded **40 demo token** deposit.
3. Select **Advance past deadline**, then **Advance clock** in the confirmation.
4. The booking expires; activation is blocked. Select **Claim 40 demo token refund**.
5. Only Sam's deposit returns to Sam's demo balance. Robin's deposit remains
   claimable by Robin. **Refund already claimed** is disabled and explains why
   a second claim is blocked.
6. Refresh to verify the refund and advanced clock persist. Switch to Robin to
   claim their deposit; once every contributor claims, status becomes **Fully refunded**.

The initially expired `weekend-woodworking` listing is another refund example.
An identity cannot claim another identity's deposit. Activated bookings do not
offer refunds in this prototype.

### Reset and simulated time

**Reset entire demo** is available on deal details, Create, and My Commitments.
Confirming restores the five seeds, balances, approvals, contributions, activity,
and original clock. It also removes locally published bookings.

The clock starts at **7 October 2026, 12:00 UTC** (16:00 in Yerevan) and is frozen.
Only the advance control moves time, and it cannot move backward. There is no
automatic wall-clock progression or deadline restart on render. Published deadlines
are absolute timestamps and survive refreshes. The interface and deadline form use UTC.

Advancing moves the shared clock one second beyond the selected deadline. Other
unactivated bookings with earlier deadlines also expire. An unactivated deal is
refundable **at or after** its deadline, even if fully funded and approved.

## What is implemented

- Responsive shared navigation, mobile menu, footer, and all seven routes.
- Shared source of truth for deals, suppliers, deposits, balances, payouts,
  activity, selected mock identity, and simulated time.
- Pure typed domain rules, integer amounts, designated supplier checks, and
  contribution checks for positive whole seats, available capacity, and balance.
- Immediate deposit locking, no early withdrawal, explicit activation strictly
  before the deadline, exact atomic simulated payouts, and individual one-time refunds.
- Derived statuses: Open, Waiting for approval, Ready to activate, Activated,
  Expired — refunds available, and Fully refunded.
- Confirmation dialogs before commitments, activation, reset, clock advancement,
  and publication; disabled actions explain their blockers.
- Versioned localStorage with structure and accounting validation, graceful invalid
  data recovery, and a session-only fallback when browser storage is unavailable.
- Search, filters, validated creation with review, fixed published terms, and
  current identity's commitment and refund views.
- Semantic headings, labeled inputs, visible focus, native dialog focus trapping,
  Escape dismissal and focus restoration, status messages, and reduced-motion support.

## What is simulated

- Identity selection demonstrates roles; it is not real login or access security.
  Custom bookings use the same designated mock venue and instructor identities.
  Supplier names are display labels, not verified wallets.
- Deposits, approvals, balance changes, and payouts are local updates. They do not
  secure actual funds or confirm any blockchain transaction.
- Activity is seeded or generated locally and labeled simulated. There are no
  fake hashes, explorer links, deployed-contract claims, or invented audits.
- Time is deliberately frozen and simulated, independent of your computer's clock.

## Code structure

| Location | Responsibility |
| --- | --- |
| `app/` | App Router routes, layout, metadata, icon, and design styles |
| `components/` | Reusable UI, page views, navigation, demo controls, and booking panels |
| `lib/models.ts` | Typed identities, suppliers, deals, contributions, activity, payouts, commands |
| `lib/domain.ts` | Pure checks, validation, derived statuses, state transitions |
| `lib/seed.ts` | Stable examples, initial balances, and reproducible clock |
| `lib/demo-store.ts` | Mock adapter, shared React subscription, hydration-safe initialization |
| `lib/storage.ts` | Storage version, runtime validation, cross-record accounting invariants |
| `lib/copy.ts` | Shared branding, positioning, notice, FAQ |
| `tests/domain.test.ts` | Domain, accounting, publication, and persistence tests |
| `tests/browser/demo.spec.ts` | Core flows, storage, forms, keyboard, responsive routes |

The UI invokes commands through the mock adapter. There are no pretend blockchain
methods. During Solana integration, evolve the adapter to handle asynchronous wallet
authorization, submitted/pending/confirmed states, and contract-backed snapshots.
Shared models and presentation components provide the starting point; the program
must independently enforce every rule.

Next.js generated `AGENTS.md` during the development run. It points future
contributors to documentation bundled with the installed Next.js version.

## Verification

These commands were executed successfully:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
npm audit --omit=dev --json
```

- **TypeScript:** strict type checking passed.
- **ESLint:** passed without warnings.
- **Unit tests:** 31 passed, including funding/approval independence, one-time exact
  payouts, the deadline boundary, refund ownership and duplicates, invalid/excess
  contributions, conservation of tokens, publication, and invalid persistence.
- **Browser tests:** 8 passed using installed Chrome. Exercise both requested flows,
  creation and refresh, invalid/unavailable storage, dialogs, mobile navigation,
  search and empty states.
- **Responsive inspection:** all seven routes at **375px, 768px, and 1440px**;
  no horizontal overflow. Screenshots are saved under ignored `test-results/`.
- **Build and serving:** optimized production build passed; direct routes and refreshes,
  including locally published bookings, were exercised.
- **Runtime dependency audit:** zero reported vulnerabilities.

Playwright starts a local production server when none is running, so build first.
On this Windows setup it uses installed Google Chrome. On other machines it uses
Playwright's browser distribution, or an installed Chromium executable provided
through `FUSE_BROWSER_PATH`. Browser installation on other systems was not verified.

Windows sandbox restrictions initially blocked child processes with `EPERM`.
Builds, tests, and browser/server execution were rerun with the required permission
and passed. This was an execution-environment restriction.

## Known limitations

- Frontend prototype, not a production financial application.
- Data belongs to one browser and origin. Clearing storage or resetting removes
  custom bookings; custom links do not transfer data to another browser.
- localStorage, mock identities, and client validation are not production security.
  Tabs receive storage updates, but simultaneous writes are not transactional.
- No database, real wallet, authentication provider, escrow program, or event
  fulfillment exists. Refunds are claimed individually, not automatically.
- FUSE does not guarantee physical workshop delivery after supplier payouts
  or resolve later service disputes.
- Chrome was tested; Firefox and Safari have not been verified.
- The full dependency audit reports **five high-severity findings** in the dev-only
  Next ESLint chain (`braces`, `micromatch`, and `fast-glob`). At verification, the
  registry had no compatible published `braces` patch. Track this tooling advisory;
  the runtime audit is clean.

## Next steps toward Solana escrow

1. **Specify and implement the minimal escrow program.** Make terms immutable,
   bind approvals to real supplier signing authorities, track individual deposits
   and the seat cap, use chain time, and enforce exact atomic payouts and one-time refunds.
2. **Replace the mock adapter with a Devnet adapter.** Add wallet authorization,
   program account reads, transaction submission and confirmation, pending/error
   states, and refresh recovery. Display transaction references only for actual transactions.
3. **Prove the escrow behavior before any real funds.** Port the domain cases to
   program and integration tests; test unauthorized/concurrent actions, replay attempts,
   deadline boundaries, and accounting. Obtain an independent security review before
   considering production use.

## Deployment

The verified production build is ready for a standard Next.js-compatible Node
server using the build/start commands above. No external account is configured
and nothing has been published. Retain dynamic App Router support for locally
created bookings; a static-only export is not configured.

## Team

Built by two siblings preparing FUSE for a Colosseum hackathon
submission.
This is our first hackathon project together.
