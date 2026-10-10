#!/usr/bin/env bash
# Public test network only. Never changes CLI config or requests faucet funds.
set -euo pipefail
FUSE_WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUSE_TOOLS="${FUSE_TOOLS:-/var/tmp/fuse-escrow-tools}"
export CARGO_HOME="$FUSE_TOOLS/cargo" RUSTUP_HOME="$FUSE_TOOLS/rustup" CARGO_TARGET_DIR="$FUSE_TOOLS/target"
export PATH="$CARGO_HOME/bin:$FUSE_TOOLS/solana-release/bin:$PATH"
cd "$FUSE_WORKSPACE"
FUSE_RPC=https://api.devnet.solana.com
FUSE_DEPLOYER="$HOME/.config/solana/fuse-devnet.json"
FUSE_PROGRAM_KEY="$FUSE_WORKSPACE/.wallets/devnet/program-keypair.json"
FUSE_BUFFER_KEY="$FUSE_WORKSPACE/.wallets/devnet/buffer-keypair.json"
FUSE_BINARY="$FUSE_WORKSPACE/target/devnet/fuse_escrow.so"
FUSE_ID=6R4NM7PX1jy2E3BhLohh2eoQaF2ubkwW6iNrmgYGViHf
FUSE_GENESIS=EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG
cli() { solana --url "$FUSE_RPC" --keypair "$FUSE_DEPLOYER" --commitment confirmed "$@"; }
guard() {
  test -f "$FUSE_DEPLOYER" || { echo "Owner-created wallet missing: $FUSE_DEPLOYER" >&2; exit 1; }
  test "$(cli genesis-hash)" = "$FUSE_GENESIS" || { echo 'Wrong RPC cluster; stopping.' >&2; exit 1; }
  test -f "$FUSE_PROGRAM_KEY" || { echo 'Dedicated ignored program keypair missing; do not substitute another identity.' >&2; exit 1; }
  test "$(solana address --keypair "$FUSE_PROGRAM_KEY")" = "$FUSE_ID" || { echo 'Program key/compiled source mismatch; stopping.' >&2; exit 1; }
  echo "Devnet upgrade authority: $(cli address)"
  cli balance
}
case "${1:-preflight}" in
  build)
    mkdir -p target/devnet
    cargo build-sbf --tools-version v1.52 --manifest-path programs/fuse-escrow/Cargo.toml --sbf-out-dir "$FUSE_WORKSPACE/target/devnet" -- --locked --features devnet
    cargo run --locked -p fuse-escrow --features devnet --example export_idl
    ;;
  preflight)
    guard
    test -f "$FUSE_BINARY"
    export FUSE_BINARY FUSE_RPC FUSE_DEPLOYER
    python3 scripts/devnet_preflight.py
    ;;
  deploy)
    guard
    export FUSE_BINARY FUSE_RPC FUSE_DEPLOYER
    python3 scripts/devnet_preflight.py
    umask 077
    if [[ ! -e "$FUSE_BUFFER_KEY" ]]; then
      solana-keygen new --silent --no-bip39-passphrase --outfile "$FUSE_BUFFER_KEY"
    fi
    # Sequential, bounded requests avoid the CLI's concurrent-upload rate limit.
    cargo run --locked -p fuse-escrow --features devnet --example localnet -- upload-buffer
    # Persistent ignored buffer identity makes an interrupted write resumable,
    # and prevents CLI failure output containing a generated recovery phrase.
    cli program deploy "$FUSE_BINARY" --program-id "$FUSE_PROGRAM_KEY" \
      --buffer "$FUSE_BUFFER_KEY" --upgrade-authority "$FUSE_DEPLOYER" \
      --max-len "$(stat -c %s "$FUSE_BINARY")" --use-rpc --max-sign-attempts 3
    cli program show "$FUSE_ID" --output json
    cli program dump "$FUSE_ID" target/devnet/deployed.so
    cmp "$FUSE_BINARY" target/devnet/deployed.so
    echo 'Verified deployed bytecode matches rebuilt Devnet binary exactly.'
    ;;
  scenarios)
    guard
    cargo run --locked -p fuse-escrow --features devnet --example localnet
    ;;
  upload-buffer)
    guard
    cargo run --locked -p fuse-escrow --features devnet --example localnet -- upload-buffer
    ;;
  check)
    cargo check --locked -p fuse-escrow --features devnet --all-targets
    ;;
  verify)
    # Public receipts only: no deployment or participant keys are needed.
    python3 scripts/verify_devnet.py
    ;;
  fund-test)
    guard
    test "$#" -eq 2 || { echo 'Supply only a disposable test public address.' >&2; exit 2; }
    # Explicit developer/test command; never invoked by the application.
    cli transfer "$2" 0.005 --allow-unfunded-recipient
    ;;
  prepare-browser)
    guard
    cargo run --locked -p fuse-escrow --features devnet --example localnet -- prepare-browser
    ;;
  test)
    export FUSE_PROGRAM_SO="$FUSE_BINARY"
    cargo test --locked -p fuse-escrow --features devnet --test escrow -- --test-threads=1
    ;;
  *) echo "Usage: $0 {build|preflight|deploy|upload-buffer|scenarios|prepare-browser|fund-test PUBLIC_ADDRESS|verify|check|test}" >&2; exit 2 ;;
esac
