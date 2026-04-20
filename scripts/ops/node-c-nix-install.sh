#!/usr/bin/env bash
# scripts/ops/node-c-nix-install.sh
# 50V3R31GN-M4CH1N4: Node C Nix Installation (Multi-User)

PASS="ch00m"

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_NIX_INSTALL (Node C)..."

# 1. Install Nix via the official daemon-based multi-user installer
echo "◈ Fetching Nix installer..."
curl -L https://nixos.org/nix/install | sh -s -- --daemon

# 2. Add maczz to nix-users group
echo "◈ Configuring user permissions..."
echo "$PASS" | sudo -S usermod -aG nix-users maczz

echo "◈ NIX_INSTALL_COMPLETE. Please log out and back in to finalize PATH."
