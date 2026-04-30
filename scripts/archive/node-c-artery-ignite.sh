#!/usr/bin/env bash
# scripts/ops/node-c-artery-ignite.sh
set -e
PROJECT_ROOT="$HOME/50V3R31GN-M4CH1N4"
cd "$PROJECT_ROOT/zeroclaw"

# Load Nix dependencies (this is a hack to get LD_LIBRARY_PATH etc)
# Better: just use the binary and trust the nix-shell wrapper if it was built via nix.
# But since we built it inside nix develop, we should run it there.

nix develop ..#default --command ./target/release/artery_manager
