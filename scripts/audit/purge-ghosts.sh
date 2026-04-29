#!/usr/bin/env bash
# Purge all project-specific processes that have survived longer than the timeout.
echo "::/5Y573M-N071C3 : INITIATING_GHOST_PURGE..."
TARGETS=("crush" "sidecar" "hermes" "llama-server" "mooncake" "sglang" "tsx" "node")
for target in "${TARGETS[@]}"; do
  # Find processes older than 4 hours (240 minutes)
  pids=$(ps -eo pid,etime,comm | grep "$target" | awk '{print $1}')
  for pid in $pids; do
    echo "  [PURGE] Neutralizing ghost PID $pid ($target)..."
    kill -9 $pid 2>/dev/null || true
  done
done
echo "::/5Y573M-N071C3 : PURGE_COMPLETE. GHOSTS_NEUTRALIZED."
