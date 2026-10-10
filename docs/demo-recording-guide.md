# Record the FUSE local-validator demonstration

Use disposable local tokens only. No recording has been created by these scripts.

1. In the repository root, build the pinned program and generate its interface:
   ```powershell
   wsl.exe -d Ubuntu -- bash /mnt/c/Users/User/Desktop/fuse-marketplace/anchor/scripts/run-linux.sh build
   wsl.exe -d Ubuntu -- bash /mnt/c/Users/User/Desktop/fuse-marketplace/anchor/scripts/run-linux.sh idl
   ```
2. Start the validator in one terminal and keep it running:
   ```powershell
   wsl.exe -d Ubuntu -- bash /mnt/c/Users/User/Desktop/fuse-marketplace/anchor/scripts/run-linux.sh validator
   ```
   The program is loaded at genesis at the ID declared in Rust. This is a real
   validator, with upgrades disabled; there is no deployment transaction signature.
   An existing ledger is reused. After changing the binary, explicitly add
   `--reset` to this command to discard only the dedicated disposable local ledger.
3. In a second terminal run:
   ```powershell
   wsl.exe -d Ubuntu -- bash /mnt/c/Users/User/Desktop/fuse-marketplace/anchor/scripts/run-linux.sh localnet
   ```
   Each run creates fresh disposable identities and a six-decimal test mint.
   Private fixture keys exist only in process memory. The script submits signed
   transactions through RPC and checks their confirmation and account state.
4. Present scenario A: creation, eight seats, two more seats, actual vault balance
   **200 tokens = 200,000,000 base units**, rejected activation without approvals,
   rejected unauthorized approval, authentic venue/instructor approvals, activation.
   Show the observed **80 / 120** supplier balances and **zero** vault balance.
   Show that the second activation is a confirmed failed transaction.
5. Present scenario B: two seats deposited (**40 tokens**), a 15-second deadline,
   bounded polling of the validator's actual Clock, rejected late activation,
   contributor-signed refund, restored attendee balance (**800 tokens at this
   checkpoint**), zero vault balance, and rejected repeated refund. A third ready
   campaign then uses another 200 tokens, leaving the attendee with 600.
6. Open ignored `anchor/localnet/receipt.json`. It contains only public addresses,
   signatures, slots, expected failure outcomes and checked balances. Compare the
   program ID with `anchor/idl/fuse_escrow.json` and `declare_id!` in Rust. Inspect
   these signatures through local RPC, not a public explorer; localnet transactions
   do not exist on Devnet or Mainnet. The receipt is evidence for this ledger only;
   resetting the validator invalidates its references. Save a fresh receipt with
   your recording, without private keys.
7. End with the limitation: this unaudited proof of concept coordinates booking
   formation and payouts. It does not guarantee workshop delivery or resolve disputes.

The original `/marketplace` remains a localStorage simulation. Its mock role
selector and demo clock are never evidence of blockchain authorization or time.
