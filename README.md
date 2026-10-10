<h1 align="center">FUSE Marketplace</h1>

<p align="center">
  <strong>Commit together. Make it happen.</strong>
</p>

<p align="center">
  Conditional group bookings, designed for Solana.
</p>

---

> **Project status:** Website and interactive frontend demo implemented; an isolated
> Anchor escrow foundation under `anchor/` passes 20 local Solana VM tests.
> **Interactive prototype — simulated funds. No real transactions.**
> The website is not connected to Solana. No smart contract is deployed.

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
- [x] Minimal Anchor escrow instructions and local Solana VM test suite.
- [ ] Solana Devnet integration for the core booking flow.
- [ ] Demonstration video and hackathon submission materials.

## Scope and safety

The frontend demo uses simulated balances, not real funds. Amounts are integer
**demo tokens**, with no financial value. They are not USDC or on-chain assets.

The planned Solana integration will enforce booking conditions,
deposits, payouts, and refunds through a smart contract. The isolated program
foundation now implements those rules; wallet and frontend integration remain planned.

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

## What is implemented in the frontend

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
| `anchor/programs/fuse-escrow/src/` | Anchor campaign, approvals, deposits, activation and refunds |
| `anchor/programs/fuse-escrow/tests/escrow.rs` | Compiled SBF execution and real SPL-token CPI tests in LiteSVM |
| `anchor/Cargo.lock` | Locked program and VM-test dependencies |
| `anchor/scripts/` | Isolated Linux/WSL tool bootstrap, build and test commands |
| `docs/escrow-architecture.md` | Account design, enforcement, integration boundary and security limits |

The UI invokes commands through the mock adapter. There are no pretend blockchain
methods. During Solana integration, evolve the adapter to handle asynchronous wallet
authorization, submitted/pending/confirmed states, and contract-backed snapshots.
Shared models and presentation components provide the starting point; the program
must independently enforce every rule.

Next.js generated `AGENTS.md` during the development run. It points future
contributors to documentation bundled with the installed Next.js version.

## Solana escrow foundation

The Anchor program is separate from the seven-page website. It uses actual Solana
accounts, signer checks, PDA authorities, the chain Clock sysvar, and the classic
SPL Token Program. Local VM tests load the compiled SBF program, create a valueless
test mint, deposit tokens, and execute supplier payouts/refunds. Nothing has been
deployed to a validator, Devnet, or Mainnet, and the website still uses its original
simulation. There are no fabricated transaction references.

Implemented instructions:

- `create_campaign`: immutable financial terms; positive values, future deadline,
  checked arithmetic, and allocations equal to the funding target.
- `approve_supplier`: only the designated signing venue/instructor can approve.
- `deposit`: signed SPL-token transfer into a campaign-PDA-controlled vault, with
  one contribution PDA per attendee; validates mint/owner, quantities, and seat cap.
- `activate`: permissionless signed trigger; requires full funding, both approvals,
  and strictly pre-deadline chain time; atomically pays the exact fixed allocations
  once and marks Activated.
- `refund`: contributor signs for their own record at/after expiry; transfers their
  deposit once, rejects redirected/foreign claims, and forbids activated refunds.

There is no administrative withdrawal, financial-terms edit, early withdrawal,
supplier replacement, clock override, or reset instruction. Recipient token owners
must match the immutable supplier identities. Only nonfreezable classic SPL mints
are supported. Amounts are raw integer base units; tests use a zero-decimal mint
for the 10 × 20, 80/120 example.

See [escrow architecture](docs/escrow-architecture.md) for PDA seeds, state transitions,
the future adapter mapping, and limitations.

### Local program development

Windows builds use **Ubuntu in WSL2**. The existing frontend remains a Windows npm
project; there is no second JavaScript package manager or frontend dependency change.
Pinned versions: host Rust **1.89.0**, Solana CLI **2.3.0**, Anchor Rust crates
**0.32.1**, LiteSVM **0.7.0**, and SPL Token **8.0.0**. The SBF build explicitly pins
platform tools **v1.52**, because Agave's default v1.48 Cargo cannot parse an
edition-2024 transitive dependency. Anchor CLI is not required by the verified
direct SBF-build/LiteSVM workflow and is not installed here.

The Linux compiler prerequisites installed for this workstation were
`build-essential`, `pkg-config`, `libssl-dev`, `clang`, `libclang-dev`, and
`protobuf-compiler`. Bootstrap downloads Rust/Agave into
`/var/tmp/fuse-escrow-tools`, rather than changing a wallet configuration. The first
build downloads SBF platform tools into Solana's Linux cache. Allow disk space and
network access for these public tool/dependency downloads.

From this repository root in PowerShell, these commands were executed successfully
with the required WSL/network permissions:

```powershell
wsl -d Ubuntu -- bash anchor/scripts/bootstrap-linux.sh
wsl -d Ubuntu -- bash anchor/scripts/run-linux.sh build
wsl -d Ubuntu -- bash anchor/scripts/run-linux.sh check
wsl -d Ubuntu -- bash anchor/scripts/run-linux.sh fmt
wsl -d Ubuntu -- bash anchor/scripts/run-linux.sh test
```

`build` produces `anchor/target/deploy/fuse_escrow.so`; `test` requires this artifact
and runs 20 integration tests, without deploying it. Tests and builds use the
committed Cargo lockfile. No local wallet
file, RPC server, SOL funding, or Anchor CLI is needed to execute the VM tests.
`Anchor.toml` is workspace configuration, not an instruction to deploy with
`anchor test`. Its public program ID identifies a local VM fixture; a future actual
deployment needs a separately generated program keypair, ID synchronization, and
explicit approval. The SBF build created an ignored local program keypair under
`anchor/target/deploy/`. Its contents were not read or printed. It does not correspond
to the declared VM identifier; never commit or reuse it for a funded wallet.

### Environment and secrets

The current frontend needs **no environment variables**. `.env.example` contains
unused public placeholders for a future RPC URL, network label, and deployed
program ID. The mint can be read from campaign accounts or a future allowlist.
These values do not authorize transactions. Never put private keys, recovery
phrases, or secret RPC credentials in `NEXT_PUBLIC_*` variables.

Existing `.env`/`.env.*` ignore rules are preserved; only `.env.example` is eligible
for source control. New ignores cover Anchor build outputs, local wallet folders,
and `*-keypair.json`. Test identities are disposable, deterministic in-memory
fixtures with publicly known test seeds. No existing environment-file values or
user wallet secrets were read, and no mainnet funds were requested or used.

## Verification

**Checks repeated in Phase 2:** `npm run typecheck`, `npm run lint`, `npm test`
(31 tests), `npm run build`, and `npm run test:browser` (8 tests) passed. The browser
suite includes both flows and all seven routes at 375px, 768px, and 1440px. The
dependency audit results below belong to the frontend milestone; that audit was
not repeated for this escrow-only change.

**Program checks:** SBF production compilation with platform tools v1.52 passed;
`cargo check --locked -p fuse-escrow --all-targets` and rustfmt passed. The build was
executed via Solana `cargo build-sbf`, not an unavailable Anchor CLI. **20 LiteSVM
integration tests passed** against the compiled artifact. They cover all 12 requested
cases, plus immutable reinitialization rejection, invalid/overflowing terms,
unsigned/repeated approvals, aggregated deposits, insufficient-balance rollback,
early-refund rejection, post-expiry actions, recipient/vault/program substitution,
failed-second-payout rollback, direct vault donations, and freezable-mint rejection.

The tests execute the 8-seat → 10-seat → blocked missing approval → instructor
approval → activation sequence, exact 80/120 balances, and expiry with contributor
refunds and a rejected second claim. A first VM run caught an unsupported on-chain
curve-check API; it was removed, the bytecode rebuilt, and all tests rerun successfully.
Signature constraints still enforce designated supplier authorization.

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

The first SBF toolchains used Rust 1.84 and failed on an edition-2024 dependency.
The final pinned v1.52 SBF compiler reports `rustc 1.89.0-dev` and builds successfully.
A transient WSL connection timeout recovered on retry. These resolved tooling
issues do not require frontend changes. Anchor CLI and a live validator/deployment
were not exercised; neither is needed for the executed VM test workflow.

## Known limitations

- Frontend prototype, not a production financial application.
- Data belongs to one browser and origin. Clearing storage or resetting removes
  custom bookings; custom links do not transfer data to another browser.
- localStorage, mock identities, and client validation are not production security.
  Tabs receive storage updates, but simultaneous writes are not transactional.
- No database, wallet integration, authentication provider, deployed escrow, or
  event fulfillment exists. The isolated escrow program is a local proof of concept.
  Refunds are claimed individually, not automatically.
- No production security review, deployment verification, generated frontend IDL,
  RPC-backed client, or token policy for assets with value exists. Unsolicited vault
  surplus and account rent remain locked; see the architecture document.
- FUSE does not guarantee physical workshop delivery after supplier payouts
  or resolve later service disputes.
- Chrome was tested; Firefox and Safari have not been verified.
- The full dependency audit reports **five high-severity findings** in the dev-only
  Next ESLint chain (`braces`, `micromatch`, and `fast-glob`). At verification, the
  registry had no compatible published `braces` patch. Track this tooling advisory;
  the runtime audit is clean.

## Next steps toward Solana escrow

1. **Connect one booking on a local validator.** Generate the program IDL/types and
   use a separate wallet-backed adapter with disposable wallets and a local test mint;
   preserve the independently usable simulated demo.
2. **Exercise both flows with multiple wallets.** Read chain accounts/time, handle
   signatures, failures, confirmation and refresh recovery; then consider an explicitly
   approved Devnet deployment with real transaction references and a test token only.
3. **Review security before assets with value.** Review token policy, upgrade authority,
   rent/surplus handling and account constraints; expand concurrency/replay integration
   coverage and obtain independent review before considering production use.

## Deployment

The verified production build is ready for a standard Next.js-compatible Node
server using the build/start commands above. No external account is configured
and nothing has been published. Retain dynamic App Router support for locally
created bookings; a static-only export is not configured.

The escrow has not been deployed anywhere. Loading bytecode into a disposable test
VM is local testing, not a cluster deployment. No deployment/account-service action
was authorized or performed.

## Team

Built by two siblings preparing FUSE for a Colosseum hackathon
submission.
This is our first hackathon project together.
