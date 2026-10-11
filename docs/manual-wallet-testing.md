# Installed-wallet test — owner checklist

**Still manual and unverified.** Automated signing used a test-only Wallet
Standard provider with a real disposable key, not an installed extension.

- [ ] In a separate browser profile, install Phantom from its official site or
      another compatible Solana Wallet Standard wallet. Create a **new disposable
      wallet**, rather than importing an existing funded wallet. Keep its recovery
      phrase private; never enter it into FUSE. Never import the deployment authority.
- [ ] If using Phantom, open the avatar → **Settings → Developer Settings →
      Testnet Mode**, enable it and choose **Solana Devnet**. Check its testnet banner.
      If these options are unavailable, use a wallet supporting Devnet and legacy
      transaction signing. [Phantom's testnet instructions](https://help.phantom.com/articles/5997313271699).
- [ ] Copy only the new public Solana address into the
      [official Solana faucet](https://faucet.solana.com), select Devnet and request
      free test SOL manually. Follow any faucet limits; never pay for test SOL.
- [ ] Open the actual hosted URL plus `/onchain-demo`, confirm **Solana Devnet**,
      `https://api.devnet.solana.com`, and program
      `6R4NM7PX1jy2E3BhLohh2eoQaF2ubkwW6iNrmgYGViHf`. Click **Connect wallet**,
      authorize only the disposable account, and compare the displayed address.
      Any mismatch warning must block signing. Check the network in the wallet too.
- [ ] Select the campaign address recorded in `docs/devnet-recording-fixture.json`.
      First refresh and confirm it is **Ready to activate**, funded and approved,
      and still before its deadline. If settled or expired, do not retry it:
      historical proof still works. An optional fresh fixture can be prepared
      before testing with the existing `prepare-browser` command in the recording
      guide; it does not redeploy the program and consumes only test SOL.
- [ ] With a ready campaign and fee SOL, click **Activate with my wallet**, review
      the exact allocations, then **Sign real activation**. Review and approve
      the wallet prompt. This browser supports activation only; creation, deposits,
      approvals and refunds remain CLI actions. No test-token balance is needed
      for this permissionless activation.
- [ ] Wait for **Confirmed**, open the displayed Devnet Explorer transaction,
      check success, the FUSE program and supplier token changes, then refresh:
      status must be **Activated** and escrow zero. If failed or unconfirmed,
      inspect the signature before retrying. Never call that result successful.
- [ ] Click **Disconnect wallet**, then try revoking access in the extension.
      The connected address and activation permission should disappear. Reconnect
      only if another test is needed. Record wallet/version, browser, URL, campaign,
      signature and result privately; update the compatibility claim only after
      this installed-wallet test succeeds.
