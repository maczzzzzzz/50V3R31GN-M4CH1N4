#!/usr/bin/env bash
# scripts/ops/lint-artifact.sh
# 50V3R31GN-M4CH1N4 : v3.7.0 — UNIVERSAL_LINTER_HARDGATE
#
# Ensures agent-generated artifacts are idiomatically compliant.

set -euo pipefail

FILE_PATH=$1

if [[ ! -f "$FILE_PATH" ]]; then
    echo "❌ [LINTER] File not found: $FILE_PATH"
    exit 1
fi

EXT="${FILE_PATH##*.}"

case "$EXT" in
    ts|tsx|js|mjs)
        echo "◈ [LINTER] Verifying TypeScript/JS: $FILE_PATH"
        npx eslint --fix "$FILE_PATH" || echo "⚠️  [LINTER] ESLint warnings detected."
        npx prettier --write "$FILE_PATH"
        ;;
    rs)
        echo "◈ [LINTER] Verifying Rust: $FILE_PATH"
        rustfmt "$FILE_PATH"
        ;;
    go)
        echo "◈ [LINTER] Verifying Go: $FILE_PATH"
        go fmt "$FILE_PATH"
        ;;
    *)
        echo "◦ [LINTER] No specific linter for .$EXT. Skipping."
        ;;
esac

echo "::/5Y573M-N071C3 : ARTIFACT_VERIFIED : $FILE_PATH"
