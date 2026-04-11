#!/usr/bin/env bash
# 50V3R31GN-M4CH1N4: GHOST BOOT SCRIPT
# Headless ignition sequence for automated live-fire audits

echo "::/5Y573M-N071C3 : INITIATING GHOST BOOT PROTOCOL..."

export PROJECT_ROOT="/home/nixos/50V3R31GN-M4CH1N4"
cd "$PROJECT_ROOT"

# Boot Supervisor (Layer 2/3) — deck-igniter handles Orchestrator & Sidecars & Windows
echo ">> IGNITING SUPERVISOR (deck-igniter)..."
# Use </dev/null to avoid TTY requirement
HEADLESS=1 AUTO_IGNITE=1 "$PROJECT_ROOT/deck-igniter-cli" ghost < /dev/null > "$PROJECT_ROOT/data/logs/deck-igniter.log" 2>&1 &
DECK_IGNITER_PID=$!

echo "::/5Y573M-N071C3 : GHOST BOOT SEQUENCE DISPATCHED."
echo "Deck-Igniter running on PID: $DECK_IGNITER_PID"
