#!/usr/bin/env bash
# 50V3R31GN-M4CH1N4: THE-PURGE-PROTOCOL
# Reclaims disk space by cleaning Rust artifacts and pruning dead worktree links.

set -e

echo "::/5Y573M-N071C3 : INITIATING PURGE PROTOCOL..."

# 1. Prune Worktree Links (Safe)
echo ">> PRUNING DEAD WORKTREE LINKS..."
git worktree prune

# 2. List Active Worktrees (For Manual Review)
echo ">> ACTIVE WORKTREES (Audit Manually):"
git worktree list

# 3. Clean Rust Targets
echo ">> INCINERATING RUST ARTIFACTS..."
RUST_DIRS=("sidecar-atlas" "sidecar-netrunning" "sidecar-cyberdeck" "zeroclaw" "sovereign-sdk")

for dir in "${RUST_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  >> Cleaning $dir..."
        (cd "$dir" && cargo clean)
    fi
done

# 4. Final Re-Audit
echo "::/5Y573M-N071C3 : PURGE COMPLETE."
du -sh .
