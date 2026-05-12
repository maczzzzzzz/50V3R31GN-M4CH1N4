#!/usr/bin/env bash
# Node D Dual-UI Setup Script
# Sets up Hermes Desktop and Herm TUI concurrent sessions

set -e

echo ":: NODE D DUAL-UI SETUP ::"
echo ":: Installing Herm TUI via Bun..."

# Install Herm TUI globally
bun add -g herm-tui

echo ":: Verifying installation..."
if command -v herm &> /dev/null; then
    echo ":: Herm TUI installed successfully"
else
    echo ":: ERROR: Herm TUI installation failed"
    exit 1
fi

echo "::"
echo ":: HERMES DESKTOP SETUP ::"
echo ":: Location: /home/nixos/50V3R31GN-M4CH1N4/dashboard/hermes-desktop"

cd /home/nixos/50V3R31GN-M4CH1N4/dashboard/hermes-desktop

if [ ! -d "node_modules" ]; then
    echo ":: Installing dependencies..."
    npm install
fi

echo "::"
echo ":: DUAL-UI USAGE ::"
echo "::"
echo ":: 1. Start Hermes Desktop (Primary UI)"
echo "    cd dashboard/hermes-desktop && npm start"
echo "::"
echo ":: 2. Start Herm TUI (Terminal Dashboard)"
echo "    herm"
echo "::"
echo ":: Both interfaces can run concurrently on Node D"
echo "::"

echo ":: DUAL-UI SETUP COMPLETE ::"
