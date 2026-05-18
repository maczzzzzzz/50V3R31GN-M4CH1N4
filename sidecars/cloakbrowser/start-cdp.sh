#!/usr/bin/env bash
# CloakBrowser CDP Sidecar for Node B
# Exposes stealth Chrome on localhost:9222
# Usage: ./start-cdp.sh [start|stop|status]

case "${1:-start}" in
  start)
    if sg docker -c "docker ps --format '{{.Names}}'" | grep -q cloak-cdp; then
      echo "cloak-cdp already running"
    else
      sg docker -c "docker run -d \
        --name cloak-cdp \
        --restart unless-stopped \
        -p 9222:9222 \
        cloakhq/cloakbrowser cloakserve"
      echo "cloak-cdp started on localhost:9222"
    fi
    ;;
  stop)
    sg docker -c "docker stop cloak-cdp && docker rm cloak-cdp"
    echo "cloak-cdp stopped"
    ;;
  status)
    if sg docker -c "docker ps --format '{{.Names}}'" | grep -q cloak-cdp; then
      echo "cloak-cdp: RUNNING"
      curl -s http://localhost:9222/json/version | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Chrome: {d[\"Browser\"]}')" 2>/dev/null || echo "CDP endpoint unreachable"
    else
      echo "cloak-cdp: STOPPED"
    fi
    ;;
esac
