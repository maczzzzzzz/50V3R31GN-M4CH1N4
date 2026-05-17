#!/usr/bin/env bash
# deploy-node-d-mtp.sh
# Swap Carnice MoE 35B -> Qwen3.5-35B-A3B-MTP UD-Q4_K_M on Node D
# Tests draft-mtp speculative decoding support
#
# Usage: ./deploy-node-d-mtp.sh [--dry-run]
set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

SSH_TARGET="mesh-d"
REMOTE_USER="maczz"
REMOTE_LLAMA="/home/maczz/llama.cpp-latest/build/bin/llama-server"
MODELS_DIR="/home/maczz/models"
STAGING_DIR="/mnt/d/llama.cpp/models/mtp-staging/Qwen3.5-35B-A3B-MTP"
MODEL_FILE="Qwen3.5-35B-A3B-UD-Q4_K_M.gguf"
OLD_MODEL="Carnice-Qwen3.6-MoE-35B-A3B-Q4_K_M.gguf"
PORT=8080

echo "=== Node D MTP Deployment ==="
echo "Target: ${SSH_TARGET}"
echo "Model: ${MODEL_FILE}"
echo ""

# Step 1: Verify download exists locally
if [[ ! -f "${STAGING_DIR}/${MODEL_FILE}" ]]; then
    echo "ERROR: ${STAGING_DIR}/${MODEL_FILE} not found. Download first."
    exit 1
fi

LOCAL_SIZE=$(stat -c%s "${STAGING_DIR}/${MODEL_FILE}" 2>/dev/null || echo "0")
echo "Local model size: $(( LOCAL_SIZE / 1024 / 1024 / 1024 ))GB"

if [[ ${LOCAL_SIZE} -lt 10000000000 ]]; then
    echo "ERROR: Model file too small (${LOCAL_SIZE} bytes). Expected ~12-13GB. Download incomplete?"
    exit 1
fi

# Step 2: SCP to Node D
echo ""
echo "[Step 2/5] Transferring model to Node D..."
if $DRY_RUN; then
    echo "DRY RUN: would scp ${STAGING_DIR}/${MODEL_FILE} ${SSH_TARGET}:${MODELS_DIR}/"
else
    ssh "${SSH_TARGET}" "mkdir -p ${MODELS_DIR}"
    scp "${STAGING_DIR}/${MODEL_FILE}" "${SSH_TARGET}:${MODELS_DIR}/${MODEL_FILE}"
    echo "Transfer complete."
fi

# Step 3: Verify remote file
echo ""
echo "[Step 3/5] Verifying remote file..."
REMOTE_SIZE=$(ssh "${SSH_TARGET}" "stat -c%s ${MODELS_DIR}/${MODEL_FILE}" 2>/dev/null || echo "0")
if [[ ${REMOTE_SIZE} -ne ${LOCAL_SIZE} ]]; then
    echo "ERROR: Size mismatch. Local=${LOCAL_SIZE} Remote=${REMOTE_SIZE}"
    exit 1
fi
echo "Remote file verified: $(( REMOTE_SIZE / 1024 / 1024 / 1024 ))GB"

# Step 4: Stop current server
echo ""
echo "[Step 4/5] Stopping current llama-server..."
CURRENT_PID=$(ssh "${SSH_TARGET}" "pgrep -f 'llama-server.*Carnice'" 2>/dev/null || echo "")
if [[ -n "${CURRENT_PID}" ]]; then
    if $DRY_RUN; then
        echo "DRY RUN: would kill PID ${CURRENT_PID}"
    else
        ssh "${SSH_TARGET}" "kill ${CURRENT_PID}"
        sleep 2
        echo "Stopped PID ${CURRENT_PID}"
    fi
else
    echo "No running Carnice server found."
fi

# Step 5: Start new server with draft-mtp
echo ""
echo "[Step 5/5] Starting Qwen3.5-35B-A3B-MTP with draft-mtp..."
LAUNCH_CMD="${REMOTE_LLAMA} \
    -m ${MODELS_DIR}/${MODEL_FILE} \
    --host 0.0.0.0 \
    --port ${PORT} \
    --ctx-size 8192 \
    --flash-attn on \
    --cache-type-k q4_0 \
    --cache-type-v q4_0 \
    -t 8 \
    --parallel 1 \
    --spec-type draft-mtp \
    --metrics \
    --log-disable"

if $DRY_RUN; then
    echo "DRY RUN: would run:"
    echo "  ssh ${SSH_TARGET} \"nohup ${LAUNCH_CMD} > /home/maczz/heavy_reasoner_mtp.log 2>&1 &\""
else
    ssh "${SSH_TARGET}" "nohup ${LAUNCH_CMD} > /home/maczz/heavy_reasoner_mtp.log 2>&1 &"
    sleep 3
    # Verify
    NEW_PID=$(ssh "${SSH_TARGET}" "pgrep -f 'llama-server.*MTP'" 2>/dev/null || echo "")
    if [[ -n "${NEW_PID}" ]]; then
        echo "Server started PID ${NEW_PID}"
        echo "Log: ssh ${SSH_TARGET} cat /home/maczz/heavy_reasoner_mtp.log"
    else
        echo "WARNING: Server may not have started. Check log:"
        ssh "${SSH_TARGET}" "tail -20 /home/maczz/heavy_reasoner_mtp.log" 2>/dev/null
    fi
fi

echo ""
echo "=== Deployment complete ==="
echo "Test: curl http://$(ssh ${SSH_TARGET} 'hostname -I' 2>/dev/null | awk '{print $1}'):${PORT}/v1/chat/completions"
echo "       -H 'Content-Type: application/json'"
echo "       -d '{\"model\":\"qwen35-mtp\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"max_tokens\":50}'"
