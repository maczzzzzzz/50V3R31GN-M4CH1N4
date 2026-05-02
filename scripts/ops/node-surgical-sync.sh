#!/usr/bin/env bash
# scripts/ops/node-surgical-sync.sh
# 50V3R31GN-M4CH1N4: v3.7.0 — ARCHITECTURAL_SOCIOTOMY_SYNC
#
# Role-based synchronization for Node A (Synapse) and Node C (Oracle)

set -euo pipefail

NODE_A_IP="10.0.0.10"
NODE_C_IP="10.0.0.12"
TARGET_DIR="/home/maczz/50V3R31GN-M4CH1N4"

# Global Exclusions (Bloat)
GLOBAL_EXCLUDES=(
    "--exclude=node_modules/"
    "--exclude=.git/"
    "--exclude=data/archive/"
    "--exclude=models/"
    "--exclude=*.gguf"
    "--exclude=*.safetensors"
    "--exclude=target/"
    "--exclude=dist/"
)

# ---------------------------------------------------------------------------
# ◈ NODE A (THE SYNAPSE): VISION & KV-MASTER
# ---------------------------------------------------------------------------
sync_node_a() {
    echo "::/5Y573M-N071C3 : SYNCING_NODE_A (SYNAPSE)..."
    ssh "maczz@$NODE_A_IP" "mkdir -p $TARGET_DIR"
    rsync -avz --delete --delete-excluded \
        "${GLOBAL_EXCLUDES[@]}" \
        "--exclude=dashboard/" \
        "--exclude=crates/sidecar-cyberdeck/" \
        "--exclude=crates/sidecar-atlas/" \
        "--exclude=docs/raw_data/" \
        ./ "maczz@$NODE_A_IP:$TARGET_DIR/"
}

# ---------------------------------------------------------------------------
# ◈ NODE C (THE ORACLE): LOGIC & RULE ARBITRATION
# ---------------------------------------------------------------------------
sync_node_c() {
    echo "::/5Y573M-N071C3 : SYNCING_NODE_C (ORACLE)..."
    ssh "maczz@$NODE_C_IP" "mkdir -p $TARGET_DIR"
    rsync -avz --delete --delete-excluded \
        "${GLOBAL_EXCLUDES[@]}" \
        "--exclude=dashboard/" \
        "--exclude=crates/sidecar-cyberdeck/" \
        "--exclude=scripts/ops/node-a-*" \
        ./ "maczz@$NODE_C_IP:$TARGET_DIR/"
}

echo "::/5Y573M-N071C3 : INITIATING_SURGICAL_PARITY_V3_7_0..."

sync_node_a
sync_node_c

echo "::/5Y573M-N071C3 : SURGERY_COMPLETE. PODS_ALIGNED_TO_ROLES. // 50V3R31GN-M4CH1N4"
