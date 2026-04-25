#!/usr/bin/env bash
# scripts/ops/reconstruct-os-palace.sh
# 50V3R31GN-M4CH1N4: Phase 73 — Sovereign OS Hierarchical MemPalace
#
# Usage: bash scripts/ops/reconstruct-os-palace.sh

set -euo pipefail

OS_VAULT="/mnt/d/Obsidian_Sovereign_OS"
DB="data/SovereignIntelligence.db"

echo ">> INITIALIZING SOVEREIGN KNOWLEDGE TREES..."

# 1. Materialize Root Nodes in DB
sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('OS_CORE', 'ROOT_OF', 'GUIDE_TREE');"
sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('OS_CORE', 'ROOT_OF', 'PHASE_TREE');"
sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('OS_CORE', 'ROOT_OF', 'RESEARCH_TREE');"
sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('OS_CORE', 'ROOT_OF', 'SPEC_TREE');"

# 2. Weave Guide Tree (akashik_guides)
echo ">> WEAVING GUIDE TREE..."
find akashik_guides -maxdepth 1 -type d -not -path akashik_guides | while read -r dir; do
    dir_name=$(basename "$dir")
    sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('GUIDE_TREE', 'PARENT_OF', '$dir_name');"
    
    find "$dir" -name "*.md" | while read -r file; do
        file_name=$(basename "$file" .md)
        sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('$dir_name', 'CONTAINS', '$file_name');"
    done
done

# 3. Weave Phase Tree (Roadmap)
echo ">> WEAVING PHASE TREE..."
grep "## " IMPLEMENTATION_PLAN.md | sed 's/## //' | while read -r phase; do
    sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('PHASE_TREE', 'PARENT_OF', '$phase');"
done

# 4. Weave Spec/Plan/Research Trees
echo ">> WEAVING TECHNICAL TREES..."
find docs/superpowers/specs/ -name "*.md" | while read -r f; do 
    sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('SPEC_TREE', 'PARENT_OF', '$(basename "$f" .md)');"
    cp "$f" "$OS_VAULT/specs/" 2>/dev/null || true
done

find docs/superpowers/plans/ -name "*.md" | while read -r f; do 
    sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('PLAN_TREE', 'PARENT_OF', '$(basename "$f" .md)');"
    cp "$f" "$OS_VAULT/plans/" 2>/dev/null || true
done

find docs/superpowers/research/ -name "*.md" | while read -r f; do 
    sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('RESEARCH_TREE', 'PARENT_OF', '$(basename "$f" .md)');"
    cp "$f" "$OS_VAULT/research/" 2>/dev/null || true
done

# 5. Materialize Kanban View
sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('Sovereign-Roadmap.md', 'VISUALIZES', 'PHASE_TREE');"

echo ">> KNOWLEDGE TREES WOVEN."
