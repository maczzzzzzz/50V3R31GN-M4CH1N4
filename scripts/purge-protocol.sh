#!/usr/bin/env bash
# 50V3R31GN-M4CH1N4: THE-PURGE-PROTOCOL
# Reclaims disk space and removes failed hardware bridge artifacts.

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
        (cd "$dir" && cargo clean 2>/dev/null || true)
    fi
done

# 4. Clean Hardware Bridge Artifacts (Failed WSL/ROCm Pivot)
echo ">> REMOVING FAILED HARDWARE ARTIFACTS..."
ARTIFACTS=(
    "librocdxg"
    "vk_test"
    "vk_test.c"
    "vk_test_devices"
    "vk_test_devices.c"
    "test_dzn.sh"
    "test_dzn_adapter.sh"
    "test_vulkan.sh"
    "strace.out"
)

for art in "${ARTIFACTS[@]}"; do
    if [ -e "$art" ]; then
        echo "  >> Deleting $art..."
        rm -rf "$art"
    fi
done

# 5. Build/Dist Artifacts
echo ">> FLUSHING BUILD DIRECTORIES..."
BUILD_DIRS=("dist" "build")
for dir in "${BUILD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  >> Cleaning $dir..."
        rm -rf "$dir"
    fi
done

# 6. Final Re-Audit
echo "::/5Y573M-N071C3 : PURGE COMPLETE."
du -sh .
