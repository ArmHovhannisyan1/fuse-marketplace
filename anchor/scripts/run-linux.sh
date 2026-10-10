#!/usr/bin/env bash
set -euo pipefail

FUSE_WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUSE_TOOLS="${FUSE_TOOLS:-/var/tmp/fuse-escrow-tools}"
export CARGO_HOME="$FUSE_TOOLS/cargo"
export RUSTUP_HOME="$FUSE_TOOLS/rustup"
export CARGO_TARGET_DIR="$FUSE_TOOLS/target"
export PATH="$CARGO_HOME/bin:$FUSE_TOOLS/solana-release/bin:$PATH"
cd "$FUSE_WORKSPACE"

case "${1:-test}" in
  build)
    mkdir -p target/deploy
    # Agave 2.3 defaults to an older SBF Cargo that cannot parse edition-2024
    # transitive dependencies. Pin the matching modern platform tools explicitly.
    cargo build-sbf --tools-version v1.52 --manifest-path programs/fuse-escrow/Cargo.toml --sbf-out-dir "$FUSE_WORKSPACE/target/deploy" -- --locked
    ;;
  test)
    export FUSE_PROGRAM_SO="$FUSE_WORKSPACE/target/deploy/fuse_escrow.so"
    if [[ ! -f "$FUSE_PROGRAM_SO" ]]; then
      echo "Build the program first: bash anchor/scripts/run-linux.sh build" >&2
      exit 1
    fi
    cargo test --locked -p fuse-escrow --test escrow -- --test-threads=1
    ;;
  check)
    cargo check --locked -p fuse-escrow --all-targets
    ;;
  prepare-tests)
    cargo test --locked -p fuse-escrow --test escrow --no-run
    ;;
  fmt)
    cargo fmt --all -- --check
    ;;
  format)
    cargo fmt --all
    ;;
  resolve)
    cargo generate-lockfile
    ;;
  idl)
    cargo run --locked -p fuse-escrow --example export_idl
    ;;
  validator)
    if [[ ! -f "$FUSE_WORKSPACE/target/deploy/fuse_escrow.so" ]]; then
      echo "Build first: bash anchor/scripts/run-linux.sh build" >&2
      exit 1
    fi
    FUSE_PROGRAM_ID="$(sed -n 's/^declare_id!("\([^"]*\)");/\1/p' programs/fuse-escrow/src/lib.rs)"
    test -n "$FUSE_PROGRAM_ID"
    # A dedicated disposable ledger on Linux's filesystem. No cluster cloning.
    # Reset is explicit, restricted to this path, and never the user's other ledger.
    FUSE_LEDGER="$FUSE_TOOLS/fuse-localnet-ledger"
    mkdir -p "$FUSE_LEDGER"
    echo "Local genesis deployment: $FUSE_PROGRAM_ID (upgrades disabled)"
    echo "Disposable ledger: $FUSE_LEDGER; Ctrl+C stops the validator."
    FUSE_RESET=()
    if [[ "${2:-}" == "--reset" ]]; then FUSE_RESET=(--reset); fi
    export RUST_LOG="${RUST_LOG:-warn}"
    # Unused disposable public SOL recipient; avoid relying on the CLI's default
    # wallet. Its ephemeral key was discarded. Scenarios use the local faucet.
    exec solana-test-validator --ledger "$FUSE_LEDGER" --bind-address 127.0.0.1 \
      --mint DtKiG54KNirkJYWKhqqsYrLqLbKV7LsMAh5VNrpNUoqY \
      --rpc-port 8899 --limit-ledger-size 1000000 --log \
      --bpf-program "$FUSE_PROGRAM_ID" "$FUSE_WORKSPACE/target/deploy/fuse_escrow.so" \
      "${FUSE_RESET[@]}"
    ;;
  localnet)
    cargo run --locked -p fuse-escrow --example localnet
    ;;
  *) echo "Usage: $0 {build|test|prepare-tests|check|fmt|format|resolve|idl|validator [--reset]|localnet}" >&2; exit 2 ;;
esac
