#!/usr/bin/env bash
# scripts/vault-reconstruct.sh
# 50V3R31GN-M4CH1N4: High-performance vault reconstruction via shell.
# Bypasses Node.js OOM by using sqlite3 directly.

VAULT_WSL="/home/nixos/50V3R31GN-M4CH1N4/data/vault/RKG"
VAULT_WIN="/mnt/d/Obsidian_RKG"
DB="data/Akashik.db"

mkdir -p "$VAULT_WSL/Items" "$VAULT_WSL/Actors" "$VAULT_WSL/Lore" "$VAULT_WSL/Factions" "$VAULT_WSL/Core_Rules" "$VAULT_WSL/Chronicles"
mkdir -p "$VAULT_WIN/Items" "$VAULT_WIN/Actors" "$VAULT_WIN/Lore" "$VAULT_WIN/Factions" "$VAULT_WIN/Core_Rules" "$VAULT_WIN/Chronicles"

echo ">> RECONSTRUCTING TRIPLET ENTITIES..."
# Export triplets (basic entities)
sqlite3 -header -csv "$DB" "SELECT subject_id, predicate, object_literal FROM triplets WHERE predicate NOT LIKE 'PURGED_%';" | tail -n +2 | while IFS=',' read -r sub pred obj; do
    # Crude sanitization
    file=$(echo "$sub" | tr -d '"' | tr ' /' '_')
    folder="Knowledge"
    # Basic sorting logic
    if [[ "$sub" =~ [Mm]aterials || "$sub" =~ [Ss]hard || "$sub" =~ [Ww]eapon ]]; then folder="Items"; fi
    
    path_wsl="$VAULT_WSL/$folder/$file.md"
    if [ ! -f "$path_wsl" ]; then
        cat <<EOF > "$path_wsl"
---
subject: $sub
type: Entity
tags: [rkg/$folder]
sovereign: true
source: AKASHIK_DB
---

# $sub

### ◈ KNOWLEDGE TRIADS
- **$pred** :: [[$obj]]
EOF
    else
        echo "- **$pred** :: [[$obj]]" >> "$path_wsl"
    fi
done

echo ">> RECONSTRUCTING CHRONICLE ENTRIES (3300+)..."
# Use a more efficient way for chronicles
sqlite3 "$DB" "SELECT title, category, source, era_grounding, content FROM chronicle_seeds WHERE status = 'approved';" | while IFS='|' read -r title cat src era content; do
    file=$(echo "$title" | tr ' /' '_')
    folder="Lore"
    if [[ "$cat" =~ Gear || "$cat" =~ Technical ]]; then folder="Items"; fi
    if [[ "$cat" =~ Corporate ]]; then folder="Factions"; fi
    
    path_wsl="$VAULT_WSL/Chronicles/$folder/$file.md"
    mkdir -p "$(dirname "$path_wsl")"
    
    cat <<EOF > "$path_wsl"
---
subject: $title
type: Chronicle
tags: [rkg/chronicles, ${cat#\#}]
source: $src
era: $era
sovereign: true
---

# $title

$content

---
_Source: $src_
EOF
done

echo ">> SYNCING TO WINDOWS MIRROR..."
cp -r "$VAULT_WSL/"* "$VAULT_WIN/"

echo "✅ RECONSTRUCTION COMPLETE."
