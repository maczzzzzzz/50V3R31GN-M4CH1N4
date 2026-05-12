#!/bin/bash
# Hook: Protect Branches
# Prevents Droid (and humans) from accidentally committing directly to master.
# Mandates the use of the beta/v3 branch for the current phase.

BRANCH_NAME=$(git symbolic-ref --short HEAD)

if [ "$BRANCH_NAME" = "master" ] || [ "$BRANCH_NAME" = "main" ]; then
  echo "❌ ERROR: STRATEGIST VETO."
  echo "You are attempting to commit directly to '$BRANCH_NAME'."
  echo "GLOBAL MANDATE: All work must occur exclusively within the 'beta/v3' branch."
  echo "Switch to beta/v3 before proceeding: git checkout beta/v3"
  exit 1
fi

echo "✅ Branch check passed: $BRANCH_NAME"
exit 0