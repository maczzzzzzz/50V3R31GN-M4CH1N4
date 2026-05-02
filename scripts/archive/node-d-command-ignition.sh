#!/usr/bin/env bash
# scripts/ops/node-d-command-ignition.sh
# v3.8.8 Node D (Quaternary Oracle) Command Stack Ignition

set -euo pipefail

PROJECT_ROOT="$HOME/50V3R31GN-M4CH1N4"
cd "$PROJECT_ROOT"

echo "◈ 50V3R31GN-M4CH1N4 // NODE_D_COMMAND_IGNITION // 1N171473D"

# Ignition Sequence
nix develop .#quaternary --command bash -c "
    echo '● [STAGE 0] Cleaning Stale Arteries...'
    pkill -f hermes-router || true
    pkill -f "tsx packages/hermes-core/src/core/hermes/node-d-command.ts" || true
    sleep 2

    echo '● [STAGE 1] Validating Environment...'
    node -v
    pnpm -v
    
    echo '● [STAGE 2] Igniting Hermes Router (Node D Variant)...'
    # Binary is pre-synced via local build
    chmod +x ./target/debug/hermes-router
    
    # Environment Mappings for Node D:
    # All Node D requests route to the local Swapper (Port 8080)
    export NODE_D_ORACLE_URL="http://127.0.0.1:8080"
    export NODE_D_AUDITOR_URL="http://127.0.0.1:8080"
    export NODE_D_FLASH_URL="http://127.0.0.1:8080"
    export NODE_B_URL="http://127.0.0.1:8082"
    export NODE_C_URL="http://127.0.0.1:7339"
    export NODE_ID="NODE-D"
    
    ./target/debug/hermes-router > ~/hermes-router.log 2>&1 &
    ROUTER_PID=\$!
    
    echo '● [STAGE 3] Igniting Sovereign Swapper...'
    npx tsx packages/hermes-core/src/core/hermes/node-d-swapper.ts > ~/swapper.log 2>&1 &
    SWAPPER_PID=\$!

    echo '● [STAGE 4] Igniting Hermes Singularity Daemon...'
    npx tsx packages/hermes-core/src/core/hermes/node-d-command.ts > ~/singularity.log 2>&1 &
    SINGULARITY_PID=\$!
    
    echo '◈ NODE D COMMAND STACK LIVE.'
    echo '  Router PID: \$ROUTER_PID'
    echo '  Singularity PID: \$SINGULARITY_PID'
"
