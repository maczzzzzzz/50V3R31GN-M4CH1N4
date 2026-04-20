#!/usr/bin/env bash
# 50V3R31GN-M4CH1N4: AUTOMATED LOG SURVEILLANCE
# Watches orchestration logs for errors and warnings during live-fire audits

ORCH_LOG="data/logs/orchestrator.log"
CRUSH_LOG="data/logs/crush.log"

echo "::/5Y573M-N071C3 : INITIATING LOG SURVEILLANCE..."

# Use tail to follow both logs, awk to prepend the source, and grep to filter ERROR/WARN
# We use --line-buffered or equivalent to ensure output isn't delayed
tail -F -n 0 "$ORCH_LOG" "$CRUSH_LOG" 2>/dev/null | awk '
  /^==> / { logname = $2; next }
  /ERROR|WARN|error|warn/ {
    if (logname == "'"$ORCH_LOG"'") {
      print "[\033[31mORCHESTRATOR\033[0m]", $0
    } else if (logname == "'"$CRUSH_LOG"'") {
      print "[\033[33mCRUSH\033[0m]", $0
    } else {
      print "[LOG]", $0
    }
  }
'