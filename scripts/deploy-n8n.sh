#!/usr/bin/env bash
#
# n8n Deployment Script — Sovereign Machina Phase 5
#
# Provisions an n8n workflow automation instance on Node B
# (Director's Forge, 100.66.173.31) using Docker.
#
# Prerequisites:
#   - Docker and docker-compose on Node B
#   - SSH access to Node B (user: $SSH_USER)
#   - Tailscale Artery connectivity
#
# Usage:
#   ./deploy-n8n.sh              # Deploy to Node B via SSH
#   ./deploy-n8n.sh --local      # Deploy locally (if on Node B)
#

set -euo pipefail

# Node definitions (Tailscale Artery)
NODE_B="100.66.173.31"  # Director's Forge
SSH_USER="${SSH_USER:-maczz}"

# n8n configuration
N8N_PORT="${N8N_PORT:-5678}"
N8N_DATA_DIR="${N8N_DATA_DIR:-/opt/n8n/data}"
N8N_CONFIG_DIR="${N8N_CONFIG_DIR:-/opt/n8n/config}"
N8N_IMAGE="${N8N_IMAGE:-n8nio/n8n:latest}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ------------------------------------------------------------------
# Parse arguments
# ------------------------------------------------------------------
LOCAL_MODE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)  LOCAL_MODE=true; shift ;;
        --help|-h)
            echo "Usage: $0 [--local] [--help]"
            echo ""
            echo "  --local    Deploy on the current host (skip SSH)"
            echo "  --help     Show this help message"
            exit 0
            ;;
        *)
            error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

echo "================================================"
echo "  n8n DEPLOYMENT — SOVEREIGN MACHINA PHASE 5"
echo "================================================"
echo ""

# ------------------------------------------------------------------
# Validate required environment variables
# ------------------------------------------------------------------
if [ -z "${N8N_PASSWORD:-}" ]; then
    error "N8N_PASSWORD environment variable is required. Set it before running deploy."
    exit 1
fi
N8N_BASIC_AUTH_PASSWORD="${N8N_PASSWORD}"

# ------------------------------------------------------------------
# Docker compose definition
# ------------------------------------------------------------------
DOCKER_COMPOSE=$(cat <<'COMPOSE_EOF'
version: "3.8"

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: sovereign-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=sovereign
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://100.66.173.31:5678/
      - N8N_PAYLOAD_SIZE_MAX=16
      - DB_TYPE=sqlite
      - DB_SQLITE_DATABASE=/data/n8n.sqlite
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
      - GENERIC_TIMEZONE=UTC
      - TZ=UTC
    volumes:
      - n8n_data:/data
      - n8n_config:/home/node/.n8n
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:5678/healthz || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

volumes:
  n8n_data:
    driver: local
  n8n_config:
    driver: local
COMPOSE_EOF
)

# ------------------------------------------------------------------
# Deploy function
# ------------------------------------------------------------------
deploy() {
    local target="$1"

    info "Deploying n8n to ${target}..."

    # Create directories
    ssh "${SSH_USER}@${target}" "sudo mkdir -p ${N8N_DATA_DIR} ${N8N_CONFIG_DIR}"

    # Write docker-compose.yml
    echo "${DOCKER_COMPOSE}" | ssh "${SSH_USER}@${target}" "cat > /tmp/docker-compose-n8n.yml"
    ssh "${SSH_USER}@${target}" "sudo mv /tmp/docker-compose-n8n.yml ${N8N_CONFIG_DIR}/docker-compose.yml"

    # Pull the latest image
    info "Pulling ${N8N_IMAGE}..."
    ssh "${SSH_USER}@${target}" "docker pull ${N8N_IMAGE}"

    # Start n8n
    info "Starting n8n container..."
    ssh "${SSH_USER}@${target}" \
        "cd ${N8N_CONFIG_DIR} && docker compose up -d"

    # Wait for health check
    info "Waiting for n8n to become healthy..."
    local retries=30
    local count=0
    while [[ $count -lt $retries ]]; do
        if ssh "${SSH_USER}@${target}" "curl -sf http://localhost:${N8N_PORT}/healthz" > /dev/null 2>&1; then
            info "n8n is healthy!"
            return 0
        fi
        count=$((count + 1))
        sleep 2
    done

    warn "n8n did not become healthy within $((retries * 2)) seconds."
    warn "Check logs: ssh ${SSH_USER}@${target} 'docker logs sovereign-n8n'"
    return 1
}

deploy_local() {
    info "Deploying n8n locally..."

    sudo mkdir -p "${N8N_DATA_DIR}" "${N8N_CONFIG_DIR}"

    # Write docker-compose.yml
    echo "${DOCKER_COMPOSE}" | sudo tee "${N8N_CONFIG_DIR}/docker-compose.yml" > /dev/null

    # Pull the latest image
    info "Pulling ${N8N_IMAGE}..."
    docker pull "${N8N_IMAGE}"

    # Start n8n
    info "Starting n8n container..."
    cd "${N8N_CONFIG_DIR}" && docker compose up -d

    # Wait for health check
    info "Waiting for n8n to become healthy..."
    local retries=30
    local count=0
    while [[ $count -lt $retries ]]; do
        if curl -sf "http://localhost:${N8N_PORT}/healthz" > /dev/null 2>&1; then
            info "n8n is healthy!"
            return 0
        fi
        count=$((count + 1))
        sleep 2
    done

    warn "n8n did not become healthy within $((retries * 2)) seconds."
    warn "Check logs: docker logs sovereign-n8n"
    return 1
}

# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
if [[ "$LOCAL_MODE" == "true" ]]; then
    deploy_local
else
    deploy "${NODE_B}"
fi

# ------------------------------------------------------------------
# Post-deployment verification
# ------------------------------------------------------------------
echo ""
info "Running post-deployment verification..."

VERIFY_URL="http://${NODE_B}:${N8N_PORT}/healthz"
if [[ "$LOCAL_MODE" == "true" ]]; then
    VERIFY_URL="http://localhost:${N8N_PORT}/healthz"
fi

if curl -sf "${VERIFY_URL}" > /dev/null 2>&1; then
    info "✅ Verification passed: ${VERIFY_URL} returns 200"
else
    warn "⚠️  Verification failed: ${VERIFY_URL} not responding"
    warn "   n8n may still be starting up. Retry in a few seconds."
fi

echo ""
echo "================================================"
echo "  ✅ n8n DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "  n8n Dashboard: http://${NODE_B}:${N8N_PORT}"
echo "  Health Check:  curl http://${NODE_B}:${N8N_PORT}/healthz"
echo ""
echo "  Next steps:"
echo "    1. Open the n8n dashboard and generate an API key"
echo "    2. Set N8N_API_KEY in your .env or cli-config.yaml"
echo "    3. Restart Hermes to register n8n-mcp tools"
echo ""
