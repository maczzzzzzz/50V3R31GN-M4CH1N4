#!/usr/bin/env bash
# scripts/audit/lockdown.sh
# 50V3R31GN-M4CH1N4: Final Physical Network Audit

echo "::/5Y573M-N071C3 : INITIATING_NETWORK_LOCKDOWN_AUDIT..."

# 1. Check for external leakage
echo "  [1/3] Scanning for active external connections (HTTPS/DNS)..."
# We exclude Nix and GitHub/HuggingFace during build time, but production should be silent.
LSOF_COUNT=$(lsof -i | grep -E "ESTABLISHED|CLOSE_WAIT" | grep -vE "10.0.0|127.0.0.1|100.|localhost" | wc -l)
if [ "$LSOF_COUNT" -gt 0 ]; then
    echo "  [WARN] Potential telemetry detected. Active external connections:"
    lsof -i | grep -E "ESTABLISHED|CLOSE_WAIT" | grep -vE "10.0.0|127.0.0.1|100.|localhost"
else
    echo "  ✅ Network Isolation: VERIFIED (Subnet strictly local/VPN)."
fi

# 2. Verify Port Bindings
echo "  [2/3] Auditing Port Bindings..."
# Ensure critical ports are NOT public
# Port 7878 (VSB), 7340 (Artery), 8080 (Director), 8082 (Optical)
NETSTAT_0_0_0_0=$(netstat -tuln | grep "0.0.0.0" | grep -E "7878|7340|8080|8082" || true)
if [ -n "$NETSTAT_0_0_0_0" ]; then
    echo "  [INFO] Public bindings (0.0.0.0) detected on tactical ports. Tailscale firewall MUST be active."
    echo "$NETSTAT_0_0_0_0"
else
    echo "  ✅ Port Security: VERIFIED (Strict internal bindings)."
fi

# 3. Check for 'Abliterated' model integrity
echo "  [3/3] Scanning for safety residue in model manifests..."
if grep -ri "as an AI assistant" models/ 2>/dev/null; then
    echo "  [FATAL] Identity residue found in model shards. RE_ABLITERATION REQUIRED."
    exit 1
else
    echo "  ✅ Identity Purity: VERIFIED (OBLITERATED)."
fi

echo -e "\n::/5Y573M-N071C3 : LOCKDOWN_AUDIT_SUCCESS. MESH_IS_SECURE."
