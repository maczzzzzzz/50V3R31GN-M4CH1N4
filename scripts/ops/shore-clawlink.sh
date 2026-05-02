#!/usr/bin/env bash
# scripts/ops/shore-clawlink.sh
# v3.8.8 ClawLink Persistent Artery Automation

set -euo pipefail

echo "◈ 50V3R31GN-M4CH1N4 // CLAWLINK_SHORING // 1N171473D"

# Target Nodes
# Node D: Quaternary Oracle (100.112.71.7)
# Node C: Strategic Oracle (10.0.0.12)
# Node A: Kernel Artery (100.102.95.43)

NODES=("maczz@100.112.71.7" "maczz@10.0.0.12" "maczz@100.102.95.43")

# Clear existing tunnels to avoid port conflicts
pkill -f "ssh -f -N -L" || true

for node in "${NODES[@]}"; do
    echo "● Establishing Artery to $node..."
    
    # Verify SSH
    if ssh -o BatchMode=yes -o ConnectTimeout=5 "$node" exit >/dev/null 2>&1; then
        echo "  [SSH] Verified ✓"
    else
        echo "  [SSH] Artery Severed! Manual key sync required for $node. ❌"
        continue
    fi

    echo "  [Tunnels] Igniting persistent SSH tunnels..."
    
    if [[ "$node" == *"100.112.71.7" ]]; then
        # Local 8081 -> Node D 8080 (Sovereign Swapper)
        ssh -f -N -L 8081:localhost:8080 "$node"
        
        # Reverse: Node D 8082-back -> Local 8080 (Director)
        ssh -f -N -R 8082:localhost:8080 "$node"
        # Reverse: Node D 7339-back -> Local 7339 (Oracle)
        ssh -f -N -R 7339:localhost:7339 "$node"
        
        echo "  [Artery] 127.0.0.1:8081 -> $node:8080 (Node D Swapper) [ESTABLISHED]"
        echo "  [Reverse] $node:8082 -> 127.0.0.1:8080 (Node B Director) [ESTABLISHED]"
    fi

    if [[ "$node" == *"10.0.0.12" ]]; then
        # Local 7339 -> Node C 7339 (Stable Oracle)
        # Local 7340 -> Node C 7340 (Qwen Auditor)
        ssh -f -N -L 7339:localhost:7339 "$node"
        ssh -f -N -L 7340:localhost:7340 "$node"
        echo "  [Artery] 127.0.0.1:7339 -> $node:7339 (Node C Qwen-Oracle) [ESTABLISHED]"
        echo "  [Artery] 127.0.0.1:7340 -> $node:7340 (Node C Qwen) [ESTABLISHED]"
    fi

    if [[ "$node" == *"100.102.95.43" ]]; then
        # Local 6789 -> Node A 6789 (Mooncake Master)
        ssh -f -N -L 6789:localhost:6789 "$node"
        echo "  [Artery] 127.0.0.1:6789 -> $node:6789 (Node A Mooncake) [ESTABLISHED]"
    fi
done

echo "◈ CLAWLINK_BACKBONE_ACTIVE."
