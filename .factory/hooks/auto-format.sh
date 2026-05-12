#!/bin/bash
# Hook: Auto-Format
# Runs standard formatters after Droid edits a file.

FILE_PATH=$1

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

if [[ "$FILE_PATH" == *.rs ]]; then
    echo "🦀 Running rustfmt on $FILE_PATH"
    cargo fmt --manifest-path crates/Cargo.toml -- "$FILE_PATH" 2>/dev/null || rustfmt "$FILE_PATH" 2>/dev/null || true
elif [[ "$FILE_PATH" == *.nix ]]; then
    echo "❄️ Running nixpkgs-fmt on $FILE_PATH"
    nixpkgs-fmt "$FILE_PATH" 2>/dev/null || true
fi

exit 0