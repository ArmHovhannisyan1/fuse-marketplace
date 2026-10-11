# FUSE: a truthful three-minute live demonstration

Website: **https://fuse-marketplace.vercel.app/**

Checked: **11 October 2026**. Read the [user testing guide](FUSE-USER-TESTING-GUIDE.md)
first. Use the [QA checklist](FUSE-FINAL-QA-CHECKLIST.md) before recording.

This recording has three parts: an interactive **simulation**, **earlier genuine
Solana Devnet evidence**, and a simulated expiry refund. We do not send a new
blockchain transaction during this script. No wallet is needed.
The continuous hosted simulation sequence, including the 760 → 800 refund balance,
passed browser automation. The public verifier rechecked the genuine Devnet records.
Explorer's visual layout still needs a manual preflight:
**Source-verified; manual browser verification required.**

## Divide the work

- **Teammate A: operator.** Click, type, switch tabs and keep the right mock role.
- **Teammate B: speaker.** Read the short lines below and watch the timing.

Both people should practise the operator's steps. Use one computer for recording.
Simulation changes on a second person's computer do not appear on the first.

## Prepare before the timer starts

1. Open a disposable browser session at the public website. Keep all demonstration
   tabs in that same session. Do not reset a normal session with work you want to keep.
2. Open these tabs, in this order:

   | Tab | Exact page                                                                            | Use                                                |
   | --- | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
   | 1   | [Home](https://fuse-marketplace.vercel.app/)                                          | Opening hero                                       |
   | 2   | [Marketplace](https://fuse-marketplace.vercel.app/marketplace)                        | Five starting workshops, then Clay                 |
   | 3   | [Real Devnet page](https://fuse-marketplace.vercel.app/onchain-demo?network=devnet)   | Historical evidence, then current blockchain state |
   | 4   | [Made from wood](https://fuse-marketplace.vercel.app/marketplace/weekend-woodworking) | Already-expired refund                             |

3. In Tab 2, open **Clay & company**. Under **Demo controls**, click **Reset entire
   demo → Reset demo**. Check **Act as → Sam · attendee**, balance **800**, funding
   **8 of 10 seats**, **160 of 200 demo tokens**, venue approved and instructor pending.
   Return Tab 2 to Marketplace. Do not reset again during the timed run.
4. In Tab 3, confirm **Solana Devnet** and program
   `6R4NM7PX1jy2E3BhLohh2eoQaF2ubkwW6iNrmgYGViHf`. In the section
   **Verified Devnet evidence · historical**, open these links in extra tabs:
   **A: Full funding alone cannot activate**, **A: Activate and pay suppliers**,
   and **B: Contributor claims own refund**. Let Explorer load before recording.
   The [user guide's proof table](FUSE-USER-TESTING-GUIDE.md#exact-explorer-evidence-from-docsdevnet-proofjson)
   has direct links and more evidence if needed.
5. Below the historical section, find **Solana Devnet · current live state**.
   In **Campaign from the validator**, choose the successful campaign beginning
   `27B58GeS`. Check **Activated** and escrow **0 valueless Devnet test tokens**.
   A settled campaign is the expected live state. It is not a fresh activation.
6. Check Tab 4 is **Made from wood**, status **Expired — refunds available**. Do
   not claim the refund yet. Do not advance the global clock for this short script.
7. Use a desktop window. Set browser zoom so the funding, supplier section and
   activation controls are easy to read. Scroll before the recording to learn their
   positions. Close unrelated tabs and extension popups.
8. Rehearse once, then repeat step 3 to restore the seeds before the real take.
   The reset affects every simulation tab. Refresh Tab 4 if it has not updated.

The final copy polish corrects Home/About's old deployment wording and scopes the
notice/footer to the marketplace simulation. Before recording, confirm the public
website has deployed this release. If it still shows the old wording, wait for the
owner-managed Vercel deployment. Explain the simulation and separate Devnet proof
as two demonstrations.

## The timed script

The spoken lines below fit comfortably inside three minutes. Pause briefly to let
the viewer see each result. The visual result matters more than rushing a click.

### 0:00–0:20 — introduce the problem

**Page:** Tab 1, `/`. **Identity:** no role change; Sam remains selected globally.

**Clicks / input:** Keep **Commit together. Make it happen.** visible. Point to
**Try the workshop demo** and **Explore marketplace**; switch to Tab 2.

**Expected visual:** Home hero, then the five marketplace cards.

**Say:** “A workshop needs paying attendees, a venue and an instructor. Money alone
does not secure the people. FUSE brings these commitments together. First, we will
show the interactive simulation. Then we will show genuine transactions from our
deployed Solana Devnet program.”

**If it fails:** Open the exact Marketplace URL. If the hosted site cannot load,
stop the take and restore access. A prepared screenshot can illustrate the product,
but label it as a screenshot rather than a working live page.

### 0:20–0:45 — show the workshop terms

**Page:** Tab 2, `/marketplace`, then `/marketplace/clay-and-company`.
**Identity:** **Sam · attendee**.

**Clicks / input:** Click the **Clay & company** title. Show the funding panel and
**The people behind the workshop.** Read the seat price, target and allocations.

**Expected visual:** **8 of 10 seats funded**, **160 of 200 demo tokens**, 20 per
seat, venue approved, instructor pending. **Activate booking** is disabled; the
reason is **Waiting for 2 more funded seats.**

**Say:** “Clay & company needs ten seats at twenty tokens each: two hundred total.
Eight seats are funded. The venue has approved, but the instructor has not. The
agreed payouts are eighty to the venue and one hundred twenty to the instructor.”

**If it fails:** A different seed state usually means an earlier rehearsal was
saved. Stop, use **Reset entire demo → Reset demo**, check Sam and 8/10, then restart
the take. Do not silently substitute another campaign.

### 0:45–1:20 — fund the last seats, then obtain approval

**Page:** Same Clay details page. **Identities:** Sam, then designated instructor.

**Clicks / input, in order:**

1. In **Seats to commit**, type **2**.
2. Click **Review commitment**. Show **Review your commitment.** and 40 demo tokens.
3. Click **Confirm 40 demo tokens**.
4. Point to **10 of 10 seats funded**, **200 of 200 demo tokens**, and **Waiting for
   approval**. Show disabled **Activate booking** and **Waiting for instructor approval.**
5. In **Act as**, select **Designated instructor · instructor**.
6. Click **Approve as instructor**. Show **Approved** and **Ready to activate**.

**Expected visual:** Sam's balance changes **800 → 760** after the deposit. Full
funding does not activate the booking. Instructor approval changes its readiness.
Mock role selection is not wallet authentication.

**Say:** “Sam commits the final two seats. The booking is fully funded, but payout
is still blocked because the instructor has not approved. We switch to the mock
instructor and approve the terms. Now every condition is met.”

**If it fails:** Check the exact role and quantity. A disabled approval while acting
as Sam is expected. If you already confirmed a deposit, inspect the funding before
trying again. If the state is unclear, stop and restart from a reset.

### 1:20–1:45 — activate and show the fixed payout

**Page:** Same Clay details page. **Identity:** keep **Designated instructor ·
instructor** selected. Any mock identity can activate a ready booking.

**Clicks / input:** Click **Activate booking**. Show **Bring the booking together.**
and the 80/120 review. Click **Confirm activation**. Scroll to **Simulated payout
completed** and **Venue: 80 · Instructor: 120 demo tokens**. Show disabled **Booking
activated** and **This booking has already activated.**

**Expected visual:** Status **Activated**. One payout receipt. No second activation.
Supplier totals now include the earlier seed payout: venue **160**, instructor
**240**. The receipt's **80/120** is this booking's payout.

**Say:** “Activation releases the agreed eighty and one hundred twenty together.
The booking is activated, and it cannot pay twice. These clicks use demo tokens in
browser storage. They did not send a Solana transaction.”

**If it fails:** Read the activation reason; do not claim success while a condition
is missing. If the receipt was already present, it came from an earlier action.
Restart the take from reset for an honest before-and-after demonstration.

### 1:45–2:25 — transition to genuine, historical Devnet proof

**Page:** Tab 3, `/onchain-demo?network=devnet`, then prepared Explorer tabs.
**Identity:** no wallet connection; mock identities have no role here.

**Clicks / input:**

1. Show **Verified Devnet evidence · historical**, **Solana Devnet** and the program ID.
2. Point to **A: Authentic venue approval** and **A: Authentic instructor approval**.
3. Switch to the prepared **A: Full funding alone cannot activate** Explorer tab.
   Show the failed result. Error **6010**, `MissingApproval`, protects the approval rule.
4. Switch to **A: Activate and pay suppliers**. Show its successful result and token
   transfers: venue **80**, instructor **120**. Raw amounts are 80,000,000 and
   120,000,000 base units because this test token has six decimals.
5. If time permits, return to FUSE's separate **Solana Devnet · current live state**
   section: the same successful campaign is **Activated**, with an empty vault.

**Expected visual:** Real Devnet signatures and Explorer records. Historical proof
is labelled separately from the RPC account snapshot. The failed transaction is
actually recorded on-chain; it is not just a disabled frontend button.

**Say:** “Now we move from simulation to earlier real Solana Devnet transactions.
Our deployed program rejected activation when approvals were missing. After both
suppliers signed, this confirmed transaction paid the exact eighty and one hundred
twenty. These are valueless test tokens. This is verified history, not a transaction
we just sent.”

**If it fails:** If live RPC is busy, keep the error visible and use the preloaded
Explorer records; say that current account reads are unavailable. If Explorer is
also unavailable, show the historical links and the checked-in proof report, saying
that the report was independently rechecked before recording. Do not describe an
unloaded Explorer page as visible proof. Stop and retry later if external inspection
is central to the take. Do not create a new Devnet campaign for the recording.

### 2:25–2:45 — show the expiry refund

**Page:** Tab 4, `/marketplace/weekend-woodworking`. **Identity:** select **Sam · attendee**.

**Clicks / input:** Show **Made from wood**, **Expired — refunds available**, and
disabled **Activate booking**. Click **Claim 40 demo token refund**. Show **Refund
already claimed** disabled and Sam's **Balance: 800 demo tokens**.

**Expected visual:** Sam held **760** after funding Clay. This separate workshop's
seeded 40-token deposit returns, so **760 → 800**. No reset occurred between the
two scenes. Only Robin's one seat / 20 tokens remains here; the workshop is still
**Expired — refunds available**, not Fully refunded.

**Say:** “Back in the simulation, this workshop expired without activation. Sam
claims the forty tokens already deposited here. The balance returns from seven
hundred sixty to eight hundred, and a second refund is blocked. The Devnet page
also links an earlier real contributor-signed expiry refund.”

**If it fails:** Check that **Sam · attendee** is selected. A refund button can be
absent for a supplier role or disabled after an earlier claim. Stop and reset for a
new take. If you reset only before this scene, the correct standalone balance is
**800 → 840**; announce that changed starting state instead of claiming 760 → 800.

### 2:45–3:00 — close with the scope

**Page:** Keep the refund result visible, or return to Tab 3's historical proof.
**Identity:** Sam in simulation; no wallet needed for proof.

**Clicks / input:** No new action. Optional: show the already-loaded real refund
Explorer tab **B: Contributor claims own refund**.

**Expected visual:** Refund result or genuine historical proof; no pending new transaction.

**Say:** “FUSE makes shared bookings conditional on funding and supplier consent.
Unactivated bookings allow refunds after expiry. The marketplace is an interactive
prototype, and the escrow rules also run on Solana Devnet. Real browser activation
exists; real creation, deposits, approvals and refunds currently use developer scripts.”

**If it fails:** Finish over the last verified result. Never describe an unfinished
wallet prompt or an old signature as a new confirmed transaction.

## Keep the recording reliable

- A frozen simulation deadline is deliberate. Real Devnet uses real chain time;
  **Advance past deadline** cannot advance it.
- Use the seeded expired workshop for the short refund scene. The longer
  deposit → advance clock → 60-token refund is in Scenario C1 of the user guide.
- Do not connect a wallet or press **Sign real activation** during this script.
  The available campaign may already be settled or expired. This is a valid state.
- Creation and My commitments are covered by the full user guide. Leave them out
  of this three-minute take so the funding gate, supplier gate and proof remain clear.
- Keep the direct proof links available. The public RPC and Explorer are separate
  external services; neither has a guaranteed recording-time response.
- Installed-wallet behaviour and physical-phone interaction are
  **Source-verified; manual browser verification required.** They are not required
  for this wallet-free recording.

After recording, close only the disposable session. Do not reset or overwrite a
teammate's normal browser state. No Git push, merge or deployment is part of this
playbook.
