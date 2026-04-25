#!/usr/bin/env bash
# scripts/ops/reconstruct-os-palace.sh
# 50V3R31GN-M4CH1N4: Phase 73 — Sovereign OS Hierarchical Weaving (v3.5.2)
#
# Usage: bash scripts/ops/reconstruct-os-palace.sh

set -euo pipefail

OS_VAULT="/mnt/d/Obsidian_Sovereign_OS"
DB="data/SovereignIntelligence.db"

echo ">> INITIALIZING SOVEREIGN KNOWLEDGE TREES..."

# 1. Purge redundant mirrored directories to kill orphans
rm -rf "$OS_VAULT/Guides" "$OS_VAULT/Phases" "$OS_VAULT/Specs" "$OS_VAULT/Plans"

# 2. Re-create clean structure
mkdir -p "$OS_VAULT/Phases" "$OS_VAULT/Specs" "$OS_VAULT/Plans" "$OS_VAULT/Research"

# 3. Mirror ROOT Manifests (Already linked in source)
cp *.md "$OS_VAULT/"

# 4. Mirror AKASHIK_GUIDES (Already linked in source)
cp -r akashik_guides "$OS_VAULT/"

# 5. Mirror Technical Shards (Already linked in source)
cp docs/superpowers/specs/*.md "$OS_VAULT/Specs/"
cp docs/superpowers/plans/*.md "$OS_VAULT/Plans/"
cp docs/superpowers/research/*.md "$OS_VAULT/Research/"

# 6. Sanitize Windows Filenames (Remove colons and emojis)
find "$OS_VAULT" -name "*[:🌐✅🧠⚡🛡️🌘🚀]*" | while read -r f; do
    new_name=$(echo "$f" | sed 's/[:🌐✅🧠⚡🛡️🌘🚀]//g' | sed 's/ /_/g')
    mv "$f" "$new_name" 2>/dev/null || true
done

# 7. Materialize Tree Hubs in Vault
cat <<EOP > "$OS_VAULT/OS_CORE.md"
# ◈ SOVEREIGN OS CORE
PARENT :: [[NAVIGATOR]]
---
- [[PHASE_TREE]]
- [[SPEC_TREE]]
- [[PLAN_TREE]]
- [[GUIDE_TREE]]
EOP

# 8. Dynamic Kanban Roadmap Sync
echo ">> SYNCHRONIZING KANBAN ROADMAP..."
KANBAN_FILE="$OS_VAULT/Sovereign-Roadmap.md"

# Use high-fidelity Node.js generator to ensure status accuracy
npx tsx scripts/ops/generate-kanban.ts > "$KANBAN_FILE"

# 9. Shard Kanban state to DB
sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('Sovereign-Roadmap.md', 'VISUALIZES', 'ROADMAP_STATE');"

echo ">> KNOWLEDGE TREES WOVEN. KANBAN AUTOMATED."
