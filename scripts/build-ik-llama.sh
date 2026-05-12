#!/usr/bin/env bash
# Build ik-llama for a specific mesh node
set -euo pipefail

USAGE="Usage: $0 <node-d|node-b>"
NODE="${1:?$USAGE}"

case "$NODE" in
    node-b) ATTR="ik_llama_cpp_b" ;;
    node-d) ATTR="ik_llama_cpp_d" ;;
    *) echo "Unknown node: $NODE. Use node-b or node-d." >&2; exit 1 ;;
esac

echo "Building ik-llama for $NODE (attribute: $ATTR)..."
exec nix build ".#${ATTR}" --print-build-logs
