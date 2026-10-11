# Deploy FUSE through the Vercel dashboard

The owner has already published **https://fuse-marketplace.vercel.app/** and merged
`solana-implentation` into `main`. Hosted UI and read-only Devnet tests passed on
11 October 2026. Use the [user testing guide](FUSE-USER-TESTING-GUIDE.md) and
[recording playbook](FUSE-LIVE-DEMO-PLAYBOOK.md) without redeploying.

The steps below are for a future owner-managed deployment. This document does not
connect accounts or publish anything. The website needs no private key, database,
paid RPC or Rust build on Vercel. The current release branch is `main`.

1. Push the reviewed release from the repository root:
   ```powershell
   git status --short
   git push origin main
   ```
   Leave the untracked `install.sh` out of Git. Do not run it.
2. Sign in to Vercel yourself. Choose **Add New → Project**, connect your GitHub
   account, and import `ArmHovhannisyan1/fuse-marketplace`.
   [Vercel's dashboard import instructions](https://vercel.com/docs/projects/managing-projects).
3. Use these build settings:

   | Setting          | Value                                           |
   | ---------------- | ----------------------------------------------- |
   | Framework preset | Next.js                                         |
   | Root directory   | Repository root (`./`), not `app/` or `anchor/` |
   | Install command  | `npm ci`                                        |
   | Build command    | `npm run build`                                 |
   | Output directory | Keep the Next.js default; no static export      |
   | Node.js          | 24.x, matching the locally tested major version |

   Vercel supports Node 24.x; the repository's `>=22.0.0` engine range currently
   resolves to its latest supported major. Check **Settings → Build and Deployment**
   if needed. [Node version settings](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

4. Before building, enter all three **public** environment variables. Apply them
   to **Production and Preview** so either type of deployment uses Devnet:
   ```dotenv
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_FUSE_PROGRAM_ID=6R4NM7PX1jy2E3BhLohh2eoQaF2ubkwW6iNrmgYGViHf
   ```
   These values are embedded in browser code during the build. After changing
   them, redeploy; saving a variable alone does not update an existing bundle.
   Never add wallet keys or secret RPC credentials.
   [Environment variable settings](https://vercel.com/docs/environment-variables).
5. Check which branch Vercel will deploy. The development release is now merged
   into `main`. If the import screen offers a branch selector, choose `main`.
   Otherwise finish creating the project, then open
   **Settings → Environments → Production → Branch Tracking**, enter
   `main`, and save. In **Deployments → Create Deployment**, enter
   that Git branch and deploy it. Confirm the resulting deployment's commit
   matches `git rev-parse HEAD`. Do not merge or create a branch for this step.
   [Production branch and Git-reference deployments](https://vercel.com/docs/git).
6. Open the resulting production URL in a signed-out/incognito browser. Check
   Deployment Protection if judges are asked to log in. Use the dashboard to
   make the submission URL publicly accessible. Keep your Vercel account private.
7. Test `/`, `/how-it-works`, `/about`, `/marketplace`,
   `/marketplace/clay-and-company`, `/create`, `/my-commitments`, and
   `/onchain-demo` on mobile and desktop. On the last page, confirm **Solana
   Devnet**, the program ID, historical Explorer links, and current RPC state.
   Follow [the installed-wallet checklist](manual-wallet-testing.md).
8. Check that README and your submission use the actual public URL. Record that URL
   and confirm the deployed commit in Vercel. The current URL is
   **https://fuse-marketplace.vercel.app/**.

The default hosted flow uses HTTPS Devnet RPC. The explicit **Local validator**
link is a development option requiring a validator on the visitor's machine;
it is not a hosted blockchain service.

## If public RPC is slow or blocked

The public RPC has no reliability guarantee. The client paces requests, retries
HTTP 429 twice, then shows an error and clears unavailable account balances.
Wait briefly and select **Refresh on-chain state**. Do not repeatedly sign a
transaction whose outcome is unknown; inspect its submitted Explorer signature.
Historical proof is visible without RPC, but Explorer availability is separate.

If the actual hosted browser cannot read Devnet reliably, use the existing
confirmed transaction links for the technical video. The smallest alternative
for live reads is a Devnet endpoint with a browser-compatible free tier. This
client deliberately accepts only canonical Devnet RPC, so such a switch needs a
small reviewed configuration change retaining genesis/program checks; it is not
an environment-only substitution. No provider or credential was added here.
