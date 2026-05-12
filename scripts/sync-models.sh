#!/usr/bin/env bash
# Sync model files to a mesh node via rsync
set -euo pipefail

USAGE="Usage: $0 <node-c|node-d> <model_dir> [model_files...]"
NODE="${1:?$USAGE}"
MODEL_DIR="${2:?$USAGE}"
shift 2

SSH_USER="${SSH_USER:-maczz}"

case "$NODE" in
    node-c) TARGET_IP="100.102.109.81" ;;
    node-d) TARGET_IP="100.120.225.12" ;;
    *) echo "Unknown node: $NODE" >&2; exit 1 ;;
esac

echo "Syncing models to $NODE ($TARGET_IP)..."
for model in "$@"; do
    echo "  Syncing: $model"
    rsync -avz --progress "$MODEL_DIR/$model" "${SSH_USER}@${TARGET_IP}:/var/lib/hermes/models/"
done
echo "Sync complete."
