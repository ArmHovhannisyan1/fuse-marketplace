# FUSE final technical release preparation

Checked on **11 October 2026**. This release prepares the existing product for a
public hackathon demonstration. It does not certify a financial production system.

## A. READY

- The original seven-page simulated marketplace is preserved. No escrow program,
  dependencies or transaction logic changed.
- `/onchain-demo` now presents labeled historical Devnet deposits, approvals,
  rejected activation, exact payouts and expiry refund links from committed
  proof. The panel remains visible without RPC or a wallet; live account state
  stays separate. Existing wallet-signed activation and explicit Localnet mode remain.
- README positioning, public configuration and honest scope are documented.
  Frontend URL is explicitly pending. Vercel, manual wallet, technical video,
  pitch and submission materials are prepared.

| Final verification                                   | Result                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`                                  | Passed                                                                                                                                                       |
| `npm run lint`                                       | Passed                                                                                                                                                       |
| `npm test`                                           | 41 passed                                                                                                                                                    |
| `npm run test:browser`                               | 13 passed; all seven routes, simulation flows, storage, mobile navigation, widths 375/768/1440, RPC outage/429 recovery, historical links, wallet disconnect |
| Read-only Devnet browser subset                      | 2 passed: genuine state/Explorer/refresh and unsupported-network rejection                                                                                   |
| `npm run build`                                      | Passed; all original routes and dynamic `/onchain-demo` retained                                                                                             |
| `npm run test:devnet`                                | 1 genuine read-only RPC integration passed                                                                                                                   |
| `npm run test:localnet`                              | 1 genuine RPC integration passed against the retained ledger, without reset                                                                                  |
| Existing Localnet-address / Devnet-address VM suites | 20 passed for each compiled SBF variant, 40 total                                                                                                            |
| `devnet.sh verify`                                   | All 26 scenario transactions checked; exact 80/120, contributor-signed 40 refund, expected failures and earlier authentic browser activation verified        |
| Tracked files / reachable Git history                | No matching credential patterns or tracked secret paths; 13 historical JSON blobs contained no 64-byte Solana keypair arrays                                 |
| `npm audit` / `npm audit --omit=dev`                 | Both reported zero vulnerabilities                                                                                                                           |
| `git diff --check`                                   | Passed                                                                                                                                                       |

Windows sandbox restrictions initially blocked Vitest, Next.js workers, Playwright
and WSL. Required checks succeeded when rerun with permission outside the sandbox.
Chrome screenshots were inspected; other browser engines remain unverified.

The live Devnet browser subset was run with:

```powershell
npm run test:browser:devnet -- --grep 'Devnet reads genuine|a wallet lacking Devnet support'
```

The transaction-producing browser tests were intentionally not rerun: their old
campaign is already settled. Existing signed browser evidence was independently
rechecked instead. No new Devnet fixture, wallet funding, deployment or upgrade
was performed. Installed-wallet extension compatibility remains manual.

## B. BLOCKERS

No code blocker was found for manual Vercel hosting or a truthful historical
technical demo. Public hosting, signed-out access and installed-wallet testing
still need owner completion; there is no hosted FUSE URL from this phase.

The public Devnet RPC can rate-limit or reject a hosted origin. It worked for
this local browser and the RPC tests, but hosted-origin reliability is unverified.
Historical proof and visible RPC errors keep that limitation honest. If live reads
remain unreliable, the smallest alternative is a browser-compatible free-tier
Devnet RPC plus a reviewed change to the client's canonical-endpoint restriction.
No paid provider or credential is required for the recorded-evidence demo.

## C. GITHUB

Branch: **`solana-implentation`**. A read-only `git ls-remote` check found GitHub
already at `9b5115c92d890ce07caeeb7031ddbdc1760d5ec1`, matching the starting local
HEAD. Contrary to the earlier brief, no pre-existing unpushed commits were found
at that check. The release commit created during this phase remains local.

Review its identity and push it yourself:

```powershell
git branch --show-current
git log -1 --oneline
git status --short
git push origin solana-implentation
```

`install.sh` remains untracked and untouched. Its purpose and safety were not
established. It was not read, run, changed, deleted or included in a commit.
All intended source/proof/docs are tracked; build outputs and keypairs are excluded.
No branch, history rewrite, push or merge was performed. There is no LICENSE file;
the owner should choose licensing before claiming permission to reuse the code.

## D. VERCEL

Follow [the manual dashboard guide](vercel-deployment.md). Import the repository,
use its root and Next.js preset, `npm ci`, `npm run build`, Node 24.x and the
default output. Set Production branch tracking to `solana-implentation`, not an
older default branch, and deploy that branch's release commit.

Set these public values for Production and Preview **before the build**:

```dotenv
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_FUSE_PROGRAM_ID=6R4NM7PX1jy2E3BhLohh2eoQaF2ubkwW6iNrmgYGViHf
```

Check signed-out access, all routes, mobile/desktop layouts, current Devnet state
and Explorer links. Replace the README's pending frontend URL with the actual URL.

## E. VIDEO

Open home, the simulated flagship, `/onchain-demo` and the real Explorer tabs.
Reset only the simulation, rehearse with a timer, and record
[the final technical script](final-technical-video.md), maximum three minutes.
It uses historical evidence explicitly; do not pretend a new transaction occurred.
Prepare the separate presentation from [the pitch outline](final-pitch-outline.md),
whose customer, go-to-market and revenue assumptions are labeled unverified.
Video recording/upload and any pitch deck still need owner work.

## F. SECURITY

No secrets were found in the reviewed application, tracked files or reachable
history, and none were introduced by this release. This is a targeted pattern,
path and keypair scan with code review, not a guarantee or an independent audit.
`.env` files, wallet directories, `*-keypair.json`, Anchor build outputs and test
ledgers are ignored. Only public addresses/signatures/configuration are committed.
No authority key or recovery phrase belongs in the browser.

The program remains upgradeable and unaudited; no governance/security review,
service-delivery guarantee or dispute process was added. Test tokens have no
value. Public RPC availability and installed-wallet compatibility remain risks.
The unexplained untracked `install.sh` must remain outside the release.

## G. FINAL HANDOFF

1. Review the local release commit and push the current branch yourself.
2. Deploy that exact commit through Vercel with the three public Devnet settings.
3. Test the public URL signed out, on mobile/desktop; update the README's URL.
4. Complete [manual wallet testing](manual-wallet-testing.md) before claiming
   installed-extension compatibility. Use only a disposable wallet; a new live
   activation is optional and requires a still-ready campaign.
5. Record/upload the technical and presentation videos, preserving the simulation
   and historical/current-state distinction. Check both video links signed out.
6. Each sibling registers; the team leader checks the actual submission form,
   includes GitHub, website, video and genuine Devnet proof links, and confirms
   submission receipt. See [the submission checklist](submission-checklist.md).

The [official event rules](https://colosseum.com/legal/Crypto%20World%27s%20Fair%20Hackathon%20Rules.pdf)
give the cutoff as **12 October 2026, 11:59 PM Pacific**, which is **13 October
2026, 10:59 AM Yerevan**. Aim to finish well before it; check for event updates.
