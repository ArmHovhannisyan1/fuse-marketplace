# FUSE submission checklist

The owner finishes these steps; nothing is automatically pushed or hosted.

The [official Crypto World's Fair rules](https://colosseum.com/legal/Crypto%20World%27s%20Fair%20Hackathon%20Rules.pdf)
confirm **12 October 2026, 11:59 PM Pacific**. That is **13 October 2026, 10:59 AM
in Yerevan** (Pacific daylight time, UTC−7; Yerevan UTC+4). Submit well before the
cutoff and check the event site for updates. Each sibling must register individually;
the team leader submits the project.

- [ ] Publish the repository after reviewing tracked files for credentials. Keep
      `.env` files, `.wallets/`, keypairs and local ledgers private.
- [ ] Deploy the existing Next.js app manually using
      [the Vercel dashboard guide](vercel-deployment.md). Select the released
      `solana-implentation` branch and public Devnet configuration. Record the
      actual URL and replace the README's pending-URL placeholder.
- [ ] Check the hosted URL on mobile and desktop. Confirm `/onchain-demo` loads
      actual Devnet accounts and opens Explorer links with `cluster=devnet`.
- [ ] Complete [the installed-wallet checklist](manual-wallet-testing.md) before
      making an extension-compatibility claim or attempting a live wallet recording.
- [ ] Record the three-minute technical demonstration using
      [the final timed script](final-technical-video.md). Its confirmed historical
      transaction sequence works without consuming a fresh campaign. Review
      [the optional live workflow](demo-recording-guide.md) only if rehearsed.
- [ ] Record the separate project presentation video: the coordination problem,
      conditional workshop, what works, team, and next steps. Do not claim event
      delivery guarantees, audits, customers or production readiness.
      Use [the pitch outline](final-pitch-outline.md) and label business hypotheses.
- [ ] Review README setup instructions and the distinction between the simulated
      marketplace and authentic test-network transactions.
- [ ] Include the verified public Devnet program address, mint, activation and
      refund transaction links from the committed public proof files.
- [ ] Check the actual Colosseum submission form and current event rules: required
      links, video durations, eligibility and team registration. The cutoff above
      was checked during release preparation; account-specific form requirements
      and team eligibility still need personal verification.
- [ ] Submit and independently confirm the submission was received before cutoff.

Unaudited prototype. Devnet SOL and custom demonstration tokens have no monetary
value. No Mainnet deployment or website publication is authorized automatically.
