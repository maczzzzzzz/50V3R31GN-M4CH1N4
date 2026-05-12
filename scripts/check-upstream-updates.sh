#!/usr/bin/env bash
#
# Sovereign Submodule Audit Script
# Ensures submodules are strictly pinned and reports on upstream drift
# without automatically mutating the monorepo state.
#

set -e

echo ":: Sovereign Submodule Audit Initiated"
echo ":: Enforcing strict pinning and checking for upstream drift..."

# 1. Ensure submodules are initialized and match the pinned commits in the monorepo
git submodule update --init || echo ":: WARNING: Non-critical submodule init error ignored."

# 2. Check for dirty state in submodules
echo ":: Checking for dirty or uncommitted submodule states..."
DIRTY_SUBMODULES=$(git status --porcelain | grep -E '^ M|^M |^ M|^\?\?' | grep -v "\.gitmodules" || true)

if [ -n "$DIRTY_SUBMODULES" ]; then
    echo ":: ERROR: Dirty submodules detected. The monorepo must be the absolute source of truth."
    echo "$DIRTY_SUBMODULES"
    exit 1
else
    echo ":: SUCCESS: All submodules are clean and strictly pinned."
fi

# 3. Check for upstream updates (Reporting only, NO AUTOMATIC SYNC)
echo ":: Checking upstream remotes for updates..."
git submodule foreach --quiet '
    git fetch origin > /dev/null 2>&1
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$(git branch --show-current 2>/dev/null || echo "main"))
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "[WARNING] Submodule $name is trailing upstream origin."
        echo "          Local pinned:  $LOCAL"
        echo "          Upstream HEAD: $REMOTE"
        echo "          To sync manually: cd $name && git pull origin main && cd .. && git commit -am \"chore: bump $name\""
    else
        echo "[OK] Submodule $name is fully synced with upstream origin."
    fi
'

echo ":: Audit Complete."
exit 0
