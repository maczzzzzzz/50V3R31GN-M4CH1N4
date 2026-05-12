#!/usr/bin/env bash
# Droid Process Watchdog - Prevents stale droid processes from consuming resources
# Part of NODESTADT Phase 3 optimization
# Usage: ./scripts/droid-watchdog.sh [--kill-stale] [--max-age MINUTES]

set -euo pipefail

# Configuration
MAX_CPU_USAGE=50.0        # Max CPU% before flagging
MAX_AGE_MINUTES=30        # Max runtime before considering stale (default)
MAX_MEMORY_MB=2048        # Max memory usage in MB
DRY_RUN=false             # Safety flag

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Parse arguments
KILL_STALE=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --kill-stale)
      KILL_STALE=true
      shift
      ;;
    --max-age)
      MAX_AGE_MINUTES="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--kill-stale] [--max-age MINUTES] [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --kill-stale    Kill stale droid processes (USE WITH CAUTION)"
      echo "  --max-age N     Maximum age in minutes before considering stale (default: 30)"
      echo "  --dry-run       Show what would be done without killing processes"
      echo ""
      echo "Exit codes:"
      echo "  0: No issues found"
      echo "  1: Stale processes detected (not killed)"
      echo "  2: Stale processes killed"
      echo "  3: Error occurred"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 3
      ;;
  esac
done

# Function to convert elapsed time to seconds
# Formats: HH:MM:SS, MM:SS, or SS
time_to_seconds() {
  local time_str="$1"
  if [[ "$time_str" == *:*:* ]]; then
    # HH:MM:SS format
    IFS=':' read -r hours minutes seconds <<< "$time_str"
    echo $((hours * 3600 + minutes * 60 + seconds))
  elif [[ "$time_str" == *:* ]]; then
    # MM:SS format
    IFS=':' read -r minutes seconds <<< "$time_str"
    echo $((minutes * 60 + seconds))
  else
    # SS format
    echo "$time_str"
  fi
}

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Find droid processes
echo "=== Droid Process Watchdog ==="
echo "Max CPU threshold: ${MAX_CPU_USAGE}%"
echo "Max age threshold: ${MAX_AGE_MINUTES} minutes"
echo "Max memory: ${MAX_MEMORY_MB} MB"
echo "Dry run: ${DRY_RUN}"
echo "Kill stale: ${KILL_STALE}"
echo ""

# Get all droid processes with detailed info
droid_processes=$(ps -eo pid,ppid,etime,%cpu,%mem,rss,cmd | grep -E '[0-9]+\s+[0-9]+\s+.*droid' | grep -v grep || true)

if [[ -z "$droid_processes" ]]; then
  log_info "No droid processes found. System clean."
  exit 0
fi

stale_count=0
high_cpu_count=0
high_mem_count=0
total_count=0

# Process each droid entry
while IFS= read -r line; do
  total_count=$((total_count + 1))
  
  # Parse process info
  read -r pid ppid etime cpu_percent mem_percent rss cmd <<< "$line"
  
  # Convert memory to MB
  memory_mb=$((rss / 1024))
  
  # Check conditions
  age_seconds=$(time_to_seconds "$etime")
  age_minutes=$((age_seconds / 60))
  
  is_stale=false
  is_high_cpu=false
  is_high_mem=false
  
  if [[ $age_minutes -ge $MAX_AGE_MINUTES ]]; then
    is_stale=true
    stale_count=$((stale_count + 1))
  fi
  
  # Compare CPU percentage using bash arithmetic (avoiding bc dependency)
  if [[ "${cpu_percent%.*}" -gt "${MAX_CPU_USAGE%.*}" ]]; then
    is_high_cpu=true
    high_cpu_count=$((high_cpu_count + 1))
  fi
  
  if [[ $memory_mb -gt $MAX_MEMORY_MB ]]; then
    is_high_mem=true
    high_mem_count=$((high_mem_count + 1))
  fi
  
  # Display process status
  echo "Process $pid:"
  echo "  Parent: $ppid"
  echo "  Age: ${age_minutes}m (${etime})"
  echo "  CPU: ${cpu_percent}%"
  echo "  Memory: ${memory_mb} MB"
  echo "  Command: ${cmd:0:80}..."
  
  if [[ "$is_stale" = true ]]; then
    log_warn "  ⚠️  STALE: Running for ${age_minutes} minutes (max: ${MAX_AGE_MINUTES})"
  fi
  
  if [[ "$is_high_cpu" = true ]]; then
    log_warn "  ⚠️  HIGH CPU: ${cpu_percent}% (max: ${MAX_CPU_USAGE}%)"
  fi
  
  if [[ "$is_high_mem" = true ]]; then
    log_warn "  ⚠️  HIGH MEMORY: ${memory_mb} MB (max: ${MAX_MEMORY_MB} MB)"
  fi
  
  # Kill if requested and flagged
  if [[ "$KILL_STALE" = true && "$is_stale" = true ]]; then
    if [[ "$DRY_RUN" = true ]]; then
      log_warn "  Would kill stale process $pid"
    else
      log_error "  Killing stale process $pid..."
      kill "$pid" 2>/dev/null || log_error "  Failed to kill $pid"
    fi
  fi
  
  echo ""
done <<< "$droid_processes"

# Summary
echo "=== Summary ==="
echo "Total droid processes: $total_count"
echo "Stale processes: $stale_count"
echo "High CPU processes: $high_cpu_count"
echo "High memory processes: $high_mem_count"

# Exit codes
if [[ $stale_count -gt 0 ]]; then
  if [[ "$KILL_STALE" = true && "$DRY_RUN" = false ]]; then
    log_info "Stale processes have been killed."
    exit 2
  else
    log_warn "Stale processes detected. Run with --kill-stale to terminate them."
    exit 1
  fi
fi

log_info "No stale processes found."
exit 0
