#!/usr/bin/env bash
# scripts/ops/verify-quaternary-topology.sh
# v3.8.8 Topology Health Check

set -euo pipefail

echo "◈ 50V3R31GN-M4CH1N4 // TOPOLOGY_VERIFICATION // 1N171473D"

NODES=("100.102.95.43" "127.0.0.1" "10.0.0.12" "100.112.71.7")
NAMES=("Node A (Kernel)" "Node B (Director)" "Node C (Oracle)" "Node D (Quaternary)")

for i in "${!NODES[@]}"; do
    IP=${NODES[$i]}
    NAME=${NAMES[$i]}
    echo -n "● Testing $NAME ($IP)... "
    if ping -c 1 -W 1 "$IP" >/dev/null 2>&1; then
        echo "ONLINE ✓"
    else
        echo "OFFLINE ❌"
    fi
done

echo "◈ Checking Service Arteries (ClawLink Tunnels)..."
# Port 8081: Node D Oracle (Forwarded from 8080)
# Port 7339: Node C Stable (Forwarded)
# Port 7340: Node C Auditor (Forwarded)
# Port 6789: Node A Mooncake (Forwarded)
# Port 8080: Node B Director (Local)
# Port 7878: VSB UDP (Direct)

PORTS=(8080 8081 8083 8084 7339 7340 6789 7878)
NAMES=("Node B (Director)" "Node D (Gemma)" "Node D (Qwen)" "Node D (GLM)" "Node C (Qwen)" "Node C (Qwen)" "Node A (Mooncake)" "VSB Heartbeat")

for i in "${!PORTS[@]}"; do
    port=${PORTS[$i]}
    name=${NAMES[$i]}
    echo -n "  [Port $port] $name... "
    if nc -z -w 1 127.0.0.1 $port >/dev/null 2>&1; then
        echo "ACTIVE ✓"
    else
        echo "INACTIVE ❌"
    fi
done

echo "◈ --------------------------------------------------------"
echo "◈ VERIFICATION_COMPLETE."
