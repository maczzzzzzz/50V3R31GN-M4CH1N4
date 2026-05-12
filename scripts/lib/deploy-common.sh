#!/usr/bin/env bash
# deploy-common.sh — Shared deployment utilities for Sovereign Machina
# Source this file: source "$(dirname "$0")/lib/deploy-common.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# SSH defaults
SSH_USER="${SSH_USER:-nixos}"
SSH_OPTS="-o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new"

# Execute command on remote node via SSH
# Usage: ssh_exec <node_ip> <command...>
ssh_exec() {
    local node_ip="$1"
    shift
    ssh ${SSH_OPTS} "${SSH_USER}@${node_ip}" "$@"
}

# Copy file to remote node
# Usage: scp_to_node <node_ip> <src> <dst>
scp_to_node() {
    local node_ip="$1"
    local src="$2"
    local dst="$3"
    scp ${SSH_OPTS} "${src}" "${SSH_USER}@${node_ip}:${dst}"
}

# Wait for a health endpoint with timeout
# Usage: wait_for_health <node_ip> <port> [path] [max_retries] [sleep_sec]
wait_for_health() {
    local node_ip="$1"
    local port="$2"
    local path="${3:-/health}"
    local max_retries="${4:-30}"
    local sleep_sec="${5:-2}"
    
    info "Waiting for http://${node_ip}:${port}${path}..."
    for i in $(seq 1 "$max_retries"); do
        if ssh_exec "$node_ip" "curl -sf http://localhost:${port}${path}" > /dev/null 2>&1; then
            info "Health check passed after ${i} attempts"
            return 0
        fi
        sleep "$sleep_sec"
    done
    error "Health check failed after ${max_retries} attempts"
    return 1
}

# Run a batch of SSH commands in a single session
# Usage: ssh_batch <node_ip> <<'EOF'
#   command1
#   command2
# EOF
ssh_batch() {
    local node_ip="$1"
    shift
    ssh ${SSH_OPTS} "${SSH_USER}@${node_ip}" "$@"
}
