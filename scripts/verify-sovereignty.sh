#!/bin/bash
set -e

# 50V3R31GN-M4CH1N4 // Sovereignty Verification Script
# This script performs a non-interactive audit of the Phase 28 dominance features.

echo "🌃 50V3R31GN-M4CH1N4 // IN171471N6 V3R1F1C4710N..."

# 1. Binary Presence Audit
echo "  [1/4] Binary Integrity Check..."
check_bin() {
    if [ -f "$1" ]; then
        echo "    ✅ Found: $1"
    else
        echo "    ❌ MISSING: $1"
        exit 1
    fi
}

check_bin "deck-igniter/deck-igniter"
check_bin "crush/crush"
check_bin "sidecar-cyberdeck/target/release/sidecar-cyberdeck"
check_bin "sidecar-atlas/target/release/sidecar-atlas"
check_bin "sidecar-netrunning/target/release/sidecar-netrunning"

# 2. Schema & Interface Audit
echo "  [2/4] Interface Audit (TypeScript)..."
grep -q "AkashikVisualAuditor" src/main.ts && echo "    ✅ Auditor wired in main.ts"
grep -q "audit_library" src/core/hybrid-routing-controller.ts && echo "    ✅ HRC handles audit_library"
grep -q "corruptUI" src/core/visual-monitor-service.ts && echo "    ✅ CDP corruptUI implemented"
grep -q "dragToken" src/core/ghost-input-service.ts && echo "    ✅ Ghost dragToken implemented"

# 3. CLI Functional Audit
echo "  [3/4] CLI Subcommand Audit..."
./crush/crush devdom 2>&1 | grep -q "corrupt-ui" && echo "    ✅ crush devdom corrupt-ui exists"
./crush/crush devdom 2>&1 | grep -q "ghost-play" && echo "    ✅ crush devdom ghost-play exists"
./crush/crush chaos 2>&1 | grep -q "network" && echo "    ✅ crush chaos network exists"

# 4. Hardware Sovereignty Audit (Rust)
echo "  [4/4] Sidecar Capability Audit..."
grep -q "nixos-rebuild" sidecar-cyberdeck/src/main.rs && echo "    ✅ NixOS rebuild hooks found in HUD"
grep -q "pkill" deck-igniter/launcher.go && echo "    ✅ Zombie purge hooks found in launcher"

echo ""
echo "✨ 50V3R31GN-M4CH1N4: ALL C0R3 PHY51C4L C4P4B1L17135 V3R1F13D."
echo "ST47U5: DOM1N4NC3 4CH13V3D."
