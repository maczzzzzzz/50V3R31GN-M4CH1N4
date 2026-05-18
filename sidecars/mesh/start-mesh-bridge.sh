#!/usr/bin/env bash
# Mesh socat bridge: forwards localhost ports to Tailscale mesh nodes
# Required because Docker Desktop containers cannot reach Tailscale 100.x IPs directly.
# Routes:
#   8081  -> Node B (Windows host) mesh-fast
#   8082  -> Node B (Windows host) mesh-vision
#   17080 -> Node A (100.96.253.114:8080) mesh-micro
#   18081 -> Node C (100.102.109.81:8081) mesh-function-calling
#   18080 -> Node D (100.120.225.12:8080) mesh-heavy

set -euo pipefail

kill_socats() {
    pkill -f "socat TCP-LISTEN:8081" 2>/dev/null || true
    pkill -f "socat TCP-LISTEN:8082" 2>/dev/null || true
    pkill -f "socat TCP-LISTEN:17080" 2>/dev/null || true
    pkill -f "socat TCP-LISTEN:18081" 2>/dev/null || true
    pkill -f "socat TCP-LISTEN:18080" 2>/dev/null || true
}

kill_socats

# Node B (Windows host via WSL IP 10.0.0.11)
socat TCP-LISTEN:8081,fork,reuseaddr TCP:10.0.0.11:8081 &
echo "Node B (mesh-fast)    :8081 -> 10.0.0.11:8081  PID=$!"

socat TCP-LISTEN:8082,fork,reuseaddr TCP:10.0.0.11:8082 &
echo "Node B (mesh-vision)   :8082 -> 10.0.0.11:8082  PID=$!"

# Remote nodes via Tailscale
socat TCP-LISTEN:17080,fork,reuseaddr TCP:100.96.253.114:8080 &
echo "Node A (mesh-micro)    :17080 -> 100.96.253.114:8080  PID=$!"

socat TCP-LISTEN:18081,fork,reuseaddr TCP:100.102.109.81:8081 &
echo "Node C (mesh-fc)       :18081 -> 100.102.109.81:8081  PID=$!"

socat TCP-LISTEN:18080,fork,reuseaddr TCP:100.120.225.12:8080 &
echo "Node D (mesh-heavy)    :18080 -> 100.120.225.12:8080  PID=$!"

sleep 1
echo ""
echo "Verifying..."
for port in 8081 8082 17080 18081 18080; do
    curl -s --connect-timeout 2 http://localhost:$port/health > /dev/null 2>&1 && echo "  Port $port: OK" || echo "  Port $port: FAIL"
done
echo "Done. Keep this script running or daemonize it."
