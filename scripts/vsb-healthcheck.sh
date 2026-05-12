#!/usr/bin/env bash
# vsb-healthcheck.sh — Verify VSB mesh connectivity from Node B.
set -euo pipefail

NODES=(
    "node-a:100.90.196.70:8000"
    "node-b:100.66.173.31:9119"
    "node-c:100.102.109.81:8080"
    "node-d:100.120.225.12:8080"
)

FAIL=0

echo ":: VSB Mesh Connectivity Health-Check"
echo ""

# 1. Check Tailscale Artery
if command -v tailscale >/dev/null 2>&1; then
    if tailscale status >/dev/null 2>&1; then
        echo "[OK] Tailscale Artery: ACTIVE"
    else
        echo "[FAIL] Tailscale Artery: NOT ACTIVE"
        FAIL=1
    fi
else
    echo "[WARN] tailscale CLI not found"
fi

# 2. Check SOVEREIGN_MESH_SECRET
if [ -f "$HOME/.hermes/.env" ] && grep -q "^SOVEREIGN_MESH_SECRET=" "$HOME/.hermes/.env"; then
    echo "[OK] SOVEREIGN_MESH_SECRET: SET"
else
    echo "[FAIL] SOVEREIGN_MESH_SECRET: NOT SET in ~/.hermes/.env"
    FAIL=1
fi

# 3. Check each mesh node
for entry in "${NODES[@]}"; do
    IFS=':' read -r name ip port <<< "$entry"
    
    # ICMP ping (1s timeout)
    if ping -c 1 -W 1 "$ip" >/dev/null 2>&1; then
        echo "[OK] $name ($ip): REACHABLE (ICMP)"
    else
        echo "[FAIL] $name ($ip): UNREACHABLE (ICMP)"
        FAIL=1
        continue
    fi
    
    # HTTP inference endpoint (5s timeout)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$ip:$port/v1/models" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
        echo "[OK] $name ($ip:$port): inference endpoint UP (HTTP $HTTP_CODE)"
    else
        echo "[FAIL] $name ($ip:$port): inference endpoint DOWN (HTTP $HTTP_CODE)"
        FAIL=1
    fi
    
    # UDP pulse port
    if ! command -v nc >/dev/null 2>&1; then
        echo "[WARN] $name ($ip:7878/UDP): netcat (nc) not available for UDP check"
    elif nc -z -u -w 1 "$ip" 7878 2>/dev/null; then
        echo "[OK] $name ($ip:7878/UDP): pulse port OPEN"
    else
        echo "[WARN] $name ($ip:7878/UDP): pulse port check inconclusive (UDP)"
    fi
done

echo ""
if [ "$FAIL" -eq 0 ]; then
    echo ":: HEALTH-CHECK PASSED — VSB mesh is operational"
else
    echo ":: HEALTH-CHECK FAILED — see above for details"
fi

exit "$FAIL"
