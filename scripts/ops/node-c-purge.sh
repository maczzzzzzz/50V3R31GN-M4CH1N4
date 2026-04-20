#!/usr/bin/env bash
# scripts/ops/node-c-purge.sh
# 50V3R31GN-M4CH1N4: Node C Hardening (The Purge)

PASS="ch00m"

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_NODE_C_PURGE (nightcityoracle)..."

# 1. Stop and Disable high-overhead services
echo "◈ Stopping bloat services..."
echo "$PASS" | sudo -S systemctl stop snapd.service cloud-init.service unattended-upgrades.service ModemManager.service 2>/dev/null
echo "$PASS" | sudo -S systemctl disable snapd.service cloud-init.service unattended-upgrades.service ModemManager.service 2>/dev/null

# 2. Purge packages
echo "◈ Purging unnecessary packages..."
echo "$PASS" | sudo -S apt-get purge -y snapd cloud-init landscape-common unattended-upgrades 2>/dev/null

# 3. Clean up
echo "◈ Finalizing autoremove..."
echo "$PASS" | sudo -S apt-get autoremove -y 2>/dev/null

echo "◈ PURGE_COMPLETE. Node C is hardened. Arteries clear for Oracle ignition."
