#!/usr/bin/env bash
# scripts/ops/reconstruct-os-palace.sh
# 50V3R31GN-M4CH1N4: Phase 73 — Sovereign OS MemPalace Reconstruction
#
# Semantically maps the OS architecture by parsing:
# IMPLEMENTATION_PLAN.md, SOVEREIGN-IDENTITY.md, and docs/superpowers/
#
# Usage:
#   bash scripts/ops/reconstruct-os-palace.sh

set -euo pipefail

OS_VAULT="/mnt/d/Obsidian_Sovereign_OS"
DB="data/SovereignIntelligence.db"

echo ">> INITIALIZING SOVEREIGN OS MEMPALACE..."

# 1. Ensure Vault Structure
mkdir -p "$OS_VAULT/Phases" "$OS_VAULT/Specs" "$OS_VAULT/Identity" "$OS_VAULT/Nodes"

# 2. Clear stale OS triplets (Optional: keep audit history, purge functional only)
# sqlite3 "$DB" "DELETE FROM os_triplets WHERE predicate NOT IN ('DECISION_AUDIT');"

# 3. Parse IMPLEMENTATION_PLAN.md for Phase/Task Relations
echo ">> EXTRACTING ROADMAP TRIPLETS..."
grep "## " IMPLEMENTATION_PLAN.md | sed 's/## //' | while read -r phase; do
    # Subject: Phase
    # Predicate: PART_OF
    # Object: 50V3R31GN-M4CH1N4
    sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('$phase', 'PART_OF', '50V3R31GN-M4CH1N4');"
    
    # Materialize Phase Note
    file_name=$(echo "$phase" | tr ' /' '_')
    cat <<EOP > "$OS_VAULT/Phases/$file_name.md"
---
subject: $phase
type: OS_Phase
tags: [os/roadmap, provenance/scribe]
---
# $phase

### ◈ ARCHITECTURAL TRIADS
- **PART_OF** :: [[50V3R31GN-M4CH1N4]]
EOP
done

# 4. Parse SOVEREIGN-IDENTITY.md for Profile Constraints
echo ">> EXTRACTING IDENTITY TRIPLETS..."
grep "### " SOVEREIGN-IDENTITY.md | sed 's/### //' | while read -r profile; do
    sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('$profile', 'DEFINES_PROFILE', 'SOVEREIGN_IDENTITY');"
    
    cat <<EOP > "$OS_VAULT/Identity/$profile.md"
---
subject: $profile
type: OS_Profile
tags: [os/identity, provenance/scribe]
---
# $profile

### ◈ IDENTITY TRIADS
- **DEFINES_PROFILE** :: [[SOVEREIGN_IDENTITY]]
EOP
done

# 5. Map Specs and Plans to Tasks (Greedy file walk)
echo ">> MAPPING SPECIFICATION SHARDS..."
find docs/superpowers/specs/ -name "*.md" | while read -r spec_path; do
    spec_name=$(basename "$spec_path" .md)
    sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('$spec_name', 'GOVERNS', 'IMPLEMENTATION');"
    cp "$spec_path" "$OS_VAULT/Specs/$spec_name.md"
done

echo ">> MAPPING IMPLEMENTATION PLANS..."
mkdir -p "$OS_VAULT/Plans"
find docs/superpowers/plans/ -name "*.md" | while read -r plan_path; do
    plan_name=$(basename "$plan_path" .md)
    sqlite3 "$DB" "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal) VALUES ('$plan_name', 'PART_OF', 'ROADMAP');"
    cp "$plan_path" "$OS_VAULT/Plans/$plan_name.md"
done

echo ">> OS MEMPALACE RECONSTRUCTION COMPLETE."
