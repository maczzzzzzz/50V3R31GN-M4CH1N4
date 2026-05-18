#!/bin/bash
# Sovereign Mesh Control - Start/Stop/Status for all inference nodes
# Usage: mesh-control.sh [start|stop|status|restart|kill-ghost]

set -e

NODES=("mesh-a" "mesh-c" "mesh-d")
NODE_A_HOST="100.96.253.114"
NODE_C_HOST="100.102.109.81"
NODE_D_HOST="100.120.225.12"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_node() {
    local node=$1
    local host=$2
    local port=$3
    local model=$4
    
    echo -n "  $node ($host:$port) - $model: "
    
    # Check if process is running
    local proc_count=$(ssh "$node" "pgrep -c llama-server 2>/dev/null" || echo "0")
    proc_count=$(echo "$proc_count" | tr -d '[:space:]')
    
    if [ "$proc_count" -gt 0 ] 2>/dev/null; then
        # Check if port is listening
        local port_check=$(ssh "$node" "ss -tlnp 2>/dev/null | grep -c ':$port ' || echo 0")
        if [ "$port_check" -gt 0 ]; then
            echo -e "${GREEN}RUNNING${NC}"
            return 0
        else
            echo -e "${YELLOW}PROCESS UP, PORT DOWN${NC}"
            return 1
        fi
    else
        echo -e "${RED}DOWN${NC}"
        return 2
    fi
}

kill_ghost() {
    local node=$1
    log_info "Killing ghost llama processes on $node..."
    ssh "$node" "pkill -9 llama-server 2>/dev/null; pkill -9 llama 2>/dev/null" || true
}

start_node_a() {
    log_info "Starting Node A (mesh-micro)..."
    # Check if llama.cpp exists
    if ! ssh mesh-a "[ -f /run/current-system/sw/bin/llama-server ]" 2>/dev/null; then
        log_error "Node A: llama-server not found in Nix store. Install with: nix-env -iA nixpkgs.llama-cpp"
        return 1
    fi
    
    ssh mesh-a "nohup llama-server -m ~/models/Qwen3-0.6B-Q8_0.gguf --host 0.0.0.0 --port 8080 --ctx-size 4096 -t 4 --parallel 1 --metrics > ~/llama-micro.log 2>&1 &"
    log_info "Node A started, check ~/llama-micro.log for output"
}

start_node_c() {
    log_info "Starting Node C (mesh-function-calling)..."
    ssh mesh-c "cd ~/ik_llama.cpp && nohup build/bin/llama-server -m models/Carnice-9B-Function-Calling-xLAM-Unsloth.i1-Q4_K_M.gguf --host 0.0.0.0 --port 8081 -c 8192 -ngl 99 -t 8 --parallel 1 --metrics -ctk q4_0 -ctv q4_0 -fa on > ~/carnice-server.log 2>&1 &"
    log_info "Node C started"
}

start_node_d() {
    log_info "Starting Node D (mesh-heavy)..."
    # Node D: NO speculative decoding on CPU - it's 16% slower
    ssh mesh-d "cd ~/llama.cpp-latest && nohup build/bin/llama-server -m ~/models/Qwen3.5-35B-A3B-MTP-UD-Q4_K_M.gguf --host 0.0.0.0 --port 8080 --ctx-size 8192 --flash-attn on --cache-type-k q4_0 --cache-type-v q4_0 -t 8 --parallel 1 --metrics > ~/qwen35-heavy.log 2>&1 &"
    log_info "Node D started (NO speculative - MTP is net negative on CPU)"
}

stop_node() {
    local node=$1
    log_info "Stopping $node..."
    ssh "$node" "pkill -TERM llama-server 2>/dev/null || true"
    sleep 2
    ssh "$node" "pkill -9 llama-server 2>/dev/null || true"
}

case "${1:-status}" in
    status)
        echo "=== MESH STATUS ==="
        check_node "mesh-a" "$NODE_A_HOST" "8080" "Qwen3-0.6B"
        check_node "mesh-c" "$NODE_C_HOST" "8081" "Carnice-9B-FC"
        check_node "mesh-d" "$NODE_D_HOST" "8080" "Qwen3.5-35B"
        echo ""
        echo "=== LOCAL (Node B via Docker) ==="
        echo -n "  LiteLLM Router (4000): "
        curl -s http://localhost:4000/health >/dev/null 2>&1 && echo -e "${GREEN}UP${NC}" || echo -e "${RED}DOWN${NC}"
        echo -n "  Socat bridges: "
        ss -tlnp 2>/dev/null | grep -q ":17080" && echo -n "17080✓ " || echo -n "17080✗ "
        ss -tlnp 2>/dev/null | grep -q ":18080" && echo -n "18080✓ " || echo -n "18080✗ "
        ss -tlnp 2>/dev/null | grep -q ":18081" && echo "18081✓" || echo "18081✗"
        ;;
    
    start)
        log_info "Starting mesh nodes..."
        start_node_a
        start_node_c
        start_node_d
        sleep 3
        $0 status
        ;;
    
    stop)
        log_info "Stopping all mesh nodes..."
        for node in "${NODES[@]}"; do
            stop_node "$node"
        done
        ;;
    
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    
    kill-ghost)
        log_warn "Killing ALL llama processes on all nodes..."
        for node in "${NODES[@]}"; do
            kill_ghost "$node"
        done
        ;;
    
    *)
        echo "Usage: $0 {start|stop|status|restart|kill-ghost}"
        exit 1
        ;;
esac
