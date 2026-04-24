#!/usr/bin/env bash
# scripts/ops/node-surgical-sync.sh
# 50V3R31GN-M4CH1N4: Phase 71 — ARCHITECTURAL_SOCIOTOMY_SYNC
#
# Surgically synchronizes logic/configs across Node A and Node C
# while purging bloat (models, node_modules, archives).

set -euo pipefail

NODE_A_IP="10.0.0.10"
NODE_C_IP="10.0.0.12"
TARGET_DIR="/home/nixos/50V3R31GN-M4CH1N4"

# ---------------------------------------------------------------------------
# ◈ THE EXCLUSION LIST (THE BLOAT PURGE)
# ---------------------------------------------------------------------------
EXCLUDES=(
    "--exclude=node_modules/"
    "--exclude=.git/"
    "--exclude=.factory/logs/"
    "--exclude=data/archive/"
    "--exclude=data/models/"
    "--exclude=models/"
    "--exclude=*.gguf"
    "--exclude=*.safetensors"
    "--exclude=*.heapsnapshot"
    "--exclude=.optical-venv/"
    "--exclude=target/"
    "--exclude=dist/"
    "--exclude=.gemini/tmp/"
)

# ---------------------------------------------------------------------------
# ◈ SURGICAL SYNC FUNCTION
# ---------------------------------------------------------------------------
sync_node() {
    local node_name=$1
    local node_ip=$2
    
    echo "::/5Y573M-N071C3 : PURGING_AND_SYNCING_${node_name}..."
    
    # --delete-excluded ensures that if bloat was previously mirrored, it is now PURGED.
    rsync -avz --delete --delete-excluded \
        "${EXCLUDES[@]}" \
        ./ "$node_ip:$TARGET_DIR/"
        
    echo "● ${node_name}_SYNC_COMPLETE."
}

# ---------------------------------------------------------------------------
# ◈ EXECUTION
# ---------------------------------------------------------------------------
echo "::/5Y573M-N071C3 : INITIATING_SURGICAL_PARITY_PROTOCOL..."

# Sync Node A (Synapse)
sync_node "NODE_A" "$NODE_A_IP"

# Sync Node C (Strategic Oracle)
sync_node "NODE_C" "$NODE_C_IP"

echo "::/5Y573M-N071C3 : SURGERY_COMPLETE. SLATE_IS_CLEAN. // 50V3R31GN-M4CH1N4"
