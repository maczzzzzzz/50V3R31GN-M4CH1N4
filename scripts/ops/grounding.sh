#!/usr/bin/env bash
# scripts/ops/grounding.sh
# 50V3R31GN-M4CH1N4: System Context Grounding Feed
# Usage: bash scripts/ops/grounding.sh [all|vision|rules|logic]

echo "::/5Y573M-N071C3 : INITIATING_CONTEXT_FEED..."

FILES=(
  "SOUL.md"
  "AGENTS.md"
  "SOVEREIGN_VITAL_SIGNS.md"
  "GEMINI.md"
  "CLAUDE.md"
  "DIRECTOR_SOUL.md"
  "RED_RULES.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "\n--- BEGIN: $file ---"
    cat "$file"
    echo -e "\n--- END: $file ---"
  else
    echo "  [WARN] File missing: $file"
  fi
done

echo -e "\n::/5Y573M-N071C3 : CONTEXT_FEED_COMPLETE. LOGIC_SYNCHRONIZED."
