#!/usr/bin/env bash
# Mesh socat bridge: forwards localhost ports to Tailscale mesh nodes
# Required because Docker Desktop containers cannot reach Tailscale 100.x IPs directly.
# Routes:
#   17080 -> Node A (100.96.253.114:8080) mesh-micro
#   18081 -> Node C (100.102.109.81:8081) mesh-function-calling
#   18080 -> Node D (100.120.225.12:8080) mesh-heavy

set -euo pipefail

kill_socats() {
    pkill -f "socat TCP-LISTEN:17080" 2>/dev/null || true
    pkill -f "socat TCP-LISTEN:18081" 2>/dev/null || true
    pkill -f "socat TCP-LISTEN:18080" 2>/dev/null || true
}

kill_socats

# Start forwards
socat TCP-LISTEN:17080,fork,reuseaddr TCP:100.96.253.114:8080 &
echo "Node A (mesh-micro)    :17080 -> 100.96.253.114:8080  PID=$!"

socat TCP-LISTEN:18081,fork,reuseaddr TCP:100.102.109.81:8081 &
echo "Node C (mesh-fc)       :18081 -> 100.102.109.81:8081  PID=$!"

socat TCP-LISTEN:18080,fork,reuseaddr TCP:100.120.225.12:8080 &
echo "Node D (mesh-heavy)    :18080 -> 100.120.225.12:8080  PID=$!"

sleep 1
echo ""
echo "Verifying..."
curl -s http://localhost:17080/health > /dev/null && echo "  Node A: OK" || echo "  Node A: FAIL"
curl -s http://localhost:18081/health > /dev/null && echo "  Node C: OK" || echo "  Node C: FAIL"
curl -s http://localhost:18080/health > /dev/null && echo "  Node D: OK" || echo "  Node D: FAIL"
echo "Done. Keep this script running or daemonize it."
