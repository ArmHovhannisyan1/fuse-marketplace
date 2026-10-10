<h1 align="center">FUSE Marketplace</h1>

<p align="center">
  <strong>Commit together. Make it happen.</strong>
</p>

<p align="center">
  Conditional group bookings, designed for Solana.
</p>

---

> **Project status:** The original seven-page marketplace remains an interactive
> simulation. The Anchor escrow now executes real signed transactions on a local
> Solana validator; `/onchain-demo` provides a separate RPC-backed wallet experience.
> **Marketplace: Interactive prototype — simulated funds. No real transactions.**
> **Localnet: real transactions with disposable tokens that have no monetary value.**
> Nothing has been deployed to Devnet or Mainnet. This project is unaudited.

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

| Requirement                        | Target                    |
| ---------------------------------- | ------------------------- |
| Funded seats                       | 10                        |
| Total funding                      | 200 demo tokens           |
| Venue approval and allocation      | Approved; 80 demo tokens  |
| Instructor approval and allocation | Approved; 120 demo tokens |

If all requirements are satisfied before the deadline, the booking
can activate. Otherwise, deposits become refundable after expiry.

## Build roadmap

- [x] Responsive landing page and product information pages.
- [x] Marketplace and interactive booking demo.
- [x] Domain rules, persistence, and tests for approvals, activation, expiry, and refunds.
- [x] Validated creation form and current identity's commitments.
- [x] Minimal Anchor escrow instructions and local Solana VM test suite.
- [x] Real local-validator deposits, approvals, atomic payouts and expiry refunds.
- [x] Rust-generated IDL/types and an isolated Wallet Standard activation page.
- [ ] Solana Devnet integration for the core booking flow.
- [ ] Demonstration video and hackathon submission materials.

## Scope and safety

The frontend demo uses simulated balances, not real funds. Amounts are integer
**demo tokens**, with no financial value. They are not USDC or on-chain assets.

The planned public Solana integration will enforce booking conditions, deposits,
payouts, and refunds through a smart contract. The program now enforces those rules
on a disposable local validator. The original marketplace still simulates them;
the separate localnet page reads real accounts and signs only activation.

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

| Route               | Working functionality                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/`                 | Product explanation, shared workshop preview, featured demo listings, FAQ                                               |
| `/how-it-works`     | Workshop terms, participant responsibilities, activation and refunds                                                    |
| `/about`            | Mission, honest team introduction, scope and limitations                                                                |
| `/marketplace`      | Five seeded scenarios, title search, status filters, empty state                                                        |
| `/marketplace/[id]` | Contributions, approvals, activation, personal refunds, simulated activity, demo controls                               |
| `/create`           | Validated form, review before publication, fixed published terms                                                        |
| `/my-commitments`   | Current mock identity's seats, deposits, booking and refund status                                                      |
| `/onchain-demo`     | Actual local RPC state, approvals, escrow balance, Wallet Standard connection, signed activation and genuine signatures |

The five seeded bookings are:

| ID                    | Starting scenario                                                   |
| --------------------- | ------------------------------------------------------------------- |
| `clay-and-company`    | Flagship: 8/10 funded, venue approved, instructor awaiting approval |
| `print-club`          | Fully funded, awaiting venue approval                               |
| `coffee-lab`          | Fully funded and approved, ready for explicit activation            |
| `botanical-studio`    | Already activated, with a seeded simulated payout                   |
| `weekend-woodworking` | Expired, individual deposits available to refund                    |

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

| Location                                      | Responsibility                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `app/`                                        | App Router routes, layout, metadata, icon, and design styles                                                         |
| `components/`                                 | Reusable UI, page views, navigation, demo controls, and booking panels                                               |
| `lib/models.ts`                               | Typed identities, suppliers, deals, contributions, activity, payouts, commands                                       |
| `lib/domain.ts`                               | Pure checks, validation, derived statuses, state transitions                                                         |
| `lib/seed.ts`                                 | Stable examples, initial balances, and reproducible clock                                                            |
| `lib/demo-store.ts`                           | Mock adapter, shared React subscription, hydration-safe initialization                                               |
| `lib/storage.ts`                              | Storage version, runtime validation, cross-record accounting invariants                                              |
| `lib/copy.ts`                                 | Shared branding, positioning, notice, FAQ                                                                            |
| `lib/solana/`                                 | Isolated typed RPC client, generated-IDL campaign decoding and Wallet Standard signing; no mock adapter dependencies |
| `tests/domain.test.ts`                        | Domain, accounting, publication, and persistence tests                                                               |
| `tests/browser/demo.spec.ts`                  | Core flows, storage, forms, keyboard, responsive routes                                                              |
| `anchor/programs/fuse-escrow/src/`            | Anchor campaign, approvals, deposits, activation and refunds                                                         |
| `anchor/programs/fuse-escrow/tests/escrow.rs` | Compiled SBF execution and real SPL-token CPI tests in LiteSVM                                                       |
| `anchor/Cargo.lock`                           | Locked program and VM-test dependencies                                                                              |
| `anchor/scripts/`                             | Isolated Linux/WSL tool bootstrap, build and test commands                                                           |
| `anchor/idl/`                                 | Anchor-generated Rust-authoritative IDL and TypeScript interface                                                     |
| `anchor/programs/fuse-escrow/examples/`       | IDL generation and real local-validator transaction scenarios                                                        |
| `tests/localnet/`                             | TypeScript decoding and state checks against the deployed program                                                    |
| `docs/demo-recording-guide.md`                | Real transaction demonstration and evidence checklist                                                                |
| `docs/escrow-architecture.md`                 | Account design, enforcement, integration boundary and security limits                                                |

The simulated UI invokes the original mock adapter. The separate localnet page
uses `LocalnetClient` and has no localStorage balances or mock identities. Its
small client supports reading accounts, obtaining local fee SOL, and activation.
Future deposit/approval/refund UI belongs in this adapter with authentic wallet
signatures; it must not convert mock role selection into signing authority.

Next.js generated `AGENTS.md` during the development run. It points future
contributors to documentation bundled with the installed Next.js version.

## Solana escrow foundation

The Anchor program is separate from the seven-page website. It uses actual Solana
accounts, signer checks, PDA authorities, the chain Clock sysvar, and the classic
SPL Token Program. Local VM tests load the compiled SBF program, create a valueless
test mint, deposit tokens, and execute supplier payouts/refunds. The same program
is now loaded on a real local validator and exercised through JSON RPC. Genuine
confirmed signatures and inspected state are written to an ignored public receipt.
The original marketplace remains a simulation. Devnet and Mainnet are untouched.

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
project; npm remains the only JavaScript package manager. The isolated localnet
page uses pinned Solana Kit 8.4.0 and Wallet Standard packages, with legacy
transactions compatible with this validator. No web3.js/Anchor JavaScript SDK
family is mixed into it.
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
`Anchor.toml` is workspace configuration, not an instruction to run `anchor test`.
The declared program ID is also used for local genesis loading, which needs no
program private key. A future Devnet deployment needs a generated program keypair,
ID synchronization and rebuild. The SBF build created an ignored local keypair under
`anchor/target/deploy/`. Its contents were not read or printed. It does not correspond
to the declared identifier; never use it to deploy this binary unchanged, commit
it, or reuse it for a funded wallet.

### Real local-validator demonstration

Use the existing pinned WSL toolchain above. These are the verified PowerShell
commands on this workstation; replace the `/mnt/c/...` prefix if the checkout moves.

```powershell
$fuseScript = '/mnt/c/Users/User/Desktop/fuse-marketplace/anchor/scripts/run-linux.sh'
wsl.exe -d Ubuntu -- bash $fuseScript build
wsl.exe -d Ubuntu -- bash $fuseScript idl
wsl.exe -d Ubuntu -- bash $fuseScript validator
```

Keep the validator terminal running. In another terminal at the repository root:

```powershell
$fuseScript = '/mnt/c/Users/User/Desktop/fuse-marketplace/anchor/scripts/run-linux.sh'
wsl.exe -d Ubuntu -- bash $fuseScript localnet
```

`validator` loads `fuse_escrow.so` using the CLI's `--bpf-program` genesis option at
**25GSneHPbwgwoUNjjcGQ4RoJzJsxETMtZUHNhXWYTf7G**, matching Rust, Anchor.toml, IDL
and client. This is an actual executable program on a real validator, with upgrades
disabled. **There is no deployment transaction signature for genesis loading.**
Anchor CLI was not installed: `idl` uses Anchor's compiled Rust metadata builder,
not a guessed JSON interface or handwritten instruction discriminators.

The dedicated Linux ledger is `/var/tmp/fuse-escrow-tools/fuse-localnet-ledger`.
Restarting reuses it; genesis program flags are then ignored by Solana. After a
binary change, stop the validator and append `--reset` to `validator` to discard
only this disposable ledger and reload the program. This optional reset command
has not been exercised. Run `localnet` again afterward; old receipts then refer
to discarded state. Ledger retention is capped at 1,000,000 shreds; sufficiently
old transaction history can still be pruned. This is not archival infrastructure.

`localnet` creates fresh random organizer, venue, instructor, attendee and caller
keypairs in memory, a classic six-decimal test mint, and real token accounts:

- **A:** deposit 160 then 40 tokens; read the 200-token vault; reject full-funding
  activation and an unrelated supplier signer; obtain both genuine supplier
  approvals; activate; check exact **80 / 120** payouts and zero vault/accounting;
  confirm that repeated activation fails on-chain.
- **B:** deposit 40 tokens; use a controlled 15-second deadline and poll the actual
  validator Clock for at most 45 seconds; reject late activation; contributor signs
  a refund; verify their restored **800-token** balance at this checkpoint, the
  refunded record and empty vault; reject duplicate refund and subsequent activation.
- Prepare campaign **3**, fully funded and approved with a 24-hour deadline, for
  browser activation. The attendee then has **600 tokens**. Each run creates a new
  independent set of fixtures; it never resets the validator or the simulated demo.

Every amount uses exact integer base units: 200 tokens = 200,000,000 units;
payouts are 80,000,000 and 120,000,000. Confirmed failed transactions are deliberately
submitted for negative cases, then their actual custom errors are checked. A failing
transaction or assertion makes the command fail. Public evidence is saved in
ignored `anchor/localnet/receipt.json`; no fixture private key is written to disk.

### Separate on-chain page

Start the website normally and open `/onchain-demo` on the same machine as the
validator. The loopback endpoint is a development endpoint, not hosted RPC.
The page reads executable program state, actual Clock, campaign accounts, token
balances and transaction signatures at confirmed commitment. Refresh rereads RPC;
history polls every four seconds because indexing can lag account confirmation.
Unavailable RPC clears displayed campaign funds and shows a helpful error.

Connect a disposable Wallet Standard wallet advertising **solana:localnet** and
**legacy** signing support. Configure its custom RPC to `http://127.0.0.1:8899`.
Request local test SOL for your fee, choose a ready campaign 3, review the exact
80/120 payouts and sign activation in your wallet. Any authentic caller may trigger
activation; the script's suppliers already signed their approvals. The page does
not provide supplier/deposit/refund signing UI or secretly sign as fixture identities.

Wallet approval signs the exact reviewed message; the client broadcasts it only
to the verified local RPC and checks the returned signature and confirmation.
Network/program mismatches and missing capabilities block actions. No public
explorer links are fabricated. Browser compatibility was exercised with a
**test-only Wallet Standard provider signing with a real ephemeral Ed25519 key**;
an installed wallet extension has not been manually verified. If your extension
does not support localnet, the independently working scripts remain the reliable
demonstration. They need no wallet extension.

### Environment and secrets

The frontend needs **no environment file**: the separate page defaults to the
verified loopback RPC and generated program ID. `.env.example` contains public
configuration only; the page reads `NEXT_PUBLIC_SOLANA_RPC_URL` and
`NEXT_PUBLIC_FUSE_PROGRAM_ID`. `NEXT_PUBLIC_SOLANA_NETWORK`, if set, must be
`localnet`; other network labels are rejected. The mint and decimals come from actual RPC state.
These values do not authorize transactions. Never put private keys, recovery
phrases, or secret RPC credentials in `NEXT_PUBLIC_*` variables.

Existing `.env`/`.env.*` ignore rules are preserved; only `.env.example` is eligible
for source control. New ignores cover Anchor build outputs, local wallet folders,
and `*-keypair.json`. VM tests use deterministic disposable fixture seeds; real
RPC scenarios and browser tests use randomly generated ephemeral keys. Validator
identity/faucet keys stay in the dedicated Linux ledger outside Git. The validator
command specifies an unused disposable public genesis SOL recipient instead of
relying on a CLI default wallet. Existing environment-file values and user wallet
secrets were not opened or printed by the agent; no Mainnet funds were used.

## Verification

Checks executed in Phase 3:

| Check                          | Result                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `npm ci`                       | Clean locked installation succeeded                                                                              |
| `npm run typecheck`            | Passed                                                                                                           |
| `npm run lint`                 | Passed                                                                                                           |
| `npm test`                     | 35 passed: the original 31 plus real-client interface boundaries and exact amount formatting                     |
| `npm run build`                | Optimized production build passed, including the new isolated route                                              |
| `npm run test:browser`         | 10 passed: all original eight tests plus unavailable RPC/missing wallet and responsive error handling            |
| `npm run test:localnet`        | One integration test passed against real deployed campaign/vault state and indexed signatures                    |
| `npm run test:browser:onchain` | Three passed: wallet rejection, authentically signed activation with exact payouts and refresh, network mismatch |
| `run-linux.sh build`           | SBF compiled using the preserved v1.52 platform tools                                                            |
| `run-linux.sh check` / `fmt`   | Rust all-target checks and formatting passed                                                                     |
| `run-linux.sh test`            | All 20 compiled-program LiteSVM tests passed                                                                     |
| `run-linux.sh idl`             | Anchor-generated IDL and TypeScript interface produced successfully                                              |
| `run-linux.sh localnet`        | Both signed RPC scenarios passed, including expected failed on-chain transactions                                |
| `npm audit --omit=dev --json`  | Zero reported runtime vulnerabilities                                                                            |

The browser suite exercises all seven original routes and the separate localnet
page at **375px, 768px and 1440px**, with no horizontal overflow. Desktop and mobile
screenshots were visually inspected. Direct navigation, refresh, mobile navigation,
native review dialogs and the original success/expiry simulations work. Screenshots
are saved under ignored `test-results/`.

The 20 VM tests also cover deadline boundaries, both approvals without funding,
immutable terms, invalid/overflowing amounts, signature requirements, aggregation,
insufficient-balance rollback, incorrect owners/mints/programs, foreign refunds,
failed-second-payout rollback, direct vault donations and freezable-mint rejection.
These remain a separate regression layer; the real RPC scenarios are additional
evidence, not replacements for the VM tests.

To run the extra checks, keep the validator running and prepare fresh fixtures
before the signing test:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
$fuseScript = '/mnt/c/Users/User/Desktop/fuse-marketplace/anchor/scripts/run-linux.sh'
wsl.exe -d Ubuntu -- bash $fuseScript localnet
npm run test:localnet
npm run test:browser:onchain
npm audit --omit=dev --json
```

The signing test consumes campaign 3, so rerun `localnet` before repeating it.
Playwright starts a local production server if none is running. On this workstation
it uses installed Google Chrome; `FUSE_BROWSER_PATH` can select another installed
Chromium. Browser installation on other systems was not verified. A regular browser
test run replaces its previous `test-results/` artifacts; save screenshots you need.

Initial restricted Windows runs blocked child processes with `EPERM`; builds,
tests and browser execution passed after rerunning with the required permission.
Transient local RPC timeouts recovered on retry; the page retains bounded requests,
explicit error messages and refresh recovery. An initial history assertion exposed
validator indexing lag; polling now waits for the real record rather than displaying
a fabricated transaction. Longer ledger retention preserves recording evidence.
Anchor CLI remains uninstalled and was unnecessary. No toolchain upgrade or protocol
rule bypass was used. Optional ledger reset and installed wallet extensions have
not been exercised.

## Known limitations

- Frontend prototype, not a production financial application.
- Simulated marketplace data belongs to one browser and origin. Clearing storage or resetting removes
  custom bookings; custom links do not transfer data to another browser.
- localStorage, mock identities, and client validation are not production security.
  Tabs receive storage updates, but simultaneous writes are not transactional.
- No database, production authentication or event fulfillment. The real escrow and
  wallet action are local-validator proof of concept only; supplier/deposit/refund
  wallet UI remains unfinished. Refunds are claimed individually, not automatically.
- No production security review, public deployment, upgrade governance or reviewed
  token policy for assets with value exists. Unsolicited vault
  surplus and account rent remain locked; see the architecture document.
- FUSE does not guarantee physical workshop delivery after supplier payouts
  or resolve later service disputes.
- Chrome was tested; Firefox and Safari have not been verified.
- The full dependency audit reports **five high-severity findings** in the dev-only
  tooling dependencies. No forced dependency upgrades were performed. Track these advisories;
  the runtime audit is clean.

## Next steps toward Solana escrow

1. **Prepare a reviewed Devnet deployment.** Generate an ignored program keypair,
   synchronize its public ID in Rust/config, rebuild the SBF binary and IDL, choose
   deployment/upgrade authority and a valueless test mint, fund local deployer fees.
   The current page deliberately rejects Devnet; add an explicit reviewed network
   mode and obtain deployment approval before publishing anything.
2. **Complete participant wallet actions.** Extend the isolated client for campaign
   creation, supplier approvals, attendee deposits and own refunds. Verify a real
   installed wallet extension, exact decimal units, RPC failure/retry recovery and
   multiple contributors. Keep the existing simulation independent.
3. **Record the verified flow and review security.** Follow the recording guide,
   capture fresh public signatures and balance checks, and finish submission
   materials. Review account constraints, mint policy, authority and rent/surplus
   handling; obtain independent review before considering assets with value.

## Deployment

The verified production build is ready for a standard Next.js-compatible Node
server using the build/start commands above. No external account is configured
and nothing has been published. Retain dynamic App Router support for locally
created bookings; a static-only export is not configured.

The escrow is loaded and executes on the local validator through genesis loading.
No public-network deployment, external hosting, push or merge was performed.

## Team

Built by two siblings preparing FUSE for a Colosseum hackathon
submission.
This is our first hackathon project together.
