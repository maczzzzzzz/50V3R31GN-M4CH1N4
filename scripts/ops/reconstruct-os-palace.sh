#!/usr/bin/env bash
# scripts/ops/reconstruct-os-palace.sh
# 50V3R31GN-M4CH1N4: Phase 73 — Sovereign OS Hierarchical Weaving
#
# Usage: bash scripts/ops/reconstruct-os-palace.sh

set -euo pipefail

OS_VAULT="/mnt/d/Obsidian_Sovereign_OS"
DB="data/SovereignIntelligence.db"

echo ">> INITIALIZING SOVEREIGN KNOWLEDGE TREES..."

# Root Note Materialization (Manual in script for consistency)
mkdir -p "$OS_VAULT/Identity" "$OS_VAULT/Phases" "$OS_VAULT/Specs" "$OS_VAULT/Plans" "$OS_VAULT/Research" "$OS_VAULT/Guides"

# 1. Weave Guide Tree
echo ">> WEAVING GUIDE TREE..."
echo "# ◈ GUIDE TREE" > "$OS_VAULT/GUIDE_TREE.md"
echo "PARENT :: [[OS_CORE]]\n\n---" >> "$OS_VAULT/GUIDE_TREE.md"

find akashik_guides -maxdepth 1 -type d -not -path akashik_guides | while read -r dir; do
    dir_name=$(basename "$dir")
    echo "- [[$dir_name]]" >> "$OS_VAULT/GUIDE_TREE.md"
    
    # Sub-directory Root
    mkdir -p "$OS_VAULT/Guides/$dir_name"
    echo "# ◈ $dir_name\nPARENT :: [[GUIDE_TREE]]\n\n---" > "$OS_VAULT/Guides/$dir_name.md"
    
    find "$dir" -name "*.md" | while read -r file; do
        file_name=$(basename "$file" .md)
        echo "- [[$file_name]]" >> "$OS_VAULT/Guides/$dir_name.md"
        # Inject link into actual guide (Caution: surgical append)
        cp "$file" "$OS_VAULT/Guides/$dir_name/$file_name.md"
        echo -e "\n\n---\n**LINKS:** [[$dir_name]] | [[OS_CORE]]" >> "$OS_VAULT/Guides/$dir_name/$file_name.md"
    done
done

# 2. Weave Phase Tree
echo ">> WEAVING PHASE TREE..."
echo "# ◈ PHASE TREE\nPARENT :: [[OS_CORE]]\n\n---" > "$OS_VAULT/PHASE_TREE.md"
grep "## " IMPLEMENTATION_PLAN.md | sed 's/## //' | while read -r phase; do
    file_name=$(echo "$phase" | tr ' /' '_')
    echo "- [[$file_name|$phase]]" >> "$OS_VAULT/PHASE_TREE.md"
    
    cat <<EOP > "$OS_VAULT/Phases/$file_name.md"
# $phase
PARENT :: [[PHASE_TREE]]

### ◈ ARCHITECTURAL TRIADS
- **PART_OF** :: [[OS_CORE]]
EOP
done

# 3. Weave Technical Trees (Specs/Plans/Research)
weave_tech_tree() {
    local src_dir=$1
    local vault_dir=$2
    local root_name=$3
    
    echo ">> WEAVING $root_name..."
    echo "# ◈ $root_name\nPARENT :: [[OS_CORE]]\n\n---" > "$OS_VAULT/$root_name.md"
    
    find "$src_dir" -name "*.md" | while read -r f; do
        base_name=$(basename "$f" .md)
        echo "- [[$base_name]]" >> "$OS_VAULT/$root_name.md"
        cp "$f" "$OS_VAULT/$vault_dir/$base_name.md"
        echo -e "\n\n---\n**LINKS:** [[$root_name]] | [[OS_CORE]]" >> "$OS_VAULT/$vault_dir/$base_name.md"
    done
}

weave_tech_tree "docs/superpowers/specs" "Specs" "SPEC_TREE"
weave_tech_tree "docs/superpowers/plans" "Plans" "PLAN_TREE"
weave_tech_tree "docs/superpowers/research" "Research" "RESEARCH_TREE"

echo ">> KNOWLEDGE TREES WOVEN. ORPHANS NEUTRALIZED."
