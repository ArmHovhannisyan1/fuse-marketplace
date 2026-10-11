# FUSE final QA checklist

Website: **https://fuse-marketplace.vercel.app/**

Prepared: **11 October 2026**, local `main` at `6f7b8bb`.

Use the [full user guide](FUSE-USER-TESTING-GUIDE.md) for exact inputs and the
[three-minute playbook](FUSE-LIVE-DEMO-PLAYBOOK.md) for recording. Test in disposable
browser sessions. Each teammate has separate local simulation data.

**A** owns simulation tests. **B** owns navigation, Devnet reads, layout and public
access. Write the actual tester's name, Pass/Fail and notes after each check. The
boxes below are deliberately blank for your own rehearsal; automation results
are recorded separately below. Do not send a new Devnet transaction for this list.

## Navigation — teammate B

| Done | Check and expected result                                                                                                                                                                                               | Pass/Fail | Tester | Notes |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | ----- |
| [ ]  | **1. Home and links:** Home hero loads. Header opens Marketplace, How It Works, About and My commitments. **Try the workshop demo** opens Clay. Footer opens Create and Solana on-chain demo.                           | ___       | B: ___ | ___   |
| [ ]  | **2. Direct routes:** Open `/`, `/how-it-works`, `/about`, `/marketplace`, `/marketplace/clay-and-company`, `/create`, `/my-commitments`, `/onchain-demo`. Seed details work after refresh without visiting Home first. | ___       | B: ___ | ___   |

## Marketplace — teammate A

| Done | Check and expected result                                                                                                                                                                                                 | Pass/Fail | Tester | Notes |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | ----- |
| [ ]  | **3. Fresh seeds:** Reset R in your test session. Five bookings; Clay 8/10 and 160/200, Sam 800, frozen clock 7 Oct 2026 12:00 UTC.                                                                                       | ___       | A: ___ | ___   |
| [ ]  | **4. Search and filters:** Search `clay`, then clear it. Each of Open / Waiting for approval / Ready to activate / Activated / Expired has one seed. Search `does not exist`; **Clear search and filters** restores five. | ___       | A: ___ | ___   |

## Successful activation — teammate A

| Done | Check and expected result                                                                                                                                                                                                                                                                                | Pass/Fail | Tester | Notes |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | ----- |
| [ ]  | **5. Deposit:** Reset R; Sam enters 2 in **Seats to commit**; **Review commitment → Confirm 40 demo tokens**. Clay becomes 10/10, 200/200; Sam 760; still Waiting for approval.                                                                                                                          | ___       | A: ___ | ___   |
| [ ]  | **6. Conditions and roles:** Before funding, activation says **Waiting for 2 more funded seats.** After funding it says **Waiting for instructor approval.** Instructor approval is disabled for Sam/venue; **Designated instructor · instructor → Approve as instructor** makes Ready to activate.      | ___       | A: ___ | ___   |
| [ ]  | **7. Payout and terminal state:** **Activate booking → Confirm activation** gives Activated, **Simulated payout completed**, venue 80 / instructor 120. **Booking activated** is disabled; activated refunds are blocked. Global supplier balances become 160/240 because an earlier seed payout exists. | ___       | A: ___ | ___   |
| [ ]  | **8. Invalid deposits:** After Reset R, enter 3, 0, -1, 1.5 and blank one at a time. **Review commitment** is disabled with over-capacity or positive-whole-number reason; balance/funding do not change. Supplier identities cannot commit seats.                                                       | ___       | A: ___ | ___   |

## Refunds — teammate A

| Done | Check and expected result                                                                                                                                                                                                                                 | Pass/Fail | Tester | Notes |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | ----- |
| [ ]  | **9. Deposit then expire:** C1: Reset R, Sam deposits one seat / 20. Sam 780; own total 60. Early refund disabled. **Advance past deadline → Advance clock** makes expiry; **Claim 60 demo token refund** gives Sam 840 and leaves Robin's 6 seats / 120. | ___       | A: ___ | ___   |
| [ ]  | **10. Repeat and expired activation:** **Refund already claimed** is disabled. Expired booking cannot activate or accept new deposits. Robin claims own 120 separately; status becomes Fully refunded.                                                    | ___       | A: ___ | ___   |
| [ ]  | **11. Short recording refund:** Reset R, open Made from wood as Sam; claim 40, balance 800 → 840. For the continuous playbook after Clay's 40 deposit, use no reset: 760 → 800 instead. Second claim blocked; Robin's one seat remains.                   | ___       | A: ___ | ___   |

## Campaign creation — teammate A

| Done | Check and expected result                                                                                                                                                                                                                                                                                       | Pass/Fail | Tester | Notes |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | ----- |
| [ ]  | **12. Role and validation:** `/create`; only Workshop organizer can review. Blank required text shows **This field is required.** Use Scenario D values. Allocations 80 + 121 fail the exact-target rule; deadline 7 Oct 2026 12:00 fails the future-clock rule.                                                | ___       | A: ___ | ___   |
| [ ]  | **13. Publish and persistence:** Use 20 × 10, 80/120, deadline 10 Oct 2026 12:00 UTC and all five text fields from D. **Review booking → Publish demo booking** opens new details: 0/10, both approvals pending. Refresh keeps it; Marketplace lists it. Another fresh session cannot see it. Reset removes it. | ___       | A: ___ | ___   |

## My Commitments — teammate A

| Done | Check and expected result                                                                                                                                                                                                                  | Pass/Fail | Tester | Notes |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------ | ----- |
| [ ]  | **14. Identity and activation:** Reset gives Sam five records; Clay 2 seats / 40. After B: Clay 4 seats / 80, **Paid to suppliers · no refund**. Robin has Robin's records. Organizer shows **No attendee commitments for this identity.** | ___       | A: ___ | ___   |
| [ ]  | **15. Refund record and refresh:** After C1, Clay shows original 3 seats / 60 and **Refund completed**. Refresh preserves it. Reset restores Sam's original 2 seats / 40 and removes custom records.                                       | ___       | A: ___ | ___   |

## Solana Devnet — teammate B

| Done | Check and expected result                                                                                                                                                                                                                                                                                                                                                                         | Pass/Fail | Tester | Notes               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | ------------------- |
| [ ]  | **16. Public configuration and live state:** `/onchain-demo?network=devnet`, Solana Devnet, program `6R4NM7PX1jy2E3BhLohh2eoQaF2ubkwW6iNrmgYGViHf`. Select success campaign `27B58GeS…`: Activated, vault zero. Select refund campaign `iJmKPiLc…`: FullyRefunded, vault zero. **Refresh on-chain state** rereads accounts.                                                                       | ___       | B: ___ | ___                 |
| [ ]  | **17. Historical proof:** **Verified Devnet evidence · historical** remains separate from live state. Open deposit, both approvals, missing-approval failure, 80/120 activation and 40 refund Explorer links. All links select Devnet. Describe these as earlier transactions. Explorer visual layout: **Source-verified; manual browser verification required.** Transactions were RPC-verified. | ___       | B: ___ | ___                 |
| [ ]  | **18. Errors and retry:** If RPC fails, show the error and clear unavailable live balances while keeping historical links. If 429 occurs, wait and refresh; do not flood RPC. Inspect any submitted signature before retrying a wallet action. Outage/429 paths already passed automated interception.                                                                                            | ___       | B: ___ | ___                 |
| [ ]  | **19. Optional installed wallet:** G2: compatible disposable Devnet wallet, **Connect wallet**, inspect address, **Disconnect wallet**. Settled/expired campaign activation stays blocked. Browser has no real create/deposit/approve/refund controls. Do not sign for this check. **Source-verified; manual browser verification required.**                                                     | ___       | B: ___ | Wallet/browser: ___ |

## Mobile responsiveness — teammate B

| Done | Check and expected result                                                                                                                                                                                                                      | Pass/Fail | Tester | Notes               |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | ------------------- |
| [ ]  | **20. Browser widths:** At 375, 768 and 1440 pixels, check the eight routes in row 2. No horizontal page overflow; dialogs, form and chain panels remain reachable. **Open navigation → About** closes mobile navigation.                      | ___       | B: ___ | ___                 |
| [ ]  | **21. Physical phone:** Use a real phone for menu, scroll, quantity/form inputs and confirmation dialogs. **Source-verified; manual browser verification required.** Chrome width checks do not verify touch or Safari/Firefox/mobile wallets. | ___       | B: ___ | Device/browser: ___ |

## Public deployment readiness — both teammates

| Done | Check and expected result                                                                                                                                                                                                                                                                                                                                                                  | Pass/Fail | Tester    | Notes                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | --------- | -------------------------- |
| [ ]  | **22. Signed-out public access:** In a fresh private session open the exact public URL and all routes. No Vercel login/protection screen. Fresh simulation is independent of normal browser data.                                                                                                                                                                                          | ___       | B: ___    | ___                        |
| [ ]  | **23. Truthful scope and wording:** Home/About, notice and footer distinguish the marketplace simulation from separate real Devnet proof. The deployed unaudited contract uses valueless test tokens; only activation has browser signing. Earlier signatures are not new activity; mock roles are not real wallet signers. Confirm the public deployment includes the copy-polish commit. | ___       | Both: ___ | Deployed commit: ___       |
| [ ]  | **24. Recording rehearsal:** Complete the three-minute playbook after Reset R, without another reset during the take. Preload Explorer tabs. Check 80/120 receipt and continuous Sam balance 760 → 800. Have the RPC/Explorer fallback ready.                                                                                                                                              | ___       | Both: ___ | Time/remaining issues: ___ |

## Verification already completed for these documents

**Final copy-polish release:** the local production build, TypeScript, lint,
41 unit tests and 13 existing browser tests passed. The exact Clay accounting
audit conserved all 2,500 seeded tokens through Sam's 800 → 780 → 840 flow.
Only copy and documentation changed; accounting, contract and proof data are
unchanged. The hosted checks below were completed before copy polish.

These are actual runs against the hosted site, using isolated Chrome browser
contexts. They did not change a teammate's saved data or send a Devnet transaction.

| Verification                     | Actual result                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing hosted UI suite         | **13 passed**: simulation success/refund, creation, storage recovery and session fallback, keyboard dialogs, seven routes at 375/768/1440, RPC outage/429 and test-provider disconnect.                                                                             |
| Additional exact guide journeys  | **6 passed**: filters/search and old copy; C1/C2 balances; My commitments/reset; identity/quantity restrictions and terminal states; all create values, invalid deadline/allocation and isolated custom URL; continuous recording sequence with no mid-scene reset. |
| Genuine hosted Devnet reads      | **2 passed**: actual success/refund account states, zero vaults, Explorer URL/refresh checks and wrong-network test-wallet rejection. Also checked `/onchain-demo` at all three widths.                                                                             |
| Unit tests                       | **41 passed**: existing domain, storage, generated interface and RPC safety tests.                                                                                                                                                                                  |
| Read-only public Devnet verifier | **Passed all 26 recorded transactions**, including expected failures, authentic supplier/contributor signatures, exact 80/120 settlement and 40-token refund, zero settled vaults, and earlier real browser-signed activation with a disposable test signer.        |
| Local versus hosted comparison   | Before final copy polish: no behavior or label difference in the tested journeys; both had the old Home/About wording. Local copy is now corrected and awaits a Vercel deployment. Public UI tests do not establish the exact deployed Git hash.                    |

The prior release report contains 20 compiled-program VM tests for each of two
program-address variants. Those tests were not rerun for this documentation task.
The current task did not reinstall dependencies, create Devnet fixtures, spend
test SOL, deploy the program, push, merge or redeploy the website.

Installed wallet extensions, physical phones, Safari and Firefox remain manual.
The test wallet used by automation is not an installed extension. Read-only tests
do not establish that a currently eligible campaign is available for a new wallet
activation. No new signed activation is required for the recording.

## Issues that could affect the recording

| Issue                                        | Status and recording action                                                                                                                                             |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Copy-polish release not yet deployed         | **Corrected locally.** After merging the reviewed release, publish it through Vercel and confirm Home/About, notice and footer use the corrected copy before recording. |
| Public RPC or Explorer slow/unavailable      | External availability limit. Preload evidence tabs, show honest RPC errors, and retry later if needed. Never substitute invented live balances.                         |
| Ready Devnet fixture already settled/expired | Expected one-use/time-limited campaign behaviour. Show historical proof and current terminal state; do not create another fixture for this guide.                       |
| Simulation rehearsals change later scenes    | Reset before each full take, then keep the same session and do not reset mid-script. Select Sam again before the wood refund.                                           |
| Installed wallet or real-phone compatibility | **Source-verified; manual browser verification required.** The recommended recording does not depend on a wallet.                                                       |

No critical functional failure was found in the tested journeys. Write any new
failure's URL, role, starting state, browser and exact steps in Notes before
resetting. Treat a payout without conditions or a repeat payout/refund as a
critical bug and stop the take.
