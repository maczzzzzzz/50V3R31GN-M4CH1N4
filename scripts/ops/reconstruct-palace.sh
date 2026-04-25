#!/usr/bin/env bash
# scripts/reconstruct-palace.sh
# 50V3R31GN-M4CH1N4: Phase 47 — UN1V3R54L-C0D3X Palace Reconstruction
#
# Organizes the Obsidian vault by: District → Faction → Category
# Auto-tags entries based on source provenance.
# Bypasses Node.js OOM by using sqlite3 directly.
#
# Usage:
#   bash scripts/reconstruct-palace.sh              # Full rebuild
#   bash scripts/reconstruct-palace.sh --palace-only # Skip file write (schema check only)

set -euo pipefail

VAULT_WSL="${OBSIDIAN_VAULT_PATH:-/home/nixos/50V3R31GN-M4CH1N4/data/vault/RKG}"
VAULT_WIN="${WINDOWS_VAULT_ROOT:-/mnt/d/Obsidian_RKG}"
DB="${AKASHIK_DB_PATH:-data/Akashik.db}"
PALACE_ONLY="${1:-}"

# ── Ensure base directories exist ─────────────────────────────────────────────

mkdir -p \
  "$VAULT_WSL/Districts" \
  "$VAULT_WSL/Global/Items" \
  "$VAULT_WSL/Global/Actors" \
  "$VAULT_WSL/Global/Factions" \
  "$VAULT_WSL/Global/Knowledge" \
  "$VAULT_WSL/Chronicles/Global" \
  "$VAULT_WIN/Districts" \
  "$VAULT_WIN/Global" \
  "$VAULT_WIN/Chronicles/Global" 2>/dev/null || true

if [[ "$PALACE_ONLY" == "--palace-only" ]]; then
  echo ">> PALACE-ONLY mode: skipping file write."
  exit 0
fi

# ── Provenance tag mapper ─────────────────────────────────────────────────────

provenance_tag() {
  local src="${1:-UNKNOWN}"
  case "${src^^}" in
    MIRAHEZE)      echo "provenance/miraheze" ;;
    "Z-TEAM")      echo "provenance/z-team" ;;
    "WORLD-ANVIL") echo "provenance/world-anvil" ;;
    AKASHIK_DB)    echo "provenance/akashik" ;;
    *)             echo "provenance/unknown" ;;
  esac
}

# ── TRIPLET ENTITIES ──────────────────────────────────────────────────────────

echo ">> RECONSTRUCTING TRIPLET ENTITIES (District → Category)..."

# Columns: subject_id | predicate | object_literal | district_id (may be empty)
sqlite3 "$DB" \
  "SELECT subject_id, predicate, object_literal, COALESCE(district_id,'') FROM triplets WHERE predicate NOT LIKE 'PURGED_%';" \
| while IFS='|' read -r sub pred obj district; do
    file=$(echo "$sub" | tr -d '"' | tr ' /' '_' | cut -c1-200)

    # Category detection
    folder="Knowledge"
    sub_lc="${sub,,}"
    if [[ "$sub_lc" =~ materials|shard|weapon|armor|cyberware ]]; then folder="Items"; fi
    if [[ "$pred" == "is" && ("$obj" =~ [Nn][Pp][Cc]|[Aa]ctor) ]]; then folder="Actors"; fi

    # District path
    if [[ -n "$district" ]]; then
      dir_wsl="$VAULT_WSL/Districts/$district/$folder"
      dir_win="$VAULT_WIN/Districts/$district/$folder"
    else
      dir_wsl="$VAULT_WSL/Global/$folder"
      dir_win="$VAULT_WIN/Global/$folder"
    fi

    mkdir -p "$dir_wsl" "$dir_win"
    path_wsl="$dir_wsl/$file.md"
    path_win="$dir_win/$file.md"

    if [ ! -f "$path_wsl" ]; then
      district_tag=""
      if [[ -n "$district" ]]; then
        district_tag="district: $district"$'\n'
      fi
      cat <<EOF > "$path_wsl"
---
subject: $sub
type: Entity
tags: [rkg/${folder,,}, provenance/akashik]
sovereign: true
source: AKASHIK_DB
${district_tag}---

# $sub

### ◈ KNOWLEDGE TRIADS
- **$pred** :: [[$obj]]
EOF
    else
      echo "- **$pred** :: [[$obj]]" >> "$path_wsl"
    fi

    # Mirror to Windows vault
    rsync -a --update "$path_wsl" "$path_win" 2>/dev/null || true
  done

echo ">> RECONSTRUCTING NPC ENTITIES (District → Actors)..."

# Columns: id | name | faction | disposition | district_id
sqlite3 "$DB" \
  "SELECT name, COALESCE(faction,'Independent'), disposition, COALESCE(district_id,''), id FROM npcs;" \
| while IFS='|' read -r name faction disposition district id; do
    file=$(echo "$name" | tr ' /' '_' | tr -d '"' | cut -c1-200)

    # District path
    if [[ -n "$district" ]]; then
      dir_wsl="$VAULT_WSL/Districts/$district/Actors"
      dir_win="$VAULT_WIN/Districts/$district/Actors"
    else
      dir_wsl="$VAULT_WSL/Global/Actors"
      dir_win="$VAULT_WIN/Global/Actors"
    fi

    mkdir -p "$dir_wsl" "$dir_win"
    path_wsl="$dir_wsl/$file.md"
    path_win="$dir_win/$file.md"

    district_tag=""
    if [[ -n "$district" ]]; then
      district_tag="district: $district"$'\n'
    fi

    cat <<EOF > "$path_wsl"
---
subject: $name
type: Actor
tags: [rkg/actors, faction/${faction,,}, status/${disposition,,}]
sovereign: true
source: AKASHIK_DB
${district_tag}npc_id: $id
---

# $name

- **Faction:** [[$faction]]
- **Disposition:** $disposition
- **Status:** Alive

### ◈ BIOMETRICS
- **Location:** [[$district]]
- **Grounding:** Physicalized via Phase 58 Audit.

EOF

    # Mirror to Windows vault
    rsync -a --update "$path_wsl" "$path_win" 2>/dev/null || true
  done

echo ">> NPC ENTITIES: done."

# ── CHRONICLE SEEDS ───────────────────────────────────────────────────────────

echo ">> RECONSTRUCTING CHRONICLE ENTRIES (District → Category)..."

# Columns: id | title | category | source | era_grounding | district_id | content
sqlite3 "$DB" \
  "SELECT title, category, source, era_grounding, COALESCE(district_id,''), content
   FROM chronicle_seeds
   WHERE status = 'approved';" \
| while IFS='|' read -r title cat src era district content; do
    file=$(echo "$title" | tr ' /' '_' | tr -d '"' | cut -c1-200)
    clean_cat="${cat//#/}"
    prov_tag=$(provenance_tag "$src")

    # Category → folder mapping
    subfolder="Lore"
    if [[ "$clean_cat" == "Gear" || "$clean_cat" == "Technical" ]]; then subfolder="Items"; fi
    if [[ "$clean_cat" == "Corporate" ]]; then subfolder="Factions"; fi

    # District path
    if [[ -n "$district" ]]; then
      dir_wsl="$VAULT_WSL/Chronicles/Districts/$district/$subfolder"
      dir_win="$VAULT_WIN/Chronicles/Districts/$district/$subfolder"
    else
      dir_wsl="$VAULT_WSL/Chronicles/Global/$subfolder"
      dir_win="$VAULT_WIN/Chronicles/Global/$subfolder"
    fi

    mkdir -p "$dir_wsl" "$dir_win"
    path_wsl="$dir_wsl/$file.md"
    path_win="$dir_win/$file.md"

    district_props=""
    if [[ -n "$district" ]]; then
      district_props="district: $district"$'\n'
    fi

    cat <<EOF > "$path_wsl"
---
subject: $title
type: Chronicle
tags: [rkg/chronicles/${subfolder,,}, $clean_cat, $prov_tag]
source: $src
era: $era
${district_props}sovereign: true
---

# $title

$content

---
_Source: $dir_wsl
EOF

    rsync -a --update "$path_wsl" "$path_win" 2>/dev/null || true
  done

echo ">> CHRONICLES: done."

echo "✅ RECONSTRUCTION COMPLETE. Vault organized by District → Category."
