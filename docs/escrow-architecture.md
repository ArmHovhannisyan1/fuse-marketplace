# FUSE escrow foundation

This is an unaudited Anchor proof of concept, now running on a real local Solana
validator. The original website keeps its independent localStorage simulation.
`/onchain-demo` separately reads RPC accounts and supports authentic wallet-signed
activation. No Devnet or Mainnet deployment has been performed.

## Accounts and immutable terms

Only the classic SPL Token Program is accepted. Token-2022 and mints with a freeze
authority are rejected. Amounts are `u64` integer **base units**, not floating-point
token amounts. VM tests create a zero-decimal, valueless mint. The real validator
scenarios use a six-decimal mint: 20 tokens means 20,000,000 base units. The browser
client uses BigInt throughout and formats the actual mint decimals without float
conversion. These tokens have no monetary value.

| Account      | Address / authority                                                      | Purpose                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campaign     | PDA: `campaign`, organizer public key, identifier as little-endian `u64` | Immutable organizer, identifier, mint, seat price/count, target, chain deadline, supplier wallet keys, and exact allocations; mutable approvals, aggregate deposits, terminal state |
| Vault        | PDA: `vault`, campaign public key; owned by the Token Program            | Token account for the campaign's mint; its transfer authority is the campaign PDA                                                                                                   |
| Contribution | PDA: `contribution`, campaign public key, contributor public key         | One aggregate seat/deposit record per contributor per campaign, plus the one-time refund flag                                                                                       |

Both supplier keys must be distinct, nonzero public keys. Each designated identity
must provide signer authorization to approve; a key that cannot sign cannot approve.
There is no financial-terms update instruction, no admin withdrawal, and no recovery key.
Reusing an organizer/identifier cannot overwrite an existing campaign. Supplier
approvals bind to that exact immutable campaign account, rather than a mutable UI
label. Workshop titles and location text are not stored by this minimal program.

Payout token accounts are supplied at activation. Their **mint and token owner must
match the campaign's immutable mint and designated supplier wallet**. A caller
cannot redirect either payout to their own wallet. Multiple token accounts owned
by the same designated wallet are acceptable; the beneficiary key cannot change.
Refund destinations must similarly belong to the signing contributor and use the
correct mint. SPL account ownership is checked in addition to its token-owner field.

## Instructions

1. `create_campaign(terms)`: organizer signs and pays account rent. Checks positive
   prices, seats and allocations, a future chain deadline, checked arithmetic, and
   allocations equal to `seat_price × required_seats`. Initializes an empty vault.
2. `approve_supplier(role)`: the designated venue or instructor signs. Repeated
   approvals, expired campaigns, and terminal campaigns are rejected.
3. `deposit(seats)`: contributor signs and pays contribution-account rent. Transfers
   `seats × seat_price` using SPL `transfer_checked`. Enforces the capacity and
   source token-account owner/mint. Repeated deposits accumulate in one record;
   failed transfers roll back both account initialization and accounting.
4. `activate()`: any signed caller can trigger the transition. Requires full
   accounted funding, both approvals, `Clock.unix_timestamp < deadline`, and an
   open campaign. The campaign PDA signs two token CPIs paying the fixed allocations.
   Success marks Activated and zeroes outstanding escrow accounting. A failure in
   either CPI rolls back the whole instruction, including the first transfer.
5. `refund()`: at `Clock.unix_timestamp >= deadline`, a signing contributor can
   reclaim their own recorded amount if the campaign never activated. Checks the
   contribution PDA/owner and recipient, transfers once, marks refunded, and reduces
   aggregate outstanding deposits. No early withdrawal or refund after activation.

```mermaid
flowchart LR
  O[Open: collect deposits and approvals] -->|Fully funded + both approvals + before deadline; explicit activate| A[Activated: exact supplier payouts]
  O -->|Deadline reached without activation| E[Expired: individual refunds eligible]
  E -->|First successful claim| R[Refunding]
  R -->|All recorded deposits returned| F[Fully refunded]
  E -->|Only contributor claims all deposits| F
```

Expiry is derived from the **on-chain Clock sysvar**, not a stored boolean or the
frontend's demo clock. Open-but-expired accounts cannot activate even if they were
ready earlier. Refunding and FullyRefunded are terminal for deposits/activation.
Activated seat counts remain historical; refunded seat counts track outstanding
contributions. Individual contribution amounts remain historical after a refund,
with `refunded = true` preventing reuse. No account-close instruction exists.

## Tests and local execution

The Rust integration suite uses LiteSVM with signature verification, real compiled
SBF bytecode, System Program account creation, and the actual SPL Token Program.
It creates its own test mint and disposable deterministic identities in memory.
No RPC service, wallet file, SOL purchase, or external deployment is involved.
Tests explicitly set the VM Clock sysvar and compare token-account balances.

The second-payout rollback test deliberately injects a frozen destination into the
VM as a fault fixture. Such freezing is not allowed by the mint policy at campaign
creation. This targeted fault proves rollback when the first CPI succeeds and the
second one fails; it is not an instruction exposed to users.

See the root README for pinned versions, executed commands, and verification results.
All 20 VM integration tests passed against the compiled program in this milestone.
The build/test scripts use an isolated Linux cache to avoid slow WSL builds on the
Windows filesystem. The SBF artifact is written to ignored `anchor/target/deploy/`.
`Anchor.toml`, Rust, generated IDL and client agree on
`25GSneHPbwgwoUNjjcGQ4RoJzJsxETMtZUHNhXWYTf7G`. The local validator's
`--bpf-program` genesis option loads the compiled binary at that public address,
with upgrades disabled and without requiring its private key. There is no genesis
deployment transaction signature. An ignored SBF-generated program keypair has a
different public address and must not be used to deploy this binary unchanged.

The real RPC runner uses Anchor's generated Rust `InstructionData` and
`ToAccountMetas`, not guessed binary layouts. It submits signed transactions,
checks returned signatures and confirmed errors, decodes program-owned accounts
and reads actual SPL balances. Negative cases are deliberately submitted with
preflight skipped so their failures are real on-chain records. Positive cases use
preflight. Fixture keys are random, ephemeral and never exported; public results
are saved in ignored `anchor/localnet/receipt.json`.

Expiry uses a controlled 15-second deadline and bounded polling of the actual
validator Clock. It does not warp the mock clock, change program rules, or blindly
sleep and assume expiry. See the [recording guide](demo-recording-guide.md).

## Future frontend integration boundary

`lib/demo-store.ts` remains the simulation adapter. `lib/solana/` is separate:

- `interface.ts` consumes the Rust-generated IDL to derive campaign field order,
  discriminators, status variants and instruction account order; it rejects
  unsupported types and malformed account data.
- `client.ts` uses Solana Kit 8.4.0 RPC/codecs and legacy transaction messages.
  It reads program ownership, executable status, chain Clock, PDA vault balances,
  campaign state and real signature history. Activation fetches the current
  conditions and supplier-owned token accounts before constructing the message.
- `wallet.ts` uses Wallet Standard discovery, connection, disconnection and account
  events. Only an account supporting `solana:localnet` and legacy
  `solana:signTransaction` can sign. Signed message bytes must match the reviewed
  message. The client broadcasts only to its verified loopback RPC, checks the
  returned signature, and waits for confirmation. No production signing key or
  automatic fixture signer is supplied to the page.

The browser's real action is permissionless activation, paid for and signed by
the connected caller. Supplier approvals in the fixture were already signed by
the designated CLI wallets. Deposits, creation, supplier approvals and refunds
still need wallet UI; the real runner already demonstrates those instructions.
The simulation's role selector authorizes nothing on-chain.

| Existing UI command           | Future program instruction / account read                                           |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| Publish booking               | Validate raw-unit terms; `create_campaign`; keep descriptive metadata separately    |
| Supplier approval             | Wallet signs `approve_supplier`; read Campaign approvals afterward                  |
| Commit seats                  | Derive Contribution/vault PDAs; `deposit`; read SPL balance and Contribution        |
| Activate booking              | Provide correct supplier token accounts; `activate`; re-fetch Campaign and balances |
| Claim refund                  | Wallet signs `refund` for its own Contribution and token destination                |
| Status / personal commitments | Decode Campaign and Contribution; fetch chain time, not the simulation clock        |
| Reset / advance clock         | Demo only; no corresponding production program instruction                          |

Use generated Anchor IDL/types from the pinned program and wallet-authorized
transaction submission. Add pending, rejected, failed, and confirmed states; re-read
accounts after confirmation and recover after refresh. Never treat a local UI
balance, role selector, or simulation receipt as chain evidence. Persist an
organizer campaign identifier before sending and reconcile the PDA before retrying
creation, so refresh/retries do not create unrelated duplicate campaigns.

Public configuration: RPC URL, localnet network label, deployed program ID, and the
selected mint address (read from Campaign or a future allowlist). None is a secret.
No frontend private key, recovery phrase, privileged signing credential, or secret
RPC credential is needed. `.env.example` supplies only public local-development
configuration; the on-chain page uses safe defaults without an environment file.
Non-loopback endpoints, public cluster genesis hashes, non-localnet network
labels and program IDs differing from the generated IDL are rejected.
History is polled because transaction indexing may lag confirmed account changes.
There is no localStorage substitute for balances or transaction evidence.

## Deliberate limitations

- Not audited or production-ready. These tests are evidence of specific behavior,
  not a general security guarantee or reproducible deployment verification.
- A later deployment introduces upgrade-authority governance, new program IDs,
  deployment keys, fees, and operational risks that this VM milestone does not settle.
- No public deployment, token allowlist, metadata service or application indexer.
  Browser signing was tested through a test-only Wallet Standard provider using
  an authentic ephemeral Ed25519 key; installed wallet extensions remain unverified.
- Deposits are locked until activation or expiry; there is no cancellation, approval
  revocation, supplier replacement, partial settlement, automatic keeper, or dispute
  process. Paying suppliers does not guarantee the physical workshop occurs.
- Anyone can send tokens directly to an SPL vault. Such unsolicited transfers do
  **not** buy seats or count toward funding. Surplus is never paid or refundable by
  this program and remains locked. Use `deposit`, never a direct token transfer.
- Accounts remain rent funded after settlement. No rent reclamation or rescue
  instruction is provided; an empty expired campaign has no refund transaction to run.
- The test mint has a mint authority for test setup. Rejecting freeze authority does
  not establish a token's value or supply integrity. Real integration needs a reviewed
  mint policy, clear display units, and tests against the exact intended token.
- Concurrent/replay behavior beyond the executed cases, public-network performance,
  cluster RPC failures, wallet compatibility, and deployment permissions need further
  integration testing and independent review before considering funds with value.

Primary references: [Anchor 0.32.1 release notes](https://www.anchor-lang.com/docs/updates/release-notes/0-32-1),
[account constraints](https://www.anchor-lang.com/docs/references/account-constraints),
[SPL transfer CPIs](https://www.anchor-lang.com/docs/tokens/basics/transfer-tokens),
and [LiteSVM testing](https://www.anchor-lang.com/docs/testing/litesvm).
