#!/usr/bin/env bash
# scripts/ops/blackbox-node.sh
# 50V3R31GN-M4CH1N4: Node Hardening (Zero-Trust Blackbox)
# Targeted Nodes: Node A (10.0.0.10) and Node C (10.0.0.12)

PASS="ch00m"

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_BLACKBOX_HARDENING..."

# 1. Reset UFW (Uncomplicated Firewall)
echo "◈ Resetting firewall policies..."
echo "$PASS" | sudo -S ufw --force reset

# 2. Set Default Deny (Fail-Closed)
echo "◈ Locking all inbound/outbound arteries..."
echo "$PASS" | sudo -S ufw default deny incoming
echo "$PASS" | sudo -S ufw default deny outgoing

# 3. Whitelist Node B (The Director)
# Allows the Director to command the Node and receive telemetry
echo "◈ Whitelisting Node B (Director: 10.0.0.11)..."
echo "$PASS" | sudo -S ufw allow from 10.0.0.11 to any
echo "$PASS" | sudo -S ufw allow out to 10.0.0.11

# 4. Whitelist Gateway (The Archer: 10.0.0.1)
# Required for DNS and external package updates
echo "◈ Whitelisting Gateway (10.0.0.1) for Artery Sync..."
echo "$PASS" | sudo -S ufw allow out to 10.0.0.1 port 53 proto udp
echo "$PASS" | sudo -S ufw allow out to 10.0.0.1 port 80,443 proto tcp

# 5. Enable Firewall
echo "◈ Activating Blackbox Shield..."
echo "$PASS" | sudo -S ufw --force enable

echo "◈ BLACKBOX_STATUS: LOCKED. Node is sealed to Node B / Gateway."
echo "◈ Verify via: sudo ufw status verbose"
