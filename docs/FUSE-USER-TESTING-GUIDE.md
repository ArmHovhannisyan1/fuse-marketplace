# FUSE user testing guide

Website: **https://fuse-marketplace.vercel.app/**

Checked: **11 October 2026**, against local `main` at `6f7b8bb` and the hosted UI.

Use this guide to learn the product. Use [the live demo playbook](FUSE-LIVE-DEMO-PLAYBOOK.md)
for recording and [the QA checklist](FUSE-FINAL-QA-CHECKLIST.md) to divide the tests.

## 1. Understand the two demonstrations

FUSE helps people agree on a shared booking. A workshop needs enough paid seats,
a venue and an instructor. Funding alone is not enough. Both suppliers must
approve, and someone must activate the booking before its deadline. If an
unactivated booking expires, each attendee can claim their own deposit back.

| Part                                                     | What it does                                                             | What it does not do                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Marketplace, workshop details, Create and My commitments | Simulates deposits, approvals, payouts and refunds in this browser       | Does not send Solana transactions or use a real wallet                                       |
| `/onchain-demo`: historical proof                        | Links earlier genuine Solana Devnet transactions                         | Does not claim that a new transaction just happened                                          |
| `/onchain-demo`: current live state                      | Reads actual accounts through RPC, a service for reading blockchain data | Does not replace missing chain data with simulated balances                                  |
| `/onchain-demo`: signing wallet                          | Can sign a real activation for an eligible campaign                      | Does not create campaigns, deposit tokens, approve suppliers or claim refunds in the browser |

**Final copy polish:** Home, About, the marketplace notice and footer now distinguish
the local simulation from the deployed Devnet escrow. The separate `/onchain-demo`
shows genuine historical transactions and live RPC state. Only activation has a
real browser signing flow; other on-chain actions use developer scripts. The
contract is unaudited and uses valueless test tokens. These copy corrections need
a Vercel deployment before they appear on the public website. Earlier hosted
checks below describe the site before this copy polish.

## 2. Start safely and keep the same browser

1. Open a **new private/incognito browser session** for these tests. Do not use a
   normal session that contains demo work you want to keep.
2. Open the hosted site. No wallet is needed for scenarios A–F.
3. Keep the same browser session and the same website address for a scenario.
   Each person, device, browser profile and website origin has its own simulation.
   Your sister's changes on another computer will not update your browser.
4. All simulation steps below start from a reset unless stated otherwise.
5. Never put a recovery phrase or private key into FUSE. Do not use Mainnet funds.
6. Leave the untracked `install.sh` file alone. It is not a testing command.

### Reset R: the common starting state

Only use this reset in your disposable testing session. It removes **all** locally
created bookings and changes, not just the current workshop.

1. Open [Clay & company](https://fuse-marketplace.vercel.app/marketplace/clay-and-company).
2. In **Demo controls**, click **Reset entire demo**.
3. Read **Reset the entire demo?**, then click **Reset demo**.
4. Check **Act as → Sam · attendee**, **Balance: 800 demo tokens**, and **8 of 10
   seats funded**, **160 of 200 demo tokens**.
5. Check the frozen simulated clock: **7 Oct 2026, 12:00 UTC**. The clock does
   not follow the real date. The flagship deadline is **9 Oct 2026, 12:00 UTC**.

The inputs on a details page are separate from the saved simulation. Reset R does
not promise to clear the current **Seats to commit** input. Set its value yourself
for each test. On Create, refresh the page if you also need a blank form.

### The five starting workshops

Every seed has 10 required seats, a 20-token seat price and fixed 80/120 allocations.

| Workshop and route                                         | Seats / funding | Venue / instructor  | Starting status                         | Deadline, UTC      |
| ---------------------------------------------------------- | --------------- | ------------------- | --------------------------------------- | ------------------ |
| **Clay & company** — `/marketplace/clay-and-company`       | 8/10; 160/200   | Approved / pending  | Open                                    | 9 Oct 2026, 12:00  |
| **The weekend print club** — `/marketplace/print-club`     | 10/10; 200/200  | Pending / approved  | Waiting for approval                    | 10 Oct 2026, 12:00 |
| **A better cup of coffee** — `/marketplace/coffee-lab`     | 10/10; 200/200  | Approved / approved | Ready to activate                       | 8 Oct 2026, 12:00  |
| **Botanical sketchbook** — `/marketplace/botanical-studio` | 10/10; 200/200  | Approved / approved | Activated; seeded payout already exists | 8 Oct 2026, 12:00  |
| **Made from wood** — `/marketplace/weekend-woodworking`    | 3/10; 60/200    | Approved / pending  | Expired — refunds available             | 6 Oct 2026, 12:00  |

### Roles and initial balances

Select these exact options in **Act as**, inside **Demo controls** on workshop
details, Create or My commitments. This is **NOT A LOGIN**.

| Exact option                       | What this mock identity can do                                             | Balance after Reset R |
| ---------------------------------- | -------------------------------------------------------------------------- | --------------------- |
| Sam · attendee                     | Commit seats, claim Sam's own eligible refunds, activate a ready booking   | 800                   |
| Robin · attendee                   | Commit seats, claim Robin's own eligible refunds, activate a ready booking | 380                   |
| Workshop organizer · organizer     | Publish a demo booking, activate a ready booking                           | 500                   |
| Designated venue · venue           | Approve the designated venue's terms, activate a ready booking             | 80                    |
| Designated instructor · instructor | Approve the designated instructor's terms, activate a ready booking        | 120                   |

Sam began with 1,000 tokens before the five seeded deposits of 40 each. The visible
starting balance is therefore 800. The venue and instructor already received 80
and 120 from the seeded **Botanical sketchbook** activation. Compare **balance
changes** when testing a new payout; do not expect every supplier balance to start
at zero. Mock role selection does not control any real blockchain wallet.

## 3. Scenario A — explore the marketplace

| Item           | Instruction                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| Goal           | Find a workshop and understand its conditions.                                   |
| Starting state | Use Reset R. No custom bookings or earlier clock changes.                        |
| Page           | [Home](https://fuse-marketplace.vercel.app/), then How It Works and Marketplace. |
| Role           | Sam · attendee; no role change is needed for browsing.                           |

| Step | Exact action and input                                                                                   | Expected result and why                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1    | Open Home. Read **Commit together. Make it happen.**                                                     | The hero explains a shared booking. The notice says funds are simulated.                                                   |
| 2    | Click **How It Works** in the header.                                                                    | `/how-it-works` shows ten seats, price 20, target 200 and allocations 80/120.                                              |
| 3    | Click **Marketplace** in the header.                                                                     | `/marketplace` shows **5 demo bookings**.                                                                                  |
| 4    | In **Search workshops by title**, type `clay`.                                                           | Only **Clay & company** remains. Search checks workshop titles, without case sensitivity.                                  |
| 5    | Click **Clear search**, then try each status filter in the table below.                                  | Each starting status has one seed. Search and status filters work together.                                                |
| 6    | Select **All bookings**, type `does not exist` into search.                                              | **No workshops found.** appears. Click **Clear search and filters** to restore all five.                                   |
| 7    | Click the **Clay & company** title or its **Details** link.                                              | `/marketplace/clay-and-company` opens the flagship. The artwork link also has the accessible name **View Clay & company**. |
| 8    | Read **Activation requirements**, **The people behind the workshop.**, and the right-hand booking panel. | Funding is 8/10 and 160/200. Venue is approved; instructor is not. Deadline is fixed. **Activate booking** is disabled.    |

| Exact filter         | Expected seed after Reset R |
| -------------------- | --------------------------- |
| All bookings         | All five                    |
| Open                 | Clay & company              |
| Waiting for approval | The weekend print club      |
| Ready to activate    | A better cup of coffee      |
| Activated            | Botanical sketchbook        |
| Expired              | Made from wood              |

| Status                      | Simple meaning                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Open                        | Before deadline; more funded seats are needed. Approvals may also be missing.                                 |
| Waiting for approval        | All seats are funded, but at least one supplier approval is missing.                                          |
| Ready to activate           | Funding and both approvals are present, and the deadline has not passed. Someone must still click activation. |
| Activated                   | The one-time simulated payout has happened. No refunds are offered.                                           |
| Expired — refunds available | Deadline passed without activation. Each contributor can claim their own deposit.                             |
| Fully refunded              | Every recorded contributor has claimed their refund. The booking remains closed.                              |

The **Expired** filter also includes fully refunded bookings. There is no separate
**Fully refunded** filter. A funded campaign is not automatically an activated
campaign. Read the status and the approval requirements, not only the progress bar.

**Verification:** Check the title, status, progress and supplier labels against the
tables above. These hosted search/filter and navigation steps passed automation.
**Reset:** Clear search/select **All bookings** for browsing; use Reset R if the
underlying booking state was changed.

### Page and navigation map

| Page                      | Exact URL                                                        | Navigation                                                                          |
| ------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Home                      | https://fuse-marketplace.vercel.app/                             | Click the FUSE logo.                                                                |
| How It Works              | https://fuse-marketplace.vercel.app/how-it-works                 | Header **How It Works**.                                                            |
| About                     | https://fuse-marketplace.vercel.app/about                        | Header **About**; footer **About FUSE**.                                            |
| Marketplace               | https://fuse-marketplace.vercel.app/marketplace                  | Header/footer **Marketplace**; hero **Explore marketplace**.                        |
| Flagship details          | https://fuse-marketplace.vercel.app/marketplace/clay-and-company | Hero **Try the workshop demo**, header **Try the demo**, or workshop title/Details. |
| Create                    | https://fuse-marketplace.vercel.app/create                       | **Create a demo booking** in Marketplace/footer/mobile menu.                        |
| My commitments            | https://fuse-marketplace.vercel.app/my-commitments               | Header/footer/mobile **My commitments**; details **All my commitments**.            |
| Real Devnet demonstration | https://fuse-marketplace.vercel.app/onchain-demo                 | Footer/mobile **Solana on-chain demo**; direct URL.                                 |

On narrow screens use **Open navigation**. Click a destination; the menu should
close. **Close navigation** closes it without leaving the page. The seven original
page types include workshop details; `/onchain-demo` is an additional page.

## 4. Scenario B — successful workshop activation

**This is the main interactive demonstration. Every action here is simulated.**

| Item           | Instruction                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Goal           | Show that funding and supplier approval are both needed, then pay exact allocations once.                                  |
| Starting state | Reset R: 8/10 seats, 160/200 tokens, venue approved, instructor pending. Sam has two seeded seats and 40 tokens committed. |
| Page           | https://fuse-marketplace.vercel.app/marketplace/clay-and-company                                                           |
| Role           | Start Sam · attendee; approve as Designated instructor · instructor; switch back to Sam for activation.                    |

| Step | Exact action and input                                                    | Expected state                                                                                                                                          |
| ---- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Check **Act as → Sam · attendee** and the starting state.                 | Sam balance 800; **Your contribution**: 2 seats, 40 tokens, **Locked**.                                                                                 |
| 2    | In **Seats to commit**, enter `2`.                                        | The price for this new commitment is 40 demo tokens. There are exactly two seats left.                                                                  |
| 3    | Click **Review commitment**.                                              | **Review your commitment.** shows Sam, Clay & company, quantity 2, deposit 40 and the deadline. Read the locked-deposit warning.                        |
| 4    | Click **Confirm 40 demo tokens**.                                         | Funding becomes 10/10, 200/200, 100%. Sam balance is 760. Sam's combined contribution is now 4 seats and 80 tokens. Status: **Waiting for approval**.   |
| 5    | Look at **Activate booking**.                                             | It is still disabled. The reason says **Waiting for instructor approval.** Full funding alone does not release payment.                                 |
| 6    | Select **Act as → Designated instructor · instructor**.                   | **Approve as instructor** becomes enabled. The venue already shows **Approved**.                                                                        |
| 7    | Click **Approve as instructor** under **The people behind the workshop.** | Both supplier cards show **Approved**. Message: **Supplier approval recorded in the demo.** Status: **Ready to activate**. No payout has happened yet.  |
| 8    | Select **Act as → Sam · attendee**.                                       | **Activate booking** stays enabled. Any mock participant can activate a ready booking, not only the organizer.                                          |
| 9    | Click **Activate booking**.                                               | **Bring the booking together.** reviews Venue 80, Instructor 120, Total 200 demo tokens.                                                                |
| 10   | Click **Confirm activation**.                                             | Status: **Activated**. Message: **Booking activated. The exact supplier payouts were simulated.**                                                       |
| 11   | Read **Simulated payout completed** below the supplier cards.             | Receipt: **Venue: 80 · Instructor: 120 demo tokens**. It says **No real transaction.**                                                                  |
| 12   | Check the action buttons and Sam's contribution.                          | **Booking activated** is disabled; reason: **This booking has already activated.** Deposit status: **Paid to suppliers**. **Claim refund** is disabled. |
| 13   | Refresh the page, then open **All my commitments**.                       | Receipt and Activated status survive refresh. Sam's Clay card has 4 seats, 80 tokens and **Paid to suppliers · no refund**.                             |

**Why:** Everyone must agree on the same fixed terms. Activation is explicit,
before the deadline, all-or-nothing and one-time. More funding does not bypass
missing approval. Activation ends refund eligibility in this version.

**Verification:** The hosted workflow, exact receipt, Sam's 800 → 760 balance,
and My commitments were checked. If you select the venue after activation, its
total balance is 160; the instructor's is 240. Their changes were +80 and +120;
the other 80/120 came from Botanical sketchbook.

**Reset:** Use Reset R before a second demonstration or before Scenario C. You
cannot expire this activated workshop using **Advance past deadline**; that control
is disabled for an activated booking.

## 5. Scenario C — failed workshop and refund

### C1. Make a new deposit, expire the workshop, claim your own refund

| Item           | Instruction                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| Goal           | Show deposits are locked before expiry, then returned to their own contributor. |
| Starting state | Reset R. Do not continue from the activated Scenario B state.                   |
| Page           | https://fuse-marketplace.vercel.app/marketplace/clay-and-company                |
| Role           | Sam · attendee; Robin · attendee only for the optional final refund.            |

| Step         | Exact action and input                                                                                           | Expected state                                                                                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1            | Select Sam · attendee. Enter `1` in **Seats to commit**.                                                         | A new deposit will cost 20 tokens. Sam already has a seeded 40-token deposit.                                                                                                      |
| 2            | **Review commitment** → **Confirm 20 demo tokens**.                                                              | 9/10 seats, 180/200 tokens. Sam has 3 seats, 60 tokens committed and balance 780.                                                                                                  |
| 3            | Look at **Claim refund** before expiry.                                                                          | Disabled. **No early withdrawals. Refunds become available at expiry if the booking has not activated.**                                                                           |
| 4            | Click **Advance past deadline**, then **Advance clock** in **Advance the demo clock?**                           | The shared simulated time becomes 9 Oct 2026, 12:00:01 UTC. Status: **Expired — refunds available**. This does not change real Devnet time.                                        |
| 5            | Check **Activate booking**.                                                                                      | Disabled. **The activation deadline has passed. This booking cannot activate.** Approvals and new contributions are closed.                                                        |
| 6            | Under **Your contribution**, click **Claim 60 demo token refund**.                                               | All Sam's unclaimed deposits for this booking return together: seeded 40 + new 20. Balance becomes 840. Message: **Your deposit was returned to your demo balance.**               |
| 7            | Check the contribution and progress.                                                                             | **Refund claimed**; **Returned to balance: 60 demo tokens**. Button: **Refund already claimed**, disabled. Funding drops to 6/10 and 120/200 because only Robin's deposit remains. |
| 8            | Try the disabled refund button; read the explanation.                                                            | **Your deposit has been returned. A second claim is blocked.** Sam cannot claim Robin's money.                                                                                     |
| 9            | Refresh; open **All my commitments**.                                                                            | Sam's Clay card still shows the original 3 seats/60 amount, but **Refund completed**. The card is a deposit record, not the current escrow balance.                                |
| 10, optional | Select Robin · attendee. In the Clay card click **Claim on details page**, then **Claim 120 demo token refund**. | Robin receives only Robin's deposit. The workshop becomes **Fully refunded** and progress is 0/10.                                                                                 |

**Why:** A booking that misses its deadline cannot activate. Contributors recover
their own deposits once; refunds are not automatic. One person's refund does not
refund the other person.

**Verification:** Hosted checks confirmed 800 → 780 → 840 for Sam, the 60-token
claim, one-time restriction, My commitments and optional fully refunded state.
Sam's original 1,000 tokens still balance: 840 are available, 120 remain in three
other unsettled bookings, and 40 were already paid through the seeded Botanical
sketchbook activation. The refund returns existing tokens; it does not create
tokens. Before the new deposit, 800 were available because all five seeded
40-token contributions had already been deducted.

**Reset:** Use Reset R. Advancing the clock also expires other unactivated bookings
with earlier deadlines, including A better cup of coffee. Reset restores the
original clock and all five examples.

### C2. Fast refund example for a recording

| Item               | Instruction                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Goal               | Show a refund without waiting or moving the clock.                                                                                                                |
| Starting state     | Reset R for the numbers below; Made from wood is already expired.                                                                                                 |
| Page               | https://fuse-marketplace.vercel.app/marketplace/weekend-woodworking                                                                                               |
| Role               | Sam · attendee.                                                                                                                                                   |
| Action / input     | No new deposit is needed. Click **Claim 40 demo token refund**.                                                                                                   |
| Expected result    | Sam balance 800 → 840. Button becomes **Refund already claimed**, disabled. Progress falls from 3/10 to 1/10; Robin has one remaining seat/20 tokens.             |
| Why / verification | The seeded Sam deposit returns once. Check **Refund claimed**, returned amount 40 and the disabled activation reason. This was browser-tested on the hosted site. |
| Reset              | Reset R.                                                                                                                                                          |

If you continue directly from Scenario B, Sam starts this fast example with **760**,
so the 40-token refund raises the balance to **800**. The refund amount stays 40.

## 6. Scenario D — create a workshop

| Item           | Instruction                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Goal           | Publish valid fixed terms and reject invalid input.                                                 |
| Starting state | Reset R, then open Create. Refresh Create for blank text fields.                                    |
| Page           | https://fuse-marketplace.vercel.app/create — **Create a demo booking**.                             |
| Role           | Select **Workshop organizer · organizer** in **Act as**. Other roles cannot use **Review booking**. |

Enter these values in the exact fields:

| Field                               | Value                                                     |
| ----------------------------------- | --------------------------------------------------------- |
| Workshop title                      | `A Sunday in clay`                                        |
| Description                         | `An introductory pottery session with a small group.`     |
| Location                            | `Yerevan · Makers Studio`                                 |
| Seat price · demo tokens            | `20`                                                      |
| Required seats                      | `10`                                                      |
| Activation deadline · UTC           | **10 October 2026, 12:00**; HTML value `2026-10-10T12:00` |
| Venue name                          | `Makers Studio`                                           |
| Instructor name                     | `Demo clay instructor`                                    |
| Venue allocation · demo tokens      | `80`                                                      |
| Instructor allocation · demo tokens | `120`                                                     |

The browser's date input may display day/month/year differently. Enter the date
and time parts, then check the review shows **10 Oct 2026, 12:00 UTC**. This date
is valid after Reset R even if the real computer date is later. The app compares
against the **simulated** 7 October clock. Do not use this date after advancing
the simulation beyond it; reset first.

1. Fill all ten fields. Check **Allocations: 200 / 200 demo token target**.
2. Click **Review booking**. **Review the fixed terms.** lists all terms.
3. Check title, deadline, suppliers and 80/120. Use **Keep editing** to correct
   anything before publishing.
4. Click **Publish demo booking**. It opens the new details page automatically.
5. With a fresh Reset R, its route is `/marketplace/workshop-101`. In a session
   with earlier actions, its number can differ. Copy the actual address shown.
6. Check **Open**, 0/10 seats, 0/200 tokens and both supplier approvals pending.
   The organizer is still selected. Switch to an attendee to fund it, or to the
   designated supplier role to approve. Supplier names are display labels; they
   do not create new selectable identities or real wallet accounts.
7. Refresh: the booking and deadline should remain. Open **Back to marketplace**,
   search `Sunday`, and click **A Sunday in clay** to reopen it.

| Validation test            | Exact action / input                                                                       | Expected result; rule and verification                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Missing text               | Before filling the form, as organizer click **Review booking**.                            | Five empty text fields show **This field is required.** No review or new booking.                                        |
| Wrong allocation total     | Fill the valid example but enter instructor allocation `121`. Click **Review booking**.    | **Both allocations must add up exactly to the funding target.** appears below venue allocation. Fix instructor to `120`. |
| Deadline not in the future | With the other valid values, set deadline to `2026-10-07T12:00`. Click **Review booking**. | **Choose a deadline after the simulated clock.** Fix it to 10 October, 12:00.                                            |

**Why:** Terms must be complete, amounts must be positive whole numbers, both
allocations must equal seat price × required seats, and the deadline must be after
the simulated clock. Published terms cannot be edited; there is no edit button.

**Verification:** All ten values, validation, publication, refresh and direct URL
were tested on the hosted site. A new private context could **not** open the custom
booking: it showed **This demo booking isn’t here.** This is expected. Publication
is local simulation, not a database listing or an on-chain campaign.

**Reset:** Use **Reset entire demo → Reset demo** on details, Create or My
commitments. A custom details page then shows **This demo booking isn’t here.**
Open Marketplace to see the five seeds again. Refresh Create to clear its form.

## 7. Scenario E — My commitments

| Item           | Instruction                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Goal           | Follow your own seats, locked deposits, supplier payments and refunds.                                          |
| Starting state | Reset R for the first check; use the exact B or C steps for later states.                                       |
| Page           | https://fuse-marketplace.vercel.app/my-commitments — **My commitments** or **All my commitments** from details. |
| Role           | Sam · attendee, then optionally Robin or Workshop organizer.                                                    |

1. After Reset R, open My commitments. It has five cards for Sam, including
   **Clay & company**: 2 funded seats, **Amount committed: 40 demo tokens**, and
   **Locked · until activation or expiry**. These are seeded deposits.
2. Open Clay details and perform B steps 2–4: contribute **2** seats for **40**.
   Click **All my commitments**. Clay now shows 4 seats, 80 tokens, **Waiting for
   approval** and **Locked · until activation or expiry**.
3. Use that card's **View booking** link. Finish B's approval and activation.
   Return to My commitments with Sam selected. Clay shows **Activated** and
   **Paid to suppliers · no refund**. The recorded amount stays 80.
4. Refresh My commitments. The same record stays present.
5. For a separate refund test, Reset R and perform C1 steps 1–4. Open My
   commitments as Sam. Clay shows **60 demo tokens to claim** and the link
   **Claim on details page**. The card does not execute a refund itself.
6. Follow that link, click **Claim 60 demo token refund**, and return. It shows
   **Refund completed**. The historical seat/amount record stays 3/60 even though
   the deposit has returned. Refresh to confirm it stays refunded.
7. Select **Workshop organizer · organizer**. It shows **No attendee commitments
   for this identity.** Supplier approvals do not appear as attendee deposits.
8. Select **Robin · attendee** to see Robin's own records. After only Sam's Clay
   refund, Robin's Clay card still has **120 demo tokens to claim**.
9. Reset R and select Sam. Five original cards return; Clay is back to 2 seats,
   40 tokens and a locked deposit. Custom bookings and new deposits are removed.

**Why:** Commitments belong to the selected mock participant. A deposit record is
kept after activation or refund, so the displayed **Amount committed** is not a
current spendable balance.

**Verification:** Hosted checks covered contribution, activation, eligible refund,
completed refund, refresh, role-specific empty state and reset.
**Reset:** Reset R; use the same hosted browser session for every linked step.

## 8. Scenario F — negative and rule tests

These tests show **simulation rules**, not smart-contract security. Use the normal
UI; do not remove disabled attributes or change browser storage. Some blocked
actions are disabled buttons with an explanation, not a pop-up error.

**Common page:** https://fuse-marketplace.vercel.app/marketplace/clay-and-company.

**Common reset:** Reset R before each independent test; do not reset your normal
browser's valuable work. All listed rejection states were checked through hosted
browser automation, or as part of the verified B/C journeys.

| Test / starting state                                                           | Role                                             | Action and input                                               | Expected rejection or disabled state                                                    | Why and how to verify                                                                                                                              | Reset                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| F1. Activate too early: Reset R, 8/10 seats                                     | Sam · attendee                                   | Look at **Activate booking** without adding seats.             | Disabled; **Waiting for 2 more funded seats.** and **Waiting for instructor approval.** | The funding target is not met. Progress stays 8/10; no receipt appears.                                                                            | R                      |
| F2. Funding without approval: complete B's 2-seat deposit, stop before approval | Sam · attendee                                   | Check **Activate booking** at 10/10.                           | Disabled; **Waiting for instructor approval.**                                          | Full funding does not replace supplier consent. No payout receipt.                                                                                 | R                      |
| F3. Wrong supplier: Reset R; instructor still pending                           | Select **Designated venue · venue**, or keep Sam | Try **Approve as instructor**.                                 | Disabled; **Switch to the designated instructor in Demo controls to approve.**          | Only that designated identity may approve that supplier. Instructor remains unapproved. Venue's own **Approved** button is already disabled.       | R                      |
| F4. Too many seats: Reset R; only 2 seats remain                                | Sam · attendee                                   | Enter `3` in **Seats to commit**.                              | **Review commitment** disabled; **That quantity exceeds the remaining seats.**          | Capacity cannot be exceeded. Balance remains 800; funding remains 8/10.                                                                            | Set quantity `2`, or R |
| F5. Invalid quantity: Reset R                                                   | Sam · attendee                                   | Try `0`, `-1`, `1.5`, then an empty **Seats to commit** field. | **Review commitment** disabled; **Choose a positive whole number of seats.**            | Users enter seat quantity, not an arbitrary token transfer. No balance change or new deposit. Some letters are refused by the number input itself. | Set quantity `1`, or R |
| F6. Activate twice: complete B                                                  | Sam · attendee                                   | Try **Booking activated**.                                     | Disabled; **This booking has already activated.**                                       | One activation/receipt. Supplier balances do not increase a second time.                                                                           | R                      |
| F7. Refund twice: complete C1 through Sam's refund                              | Sam · attendee                                   | Try **Refund already claimed**.                                | Disabled; **Your deposit has been returned. A second claim is blocked.**                | Balance stays 840 in C1; returned amount remains 60.                                                                                               | R                      |
| F8. Activate after expiry: Reset R → **Advance past deadline → Advance clock**  | Sam · attendee                                   | Try **Activate booking**.                                      | Disabled; **The activation deadline has passed. This booking cannot activate.**         | Expiry closes activation even if more approvals are later wanted. New contributions are also closed.                                               | R                      |
| F9. Refund an activated workshop: complete B                                    | Sam · attendee                                   | Try **Claim refund**.                                          | Disabled; **Activated bookings do not offer refunds in this version.**                  | Payout is final for this prototype. No refund record or balance increase.                                                                          | R                      |

For an extra source-confirmed funding check, reset, approve as the instructor
**before** adding the final two seats. Both approvals are then present but funding
is still 8/10, so activation remains blocked. **Source-verified; manual browser
verification required** for this exact additional order of actions.

Real on-chain enforcement is separate. Scenario G links actual failed transactions
for missing approvals, the wrong supplier signer, repeated activation, late
activation and repeated refund. The VM tests also cover funding without approvals,
approvals without funding, foreign refund attempts and rollback if a second
payout fails. VM results come from project tests, not invented Explorer signatures.

## 9. Scenario G — real Solana Devnet demonstration

### The words you need

| Word                  | Simple meaning in FUSE                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solana Devnet         | A public Solana network for testing. Transactions are real network records, but its tokens are test assets.                                                 |
| Devnet SOL            | Free test SOL used to pay test transaction fees and account costs. It has no monetary value. Never send Mainnet SOL to this demo.                           |
| SPL test token        | A custom token made using Solana's token program. FUSE's proof uses a valueless token, not USDC.                                                            |
| Program ID            | The public address of FUSE's deployed escrow code. It is not a wallet recovery key.                                                                         |
| Escrow account        | The campaign's token vault. The program controls transfers under the campaign's fixed rules.                                                                |
| Supplier approval     | A signature from the designated venue or instructor agreeing to that campaign's terms. A caller cannot approve for a different supplier.                    |
| Activation            | A signed transaction that checks full funding, both approvals and time, then pays both fixed allocations together. Any valid signing caller can trigger it. |
| Expiry refund         | After an unactivated campaign's deadline, the contributor signs to claim their own deposit once. It is not an automatic payment.                            |
| Transaction signature | A public identifier for one actual transaction. Explorer can show its result, signers, instructions and token changes.                                      |

Devnet may have rate limits or ledger resets. Test SOL comes from a faucet for
testing, not from buying real SOL. See [Solana's official network guide](https://solana.com/docs/references/clusters).

### G1. Read and explain genuine evidence — no wallet or new transaction needed

| Item           | Instruction                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Goal           | Show actual public transactions and separate old evidence from live accounts.                                |
| Starting state | Internet access. The old success campaign is already Activated and the old refund campaign is FullyRefunded. |
| Page           | https://fuse-marketplace.vercel.app/onchain-demo                                                             |
| Role           | No mock role. No wallet is needed for evidence or live reads.                                                |

1. Open the exact page. The title should be **Solana Devnet — Real Program
   Transactions** and the notice should describe real test-network transactions.
2. Find **Verified Devnet evidence · historical**. These are earlier recorded
   transactions, not actions performed in this session. This panel works even
   when the app's RPC read fails. Explorer has its own availability limits.
3. Find **Solana Devnet · current live state**. Confirm RPC
   `https://api.devnet.solana.com` and program ID
   `6R4NM7PX1jy2E3BhLohh2eoQaF2ubkwW6iNrmgYGViHf`.
   Click **Inspect program on Devnet Explorer**. Explorer must select Devnet.
4. If RPC is available, inspect **Campaign from the validator** under **Workshop
   escrow**. Select success address `27B58GeSQGbAtbud878jTxEcYujxwPycB2kwp4uxD6Fx`.
   Check **Activated**, **Actual escrow token balance: 0 valueless Devnet test
   tokens**, supplier approvals and the 80/120 allocations.
5. Select expired/refunded address `iJmKPiLcjdnBjtZ9uG1ZrASP8NXy2vjAs3EAfNhRaEL`.
   Check **FullyRefunded** and zero escrow. These current states were read on the
   hosted site during testing. Future public-chain changes are possible.
6. Click **Refresh on-chain state** to reread accounts. This is a snapshot at the
   last successful refresh, not continuous account polling. The program's Clock
   comes from the blockchain. On-chain date displays use your browser timezone;
   simulation deadlines use UTC.
7. Return to the historical panel. Open **A: Deposit eight seats**. In Explorer,
   check success, the FUSE program and the transfer into the campaign vault.
   Open the **final two seats** link in the evidence table below too; that link
   is in this guide, not a separate button in the page's six-item panel.
8. Open **A: Authentic venue approval**, then **A: Authentic instructor approval**.
   Inspect the signing accounts and instructions. These are real supplier
   signatures, not mock **Act as** choices.
9. Open **A: Full funding alone cannot activate**. Explorer shows an actual failed
   transaction. The saved program error is **6010**, `MissingApproval`.
   A failed transaction is useful evidence of enforcement; it is not a successful payout.
10. Open **A: Activate and pay suppliers**. Check success and token balance changes:
    vault **200 → 0**, venue **+80**, instructor **+120** test tokens. Do not use
    today's total supplier balances as the amount paid by this one transaction.
11. Open **B: Contributor claims own refund**. The contributor signed a real
    40-token refund after expiry. Check the transfer and empty vault. The recorded
    contributor balance was 800 at that checkpoint; later deposits changed it.
12. Use the additional failed-transaction links below to show that an unrelated
    signer, repeated activation, late activation and repeated refund were rejected.
    Do not claim that every VM edge case has an Explorer transaction.

**Why:** A public program enforces the rules with actual signatures and token
transfers. Full funding alone cannot pay suppliers. Both payouts must succeed
together, and expired deposits return only to their signing contributor.

**Verification:** Hosted account/Explorer-link checks passed. The existing public
receipt verifier checks all 26 recorded transactions, signers and exact token
changes. Explorer is independent evidence; test assertions and JSON summaries
are the project's own interpretation and must agree with the transaction metadata.
Explorer's own page layout was not exercised by these hosted UI tests:
**Source-verified; manual browser verification required.** Open and inspect the
linked Explorer pages before recording; the transactions themselves were rechecked
through the read-only public RPC verifier.

**Reset:** No chain reset is available or needed. A page reload or **Refresh
on-chain state** rereads data. **Reset entire demo** only resets the separate
simulation; it cannot reset, activate or refund these Devnet accounts.

### Exact Explorer evidence from `docs/devnet-proof.json`

All links below explicitly select Devnet. Some are linked by the page; the others
are direct guide links. They all have real signatures in the committed proof.

| Evidence                                 | Explorer link                                                                                                                                                                      | What to check                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Create success campaign                  | [A: Create successful workshop](https://explorer.solana.com/tx/4CzkFFbR8YXEAfqbqhTMXNSscE9Yc4kZpLtfoJh9dqUzWy7u7rDFojQnPSFvoo6o1iKBZGHk7heY7BA5QZCtyVpa?cluster=devnet)            | Successful campaign creation.                                                           |
| First deposit                            | [A: Deposit eight seats](https://explorer.solana.com/tx/23vYPTx5Qtkk25QX7yEwmPvbsg3dwc6eCr1mCt7rDY4znxN2idyu5QmiGHRq1Wf6Ud9Mt8xBjJ2Ax6gSUrQYR6is?cluster=devnet)                   | 160 test tokens into the vault.                                                         |
| Final deposit; guide link                | [A: Deposit final two seats](https://explorer.solana.com/tx/64ykrHR6t6Z9BX5YbCAHwKwabnXCipQUvafmr2dzJwHYSVbMbVvDt4ZsNvwBaBw3NzHVDp39rpAXi2pTVShBE8Tz?cluster=devnet)               | 40 more test tokens; total 200.                                                         |
| Full funding is not enough               | [A: Full funding alone cannot activate](https://explorer.solana.com/tx/ymb7vd69zD6RfnqcowR7nZQVCXe4QUrNN1zptoAAhnVoxZzRJRgCy1FsqbHLB2XJRiY54uFBwRphreSBnF4sHk7?cluster=devnet)     | Failed; custom error 6010.                                                              |
| Wrong supplier signer; guide link        | [A: Unrelated signer cannot approve venue](https://explorer.solana.com/tx/4EqGawoCB3qTJesRW7SshjT2ZyncMLYC3U1mkKAot4zsQ2ciFhpPB2tbsRHRLK7q8wJ8HXaAutJFjZSGpNeXMuuD?cluster=devnet) | Failed; custom error 6005, `UnauthorizedSupplier`.                                      |
| Venue approval                           | [A: Authentic venue approval](https://explorer.solana.com/tx/5TLxk2dbHhC1uZ2YxQ61xuHvZNs4aWVLNsnGVHgkUy6a26W6pMM8JTV7cnbAZUGSnbqQuLJ5sZ7PHzYXoYUsX4F7?cluster=devnet)              | Venue signer `Fwq6aw1eHwAQF7muZYm3pwnA54dqCzfSSr9G95RiFcBW`.                            |
| One approval is not enough; guide link   | [A: Instructor approval still required](https://explorer.solana.com/tx/2zu2Y2tkXFUGAk1NfwLfDJVS1W6oxkN1BTyXwFsmBW34x6A8fwRHKJUBuxv6GiFtSLmrzLvcw5dTT2S4WJJPpYGj?cluster=devnet)    | Failed; custom error 6010.                                                              |
| Instructor approval                      | [A: Authentic instructor approval](https://explorer.solana.com/tx/23RoQ9mXRstbj6kqD1BhGySiDhS8oiPSvnBkEfX2Udpszg3M192eBbwDeNTLnAC79XJJVxEUytht93qKiXynPzD9?cluster=devnet)         | Instructor signer `8yJw9NL8JWrrnrjbuHgiyKUFoySXHq4rNY86u6ZTmCMA`.                       |
| Exact payouts                            | [A: Activate and pay suppliers](https://explorer.solana.com/tx/VupNM2JCgV11zMHxMwugadGpoDLKxY9pb4iEWzPwDoWotnFtnAx2nEiybrUJtbfZcM4N6ua4H82hZ8yMsA1yBHc?cluster=devnet)             | Successful; venue +80, instructor +120, vault 0 afterward.                              |
| Cannot activate twice; guide link        | [A: Repeated activation rejected](https://explorer.solana.com/tx/58eVfeAeRBX6aJTr9vKiri8bWsA9HtGFE7sj45T3cnzpQFPQiraijSuzcRGQMkLA19wfvU59t4xQ81ezmRxbYMDa?cluster=devnet)          | Failed; custom error 6007, `CampaignTerminal`.                                          |
| Refund campaign deposit; guide link      | [B: Deposit two seats](https://explorer.solana.com/tx/51XSMdoEh4YRsxbhioYurxFYsSGpgBTz7JpDHCTKVHtk89B4eZbbwm5F8u3Q7oxQDs1G6iWqkbEXaTyzoBngfTns?cluster=devnet)                     | 40 tokens into a different campaign's vault.                                            |
| Deadline enforced; guide link            | [B: Activation after deadline rejected](https://explorer.solana.com/tx/dehGuZ4EpB6A2sKTPdatmVK5ZvyJTSLakr6iPGiJGNoWTxWMHo1tFTdHN2kzv6NeCcUiGQLQFxdBDQY38fbr79Y?cluster=devnet)     | Failed; custom error 6008, `DeadlinePassed`.                                            |
| Own expiry refund                        | [B: Contributor claims own refund](https://explorer.solana.com/tx/bFfpECuSegdvNPVuRJjvK8BkMdyiu5qWbEDZKTrMCLHNFiDmP4bpYy5RLpkJZz6gxMAaE5Qd5YULnE89B9XvdKu?cluster=devnet)          | Contributor signer `ALHGXdPnkMh7e4F87k8Df2HwkKrgMZY4n9LHmXg79xu2`; +40 tokens, vault 0. |
| Cannot refund twice; guide link          | [B: Repeated refund rejected](https://explorer.solana.com/tx/TQUxKL5ULBWbFQLdSSmFmSh8BiQTRF1meTNqB27dJLP2tUdaUAUTsUjqrBS3wJqV6SWMPKkMfncb8icoujtyBo8?cluster=devnet)               | Failed; custom error 6014, `AlreadyRefunded`.                                           |
| Cannot activate after refund; guide link | [B: Activation after refund rejected](https://explorer.solana.com/tx/2mVPfvBnbHxzvQMQmvYmE657quetkoL2QFFBk3UctxpEqN1NfzrMYCb7aok5RKVt8UVC8cLmF3UQuiRDiPLjkH7n?cluster=devnet)      | Failed; custom error 6007.                                                              |

The proof's token mint is
[`DN23AC8vHB9ySZaZnWjpfg8fPduJ7VnToihugpUAGGv2`](https://explorer.solana.com/address/DN23AC8vHB9ySZaZnWjpfg8fPduJ7VnToihugpUAGGv2?cluster=devnet),
with six decimals. 200 tokens = 200,000,000 base units; 80 = 80,000,000; 120 =
120,000,000; 40 = 40,000,000. Explorer may show an unknown token name; the mint
and exact amounts identify it. Inspect decoded instructions, logs and token balance
changes. Explorer layout may change; there is no required custom FUSE token logo.

The page also links
[Earlier wallet-signed browser activation](https://explorer.solana.com/tx/52oem6FJaMA2yfn1LJR9qdetCEuui4Bup5H9GNMDGA59bRBPg1zMV1Rd85Gt2ZcnfEndpKewmCDxEv88DPHC7PXC?cluster=devnet).
Its source is `docs/devnet-browser-proof.json`. A test-only wallet provider used a
real disposable signer and paid another exact 80/120. This is genuine earlier
browser signing, but it does **not** prove compatibility with an installed Phantom
extension. Do not describe it as a transaction performed during this recording.

### G2. Optional installed-wallet connection — no new transaction required

**Source-verified; manual browser verification required** with your actual installed
wallet. Automated tests used a test provider, not your extension.

| Item           | Instruction                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Goal           | Check that your compatible wallet connects on Devnet and disconnects safely.                                   |
| Starting state | A separate disposable wallet; its extension must expose Solana Wallet Standard and legacy transaction signing. |
| Page           | https://fuse-marketplace.vercel.app/onchain-demo                                                               |
| Role           | Your real disposable wallet account. Mock participant roles do not apply.                                      |

1. Create a **new disposable wallet** in a separate browser profile. Do not import
   your deployment authority or a funded Mainnet wallet. Keep its recovery phrase
   private; no website needs it for this test.
2. For Phantom, open the avatar → **Settings → Developer Settings → Testnet Mode**,
   enable it and select **Solana Devnet**. Check the testnet banner. If your
   installed version lacks these settings, use a compatible wallet. See
   [Phantom's official instructions](https://help.phantom.com/articles/5997313271699).
3. On FUSE, under **Your signing wallet**, choose the extension in **Wallet Standard
   wallet**. Click **Connect wallet** and approve connection for the disposable account.
4. Compare **Connected address** with the wallet's public address. Check Devnet in
   both FUSE and the extension. A **Wallet network mismatch** warning must block
   activation. The app also checks the RPC genesis hash and program address.
5. Click **Disconnect wallet**. The connected address should disappear. Reconnect,
   then revoke access in the extension and check that the page disconnects too.
   These event/UI paths passed with the test provider; your extension still needs
   this manual check.

**Expected result / why:** Only the authorized compatible account is used for
signing. Disconnecting removes its current activation permission. Existing
transaction evidence is still historical evidence, not proof of a new wallet action.

**Verification:** Record wallet/version, browser, URL and connection/disconnection
result. **Reset:** Disconnect. There is no need to reset the simulation or chain.

### G3. Optional real activation — not needed to complete this guide

**Source-verified; manual browser verification required** for a new transaction
with an installed wallet. Do not start this during an unrehearsed recording.

| Item           | Instruction                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Goal           | Sign the browser's supported activation action, only if an eligible campaign already exists.                                                                                   |
| Starting state | Manually verified Devnet wallet, free test SOL for fees, current live RPC, and a campaign still funded, approved and before deadline. Do not create a campaign for this guide. |
| Page / role    | `/onchain-demo`; your disposable Devnet wallet, not a mock role.                                                                                                               |
| Input          | **Campaign from the validator**: choose a real current ready campaign by its full address.                                                                                     |

1. If needed for this optional test, obtain free **Devnet** SOL manually from the
   [official faucet](https://faucet.solana.com). Enter only the disposable public
   address and choose Devnet. Faucet limits are normal. Do not buy real SOL.
2. Select a campaign, inspect its current balance, approvals and deadline, and
   click **Refresh on-chain state**. `docs/devnet-recording-fixture.json` records
   prepared address `GGxZfke5dHeFFCv6V5BVRG6Ur6kvqC86giKLzyk8ZXRT`, but its old
   **statusAtPreparation** is not proof that it is still ready now. Do not assume
   that file's preparation state is current.
3. If it is ready, click **Activate with my wallet**. Review **Review real devnet
   activation**, the actual allocations, network, deadline, campaign and signer.
4. Click **Sign real activation**. Review and approve the wallet prompt. The caller
   pays the test SOL fee; no test-token balance is needed just to trigger activation.
5. Wait for **Confirmed — activation executed on Solana Devnet.** Open the displayed
   transaction link. Check success and the exact token changes; refresh live state.
   It should be **Activated** with the agreed payouts released.
6. If the result is **Failed or unconfirmed**, inspect any submitted signature
   before another attempt. Do not claim success or keep signing blindly.

If the campaign is already Activated/FullyRefunded, the button is disabled and
the page says **This campaign is already settled or refunding.** If an Open
campaign's deadline passed, it says **The activation deadline has passed.** This
is correct. A one-use campaign cannot be kept activatable forever. Use G1's
historical proof instead; no new campaign or test-SOL expense is required.

**Why / verification:** The contract rechecks conditions at execution. Verify a
new signature in Explorer and current accounts; a pending wallet prompt is not
confirmation. **Reset:** You cannot undo activation. Disconnect and use historical
evidence for another demonstration. This guide does not ask you to create a fixture.

### Browser actions versus CLI actions

| Action                        | Simulated browser              | Real Devnet browser                             | Existing developer scripts                  |
| ----------------------------- | ------------------------------ | ----------------------------------------------- | ------------------------------------------- |
| Create campaign/booking       | Yes, `/create`, local only     | No                                              | Yes                                         |
| Deposit tokens / commit seats | Yes, attendee role             | No                                              | Yes                                         |
| Supplier approval             | Yes, designated mock role      | No                                              | Yes, actual supplier signatures             |
| Activation                    | Yes, **Activate booking**      | Yes, **Activate with my wallet**                | Yes                                         |
| Claim expiry refund           | Yes, own mock deposits         | No                                              | Yes, contributor signature                  |
| Advance time / reset          | Yes, simulation only           | No                                              | No override of public chain time            |
| Read accounts and history     | Simulated local state/activity | Yes, RPC and historical links                   | Yes                                         |
| Request free SOL              | Not applicable                 | No automatic Devnet request; manual faucet link | Separate test setup exists; not needed here |

`anchor/scripts/devnet.sh scenarios` writes new test transactions and replaces
the latest proof file; `prepare-browser` creates a fresh fixture. Do **not** run
them just to follow this guide. The read-only developer command `verify` checks
existing receipts, and existing VM tests check compiled program rules. See the
[architecture](escrow-architecture.md), [recording guide](demo-recording-guide.md)
and [release report](final-release-report.md) for these technical results.
Localnet is a separate local validator option, not the hosted Devnet service;
its **Request local test SOL** button does not exist in Devnet mode.

## 10. Scenario H — refresh, mobile and errors

| Item           | Instruction                                                                            |
| -------------- | -------------------------------------------------------------------------------------- |
| Goal           | Check persistence, direct links, small screens and honest failure states.              |
| Starting state | Disposable browser session. Prepare B or C only when that row needs it.                |
| Page           | Exact page is listed for each row below.                                               |
| Role           | Sam for simulation; disposable real wallet for the wallet row; none for reading proof. |

| Test                       | Page, exact action and input                                                                                                                                                                                   | Expected result, reason and verification                                                                                                                                                                                                                                                                       | Reset                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Refresh                    | After B, refresh Clay details and My commitments. After C, refresh the refunded card.                                                                                                                          | Approvals, deposits, receipt, refund and clock remain. Browser localStorage saves the simulation under `fuse-demo-v1`.                                                                                                                                                                                         | R for another scenario.                                                           |
| New private session        | Close all private windows after testing, then open a new one at the hosted site.                                                                                                                               | Fresh seeds, Sam balance 800. Private data is separate from normal browsing and is removed when that private session ends.                                                                                                                                                                                     | Close only the disposable session.                                                |
| Seed direct URL            | Type `/marketplace/clay-and-company` after the hosted domain.                                                                                                                                                  | Clay opens directly; no visit to Home is needed. Hosted route tests passed.                                                                                                                                                                                                                                    | R if you changed state.                                                           |
| Custom direct URL          | Create D, copy its actual URL, refresh it in the same session; open it in a separate fresh context.                                                                                                            | Same session retains it. Another context shows **This demo booking isn’t here.** Local publication is not shared hosting data.                                                                                                                                                                                 | R removes the custom record.                                                      |
| Mobile navigation          | Resize browser to about 375 pixels wide. Open `/`, Marketplace, Clay, Create, My commitments and `/onchain-demo`. Use **Open navigation → About**.                                                             | No horizontal page overflow. Menu opens and closes after navigation. Inputs and buttons remain reachable by scrolling. Hosted Chrome checks passed at 375, 768 and 1440 pixels.                                                                                                                                | Return to desktop width; close the menu.                                          |
| Real phone                 | Open the public site on your own phone and use the same routes/menu.                                                                                                                                           | **Source-verified; manual browser verification required.** Desktop width emulation does not prove touch, Safari, Firefox or mobile-wallet compatibility.                                                                                                                                                       | Close only that test session.                                                     |
| Wallet disconnect          | G2: **Disconnect wallet**, then separately revoke app access in the extension.                                                                                                                                 | Address disappears; no current wallet activation permission. Test-provider paths passed; installed wallet remains manual.                                                                                                                                                                                      | Disconnect; do not reset the chain.                                               |
| Unavailable Devnet RPC     | Open `/onchain-demo`; if an error occurs naturally, leave it visible. To simulate deliberately, use a separate test window's browser developer tools to block `https://api.devnet.solana.com/*`, then refresh. | **Devnet RPC unavailable or invalid.** appears. No live escrow balance should remain substituted. Historical proof links stay visible. Exact browser-tool controls vary: **Source-verified; manual browser verification required** for this manual blocking method. Automated request blocking already passed. | Remove the blocking rule; **Refresh on-chain state**.                             |
| Devnet HTTP 429            | Do not cause rate limits by flooding the network. If one occurs, wait, then use **Refresh on-chain state**.                                                                                                    | Client paces calls and makes at most two retries for each 429 response. **The free Devnet RPC is busy. Wait briefly and refresh. Check any submitted signature before retrying.** appears if retries fail. Automated 429 interception passed; no public flood was sent.                                        | Wait, then refresh; inspect an existing submitted signature before signing again. |
| Old transaction versus new | On `/onchain-demo`, compare **Verified Devnet evidence · historical**, live account snapshot and **Actual campaign transactions**.                                                                             | Static proof links remain old evidence. RPC history is the latest confirmed records, refreshed about every 15 seconds; it may lag indexing. Only an actually submitted wallet transaction is a new attempt.                                                                                                    | Reload/read; no chain reset.                                                      |
| Whole simulation reset     | On Clay, Create or My commitments: **Reset entire demo → Reset demo**.                                                                                                                                         | Five seeds, original clock and balances return. Custom records disappear. Devnet proof/accounts do not change.                                                                                                                                                                                                 | This is Reset R; keep it limited to your test session.                            |

**Why:** Saved local records, public blockchain state and network availability are
different things. A disabled action can be correct even when the page is working.
**Verification:** Use the exact expected state in each row; record which browser,
URL and starting state you used. **Reset:** Follow the row's reset, not a chain reset.

### Is it a bug or an expected limit?

| Observation                                                                            | Meaning / next step                                                                                                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fully funded but instructor missing                                                    | Expected. Approve as the designated instructor in the simulation.                                                                                                         |
| Activated campaign cannot activate/refund                                              | Expected one-time settlement. Use a reset only for simulation, or historical proof for Devnet.                                                                            |
| Date is past in real life, but simulation is Open                                      | Expected frozen demo clock. Read **Simulated clock · frozen**.                                                                                                            |
| Refund decreases the funding bar but keeps My commitments amount                       | Expected. The bar counts unrefunded seats; the card keeps the original deposit record.                                                                                    |
| Custom workshop missing in another browser                                             | Expected localStorage boundary. Use a seed URL for sharing.                                                                                                               |
| Public RPC busy/unavailable, historical proof visible                                  | Expected network limitation if the error is clear and live balances are cleared. Wait or use preloaded Explorer tabs.                                                     |
| No compatible wallet detected                                                          | Extension absent, private-mode access disabled, or required features unavailable. It is not proof that the escrow failed. Test in an appropriate separate wallet profile. |
| Invalid saved state gives a fresh-demo notice                                          | Intended recovery. A browser-storage error uses session-only changes; refresh may lose them.                                                                              |
| Payout occurs without all conditions, payout repeats, or a foreign deposit is returned | A serious bug. Stop recording and capture the URL, mock role, starting state and steps. Do not try to cover it up.                                                        |
| Old deployment wording remains on hosted Home/About                                    | The hosted frontend still needs this copy-polish release. Confirm the deployed commit and publish the reviewed release before recording.                                  |

## 11. What was actually verified

The hosted journey checks below ran before final copy polish. After the copy
corrections, the local release passed **41 unit tests**, **13 existing browser
tests**, TypeScript, lint and the production build. An accounting audit confirmed
800 → 780 → 840 and conserved all 2,500 seeded tokens. No accounting code changed.

| Check in this task                                | Result                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing hosted browser regression suite          | 13 passed: success, expiry/refund, creation, storage recovery/fallback, keyboard dialog behavior, seven routes at three widths, RPC outage/429, test-wallet disconnect.                                                                                                                 |
| Additional hosted guide checks                    | 6 passed: every seed filter/search/hero, exact C1 and C2 balances, role restrictions and invalid quantities, Sam activation/commitments, all ten create inputs, deadline/allocation validation, isolated custom URL and the continuous recording sequence without a mid-scene reset.    |
| Hosted Devnet read-only browser subset            | 2 passed: real state/Explorer links/refresh and wrong-network blocking. No signing or wallet funding.                                                                                                                                                                                   |
| Existing unit tests                               | 41 passed: simulation domain/storage, generated Solana interface and RPC transport rules.                                                                                                                                                                                               |
| Public transaction verifier                       | Passed: all 26 existing records, exact 80/120 payouts and 40-token refund, supplier/contributor signatures, zero settled vaults and the earlier browser activation. No new transactions.                                                                                                |
| Hosted versus local source                        | Before final copy polish, no behavioral difference was found in tested journeys, labels, seed data or historical links; the old Home/About copy existed in both. This release corrects local copy and needs a Vercel deployment. The UI does not establish the exact deployed Git hash. |
| Installed wallet / new Devnet browser transaction | **Source-verified; manual browser verification required.** No new Devnet transaction was required or submitted.                                                                                                                                                                         |
| Physical phones, Safari and Firefox               | **Source-verified; manual browser verification required.** Only desktop Chrome with width changes was exercised here.                                                                                                                                                                   |

The prior release ran 20 blockchain VM tests for each program-address variant.
Those results are recorded in the release report and the Rust test source; they
are not a new VM run in this documentation task. There was no dependency reinstall,
new Devnet campaign, test-SOL spend, program deployment, automatic push or merge.
