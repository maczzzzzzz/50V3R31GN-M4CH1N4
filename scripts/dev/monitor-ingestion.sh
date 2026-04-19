#!/usr/bin/env bash
TARGET=$1
while true; do
  CURRENT=$(sqlite3 data/Akashik.db "SELECT count(*) FROM visual_embeddings;")
  echo "[$(date)] Progress: $CURRENT / $TARGET" >> data/logs/ingestion-monitor.log
  if [ "$CURRENT" -ge "$TARGET" ]; then
    echo "::/INGESTION_COMPLETE" >> data/logs/ingestion-monitor.log
    # Auto-promotion logic could go here, but I will wait for user confirmation
    break
  fi
  sleep 60
done
