#!/usr/bin/env bash
set -e

echo "==========================================================="
echo " 7H3-H4RV357-PR070C0L // 50V3R31GN-M4CH1N4"
echo " Target: Cyberpunk RED 2045 Community Seed Data"
echo "==========================================================="

# Create temporary staging ground
HARVEST_DIR="/tmp/cpred-harvest-$(date +%s)"
TARGET_DIR="docs/raw_data/community_compendium"

mkdir -p "$HARVEST_DIR"
mkdir -p "$TARGET_DIR"

echo "[1/3] Cloning DankTrain11949/CyberPunk-Red-Fan-Compendium..."
git clone --depth 1 https://github.com/DankTrain11949/CyberPunk-Red-Fan-Compendium.git "$HARVEST_DIR/fan-compendium"

echo "[2/3] Cloning Schism989/cpred-going-metal..."
git clone --depth 1 https://github.com/Schism989/cpred-going-metal.git "$HARVEST_DIR/going-metal"

echo "[3/3] Cloning Sannosama/sannos-super-cyberpunk-red-extras..."
git clone --depth 1 https://github.com/Sannosama/sannos-super-cyberpunk-red-extras.git "$HARVEST_DIR/sannos-extras"

echo ""
echo "==========================================================="
echo " 3X7R4C71N6 P4YL04D5"
echo "==========================================================="

# 1. Fan Compendium
mkdir -p "$TARGET_DIR/fan_compendium"
if [ -d "$HARVEST_DIR/fan-compendium/packs" ]; then
    cp -r "$HARVEST_DIR/fan-compendium/packs/"* "$TARGET_DIR/fan_compendium/"
    echo "  >> Extracted Fan Compendium packs."
fi

# 2. Going Metal
mkdir -p "$TARGET_DIR/going_metal"
if [ -d "$HARVEST_DIR/going-metal/packs" ]; then
    cp -r "$HARVEST_DIR/going-metal/packs/"* "$TARGET_DIR/going_metal/"
    echo "  >> Extracted Going Metal packs."
fi

# 3. Sanno's Extras
mkdir -p "$TARGET_DIR/sannos_extras"
if [ -d "$HARVEST_DIR/sannos-extras/packs" ]; then
    cp -r "$HARVEST_DIR/sannos-extras/packs/"* "$TARGET_DIR/sannos_extras/"
    echo "  >> Extracted Sanno's Extras packs."
fi

echo ""
echo "==========================================================="
echo " CL34NUP & 534L1N6"
echo "==========================================================="
rm -rf "$HARVEST_DIR"
echo "  >> Temporary harvest directories purged."

echo ""
echo "✅ H4RV357 C0MPL373. Seed data ingested into $TARGET_DIR."
