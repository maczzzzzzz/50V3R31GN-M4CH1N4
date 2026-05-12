#!/usr/bin/env bash
# SOVEREIGN SEMANTIC SHIFT ENGINE (v2.0.0)
# Recursively converts Markdown/Text documentation to high-fidelity Semantic HTML.

set -euo pipefail

# Directories to process recursively
DIRS=(
    "docs/nodestadt/architecture"
    "docs/nodestadt/capabilities"
    "docs/planning/research"
    "docs/planning/plans"
    "docs/planning/specs"
    "docs/planning/audits"
)

# Collect all files to convert
FILES=()

if [ -f "IMPLEMENTATION_PLAN.md" ]; then
    FILES+=("IMPLEMENTATION_PLAN.md")
fi

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo ":: Scanning directory: $dir"
        while IFS= read -r -d '' f; do
            FILES+=("$f")
        done < <(find "$dir" -type f \( -name "*.md" -o -name "*.txt" \) -print0)
    fi
done

if [ ${#FILES[@]} -eq 0 ]; then
    echo ":: No files to convert."
    exit 0
fi

echo ":: Converting ${#FILES[@]} files via single nix-shell invocation..."

# Write conversion script and file list to temp files
CONVERT_SCRIPT=$(mktemp)
FILE_LIST=$(mktemp)
trap 'rm -f "$CONVERT_SCRIPT" "$FILE_LIST"' EXIT

printf '%s\n' "${FILES[@]}" > "$FILE_LIST"

cat > "$CONVERT_SCRIPT" << 'CONVERTER'
convert_file() {
    local src="$1"
    local base="${src%.*}"
    local dest="${base}.html"

    # Calculate depth for relative CSS path
    local depth=$(echo "$src" | tr -cd '/' | wc -c)
    local style_prefix=""
    for ((i=0; i<depth; i++)); do style_prefix="../$style_prefix"; done
    local style="${style_prefix}docs/sovereign-style.css"

    # Special case for root files
    if [ "$depth" -eq 0 ]; then
        style="./docs/sovereign-style.css"
    fi

    echo ":: Converting $src -> $dest (Style: $style)"

    pandoc -s --metadata title="Sovereign Machina Documentation" -c "$style" "$src" -o "$dest"

    # Post-process: Update .md links to .html in the generated HTML
    sed -i 's/\.md"/\.html"/g' "$dest"
    sed -i 's/\.md#/\.html#/g' "$dest"
}

while IFS= read -r f; do
    convert_file "$f"
done
CONVERTER

# Process all files inside a single nix-shell invocation
nix-shell -p pandoc --run "bash '$CONVERT_SCRIPT'" < "$FILE_LIST"

echo ":: SEMANTIC SHIFT COMPLETE ::"
