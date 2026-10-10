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
  *) echo "Usage: $0 {build|test|prepare-tests|check|fmt|format|resolve}" >&2; exit 2 ;;
esac
