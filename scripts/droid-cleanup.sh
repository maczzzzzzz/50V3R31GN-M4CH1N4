#!/usr/bin/env bash
# Droid Runtime Optimization - Prevents resource leaks and stale processes
# Part of NODESTADT Phase 3 optimization
# Run this script periodically (e.g., via cron) to maintain droid health

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WATCHDOG_SCRIPT="$SCRIPT_DIR/droid-watchdog.sh"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

echo "=== Droid Runtime Optimization ==="
echo "Timestamp: $(date -Iseconds)"
echo ""

# Step 1: Check for stale processes with 15-minute threshold (aggressive)
log_info "Step 1: Checking for stale processes (15min threshold)..."
if "$WATCHDOG_SCRIPT" --max-age 15 --dry-run; then
  log_info "No stale processes found."
else
  log_warn "Stale processes detected. Killing them now..."
  "$WATCHDOG_SCRIPT" --max-age 15 --kill-stale
fi

echo ""

# Step 2: Check for zombie processes
log_info "Step 2: Checking for zombie processes..."
zombie_count=$(ps aux | awk '$8 ~ /^Z$/ {count++} END {print count+0}')
if [[ "$zombie_count" -gt 0 ]]; then
  log_warn "Found $zombie_count zombie processes. These may indicate parent process issues."
  ps aux | awk '$8 ~ /Z/ {print "  PID:", $2, "PPID:", $3, "CMD:", $11}' | head -5
else
  log_info "No zombie processes found."
fi

echo ""

# Step 3: Check droid version and updates
log_info "Step 3: Checking droid installation..."
if command -v droid &> /dev/null; then
  droid_version=$(droid --version 2>&1 | head -1 || echo "unknown")
  log_info "Droid version: $droid_version"
else
  log_warn "Droid CLI not found in PATH."
fi

echo ""

# Step 4: Clean up temporary droid files
log_info "Step 4: Cleaning up temporary files..."
tmp_patterns=(
  "$HOME/.droid/tmp/*"
  "$HOME/.cache/droid/*"
  "/tmp/droid-*"
)

cleaned_count=0
for pattern in "${tmp_patterns[@]}"; do
  if ls -d $pattern &> /dev/null; then
    # Find files older than 24 hours
    old_files=$(find $pattern -type f -mtime +1 2>/dev/null || true)
    if [[ -n "$old_files" ]]; then
      count=$(echo "$old_files" | wc -l)
      log_warn "Found $count old temp files in $pattern"
      # Only remove in non-dry-run mode
      # find $pattern -type f -mtime +1 -delete 2>/dev/null || true
      cleaned_count=$((cleaned_count + count))
    fi
  fi
done

if [[ $cleaned_count -eq 0 ]]; then
  log_info "No old temporary files found."
else
  log_info "Would clean $cleaned_count old temp files (dry run)."
fi

echo ""

# Step 5: System resource check
log_info "Step 5: System resource check..."
if command -v free &> /dev/null; then
  mem_info=$(free -h | grep Mem)
  log_info "Memory: $mem_info"
fi

if command -v df &> /dev/null; then
  disk_info=$(df -h / | tail -1 | awk '{print "Used:", $3, "Available:", $4, "Use%:", $5}')
  log_info "Disk: $disk_info"
fi

echo ""
log_info "=== Droid Runtime Optimization Complete ==="
