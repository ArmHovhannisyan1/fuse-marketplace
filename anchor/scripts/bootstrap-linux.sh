#!/usr/bin/env bash
set -euo pipefail

# Dedicated compiler caches; this script never loads a wallet or changes shell files.
FUSE_TOOLS="${FUSE_TOOLS:-/var/tmp/fuse-escrow-tools}"
mkdir -p "$FUSE_TOOLS"
export CARGO_HOME="$FUSE_TOOLS/cargo"
export RUSTUP_HOME="$FUSE_TOOLS/rustup"
export PATH="$CARGO_HOME/bin:$FUSE_TOOLS/solana-release/bin:$PATH"

if ! command -v cc >/dev/null; then
  echo "Install Linux build prerequisites first: build-essential pkg-config libssl-dev clang libclang-dev protobuf-compiler" >&2
  exit 1
fi
if ! command -v rustup >/dev/null; then
  curl --proto '=https' --tlsv1.2 -fsSL https://sh.rustup.rs -o "$FUSE_TOOLS/rustup-init.sh"
  sh "$FUSE_TOOLS/rustup-init.sh" -y --no-modify-path --profile minimal --default-toolchain 1.89.0
fi
rustup toolchain install 1.89.0 --profile minimal --component rustfmt --component clippy
if ! command -v cargo-build-sbf >/dev/null; then
  curl --proto '=https' --tlsv1.2 -fL --retry 2 \
    https://github.com/anza-xyz/agave/releases/download/v2.3.0/solana-release-x86_64-unknown-linux-gnu.tar.bz2 \
    -o "$FUSE_TOOLS/solana-release.tar.bz2"
  tar -xjf "$FUSE_TOOLS/solana-release.tar.bz2" -C "$FUSE_TOOLS"
fi
rustc --version
cargo --version
solana --version
cargo-build-sbf --version
