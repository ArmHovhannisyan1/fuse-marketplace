# Record the FUSE technical demo in three minutes

Only Devnet SOL and valueless custom SPL tokens are used. No video or hosted
website has been created automatically. Keep keypair files, wallet recovery
screens and secret environment files out of the recording.

## Prepare before recording

1. Obtain owner approval before publishing the repository or website. If hosting
   is approved, open its actual public URL; otherwise use `http://localhost:3000`
   and say clearly that the website is local while the transactions are public.
2. Start the verified production website from the repository root:
   ```powershell
   npm run build
   npm run start -- --hostname 127.0.0.1
   ```
   The defaults and `.env.example` select canonical Devnet and the deployed ID.
   A hosting environment must supply those public values before the build.
3. Keep the confirmed success/refund records ready:
   - [CLI activation: exact 80/120](https://explorer.solana.com/tx/VupNM2JCgV11zMHxMwugadGpoDLKxY9pb4iEWzPwDoWotnFtnAx2nEiybrUJtbfZcM4N6ua4H82hZ8yMsA1yBHc?cluster=devnet).
   - [Funding without approvals: genuinely rejected](https://explorer.solana.com/tx/ymb7vd69zD6RfnqcowR7nZQVCXe4QUrNN1zptoAAhnVoxZzRJRgCy1FsqbHLB2XJRiY54uFBwRphreSBnF4sHk7?cluster=devnet).
   - [Venue authorization](https://explorer.solana.com/tx/5TLxk2dbHhC1uZ2YxQ61xuHvZNs4aWVLNsnGVHgkUy6a26W6pMM8JTV7cnbAZUGSnbqQuLJ5sZ7PHzYXoYUsX4F7?cluster=devnet).
   - [Instructor authorization](https://explorer.solana.com/tx/23RoQ9mXRstbj6kqD1BhGySiDhS8oiPSvnBkEfX2Udpszg3M192eBbwDeNTLnAC79XJJVxEUytht93qKiXynPzD9?cluster=devnet).
   - [Own refund: 40 tokens](https://explorer.solana.com/tx/bFfpECuSegdvNPVuRJjvK8BkMdyiu5qWbEDZKTrMCLHNFiDmP4bpYy5RLpkJZz6gxMAaE5Qd5YULnE89B9XvdKu?cluster=devnet).
   - [Duplicate refund: genuinely rejected](https://explorer.solana.com/tx/TQUxKL5ULBWbFQLdSSmFmSh8BiQTRF1meTNqB27dJLP2tUdaUAUTsUjqrBS3wJqV6SWMPKkMfncb8icoujtyBo8?cluster=devnet).
4. Use a disposable Wallet Standard wallet configured for Devnet and legacy
   signing, funded manually with free test SOL for its fee. Test the installed
   extension before recording: automated tests used a test-only provider with a
   real ephemeral signer, not an installed extension. Never import the deployment
   authority into the website or attempt to recover discarded CLI fixture keys.
5. A fresh ready campaign was prepared after the signed browser test. Read only
   the public `docs/devnet-recording-fixture.json` to identify it. If it was consumed
   or expired, prepare another with the verified command:
   ```powershell
   $fuseDevnet = '/mnt/c/Users/User/Desktop/fuse-marketplace/anchor/scripts/devnet.sh'
   wsl.exe -d Ubuntu -- bash $fuseDevnet prepare-browser
   ```
   This creates fresh disposable signers, a six-decimal test mint and one funded,
   approved campaign with a seven-day deadline. Confirmations are checked and
   existing campaign state is preserved. No public faucet is requested.
6. To regenerate both full technical scenarios instead, run:
   ```powershell
   wsl.exe -d Ubuntu -- bash $fuseDevnet scenarios
   wsl.exe -d Ubuntu -- bash $fuseDevnet verify
   ```
   Do this before filming: scenario B waits for a real 90-second Devnet deadline.
   These runs overwrite the latest public scenario receipt; save prior public
   receipts you intend to reference. They never reset public time or user wallets.

## Recording sequence

| Time      | Show and explain                                                                                                                                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00–0:25 | Open the website. Explain the workshop: ten seats at twenty tokens; venue eighty, instructor one hundred twenty. Show the marketplace notice and say this part is an interactive simulation.                                                                                                           |
| 0:25–0:45 | Open `/onchain-demo`. Show **Solana Devnet**, the actual program ID and real RPC state. Test tokens have no monetary value; no Mainnet is involved.                                                                                                                                                    |
| 0:45–1:10 | Open the confirmed failed full-funding activation above. Funding reached two hundred tokens but supplier approvals were missing. Open the genuine venue/instructor approvals and identify their signer public keys. Mock role selection played no part.                                                |
| 1:10–1:50 | Select the exact fresh recording campaign address. Connect the disposable Devnet wallet, review the fixed 80/120 payouts and sign activation. Show pending, genuine confirmation, Activated status and zero escrow. The caller is authentic; suppliers already authorized through separate signatures. |
| 1:50–2:15 | Open that actual transaction's Devnet Explorer link. Show successful status, program address and the exact supplier token changes. Refresh the page to reread current chain state.                                                                                                                     |
| 2:15–2:45 | Select the expired campaign from the scenario proof and open its actual refund. Forty tokens returned to the signing contributor, who had eight hundred at that checkpoint. Show the refunded record and the confirmed failed second refund. Deposits were locked before expiry.                       |
| 2:45–3:00 | State the limits: unaudited prototype, remaining participant wallet UI is CLI-only, and paying suppliers does not guarantee physical workshop delivery or resolve disputes. Built by two siblings on their first hackathon together.                                                                   |

## Honest backup if wallet or public RPC is slow

Use the previously verified public browser transaction:
[authentic browser activation](https://explorer.solana.com/tx/52oem6FJaMA2yfn1LJR9qdetCEuui4Bup5H9GNMDGA59bRBPg1zMV1Rd85Gt2ZcnfEndpKewmCDxEv88DPHC7PXC?cluster=devnet).
Say explicitly that it is an earlier confirmed run. It paid another exact 80/120
and left its vault empty; original supplier balances then became 160/240.
Do not label a pending or failed live attempt confirmed. Inspect any submitted
signature before trying again; transaction outcomes can be temporarily unknown.

`docs/devnet-deployment.json`, `docs/devnet-proof.json` and
`docs/devnet-browser-proof.json` contain only genuine public evidence. Their
balances describe recorded checkpoints; the website fetches current state.
A fresh recording fixture uses a different mint/accounts, initially with zero
supplier balances. All amounts use exact six-decimal base units.

The independent Localnet fallback remains available through
`anchor/scripts/run-linux.sh` and `/onchain-demo?network=localnet`. Describe it as
Localnet and use local RPC inspection; its signatures do not exist on public
Explorer. The original simulation and its mock clock are never blockchain proof.
