#!/usr/bin/env bash
# basement-net-lock.sh
# 50V3R31GN-M4CH1N4: Node A Permanent Network Lock (Password-Pipe Version)

PASS="ch00m"

# Detect the primary ethernet interface
INTERFACE=$(ip -o link show | awk -F': ' '{print $2}' | grep -v lo | head -n 1)

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_NETWORK_LOCK..."
echo "◈ Target Interface: $INTERFACE"

# Write the Netplan configuration using sudo -S
echo "$PASS" | sudo -S bash -c "cat > /etc/netplan/50-cloud-init.yaml <<EOF
network:
    ethernets:
        $INTERFACE:
            addresses:
            - 10.0.0.10/24
            nameservers:
                addresses:
                - 1.1.1.1
                - 8.8.8.8
            routes:
            - to: default
              via: 10.0.0.1
    version: 2
EOF"

# Apply the configuration
echo "◈ Applying Netplan configuration..."
echo "$PASS" | sudo -S netplan apply

echo "◈ ARTERY_LOCKED. Node A is now permanent at 10.0.0.10."
echo "◈ GATEWAY: 10.0.0.1 | DNS: 1.1.1.1, 8.8.8.8"
