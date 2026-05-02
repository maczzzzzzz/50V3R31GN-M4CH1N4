#!/usr/bin/env bash
# ◈ SOVEREIGN_BUILD_SHARD : terminal-app (v3.8.25-SYNTHESIS)
# Bypassing shell restrictions via Nix/WSL interop.

cd "$(dirname "$0")"

echo "::/5Y573M-N071C3 : IGNITING_FLUTTER_BUILD..."
flutter build apk --release

echo "::/5Y573M-N071C3 : BUILD_COMPLETE. SHARD_MATERIALIZED."
