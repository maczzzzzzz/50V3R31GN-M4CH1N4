#!/usr/bin/env bash
# benchmark-node-b-mtp.sh
# Benchmark Hermes-4-14B vs Qwen3.5-9B-MTP on Node B
# Must run on Node B (Windows/WSL2) where Vulkan llama-server runs
#
# Usage: ./benchmark-node-b-mtp.sh [--prep|--bench-hermes|--bench-mtp|--all]
set -euo pipefail

MODE="${1:---all}"
STAGING_DIR="/mnt/d/llama.cpp/models/mtp-staging/Qwen3.5-9B-MTP"
MODEL_FILE="Qwen3.5-9B-Q4_K_M.gguf"
LLAMA_DIR="/mnt/d/llama.cpp"
LLAMA_SERVER="${LLAMA_DIR}/llama-server.exe"
PORT=8081  # Use same port as Hermes for A/B testing
BENCH_PROMPT="Explain the architecture of a transformer model in 200 words. Be technical and precise."
WARMUP_PROMPT="Hello"

benchmark_prompt() {
    local url="http://10.0.0.11:${PORT}/v1/chat/completions"
    local start end elapsed

    # Warmup
    curl -s "${url}" -H "Content-Type: application/json" \
        -d "{\"model\":\"bench\",\"messages\":[{\"role\":\"user\",\"content\":\"${WARMUP_PROMPT}\"}],\"max_tokens\":10}" > /dev/null 2>&1
    sleep 1

    # Actual benchmark
    start=$(date +%s%N)
    result=$(curl -s "${url}" -H "Content-Type: application/json" \
        -d "{\"model\":\"bench\",\"messages\":[{\"role\":\"user\",\"content\":\"${BENCH_PROMPT}\"}],\"max_tokens\":200}" 2>&1)
    end=$(date +%s%N)

    elapsed=$(( (end - start) / 1000000 ))

    # Extract token counts from usage
    prompt_tokens=$(echo "${result}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('usage',{}).get('prompt_tokens','?'))" 2>/dev/null || echo "?")
    completion_tokens=$(echo "${result}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('usage',{}).get('completion_tokens','?'))" 2>/dev/null || echo "?")

    if [[ "${completion_tokens}" != "?" ]] && [[ "${completion_tokens}" -gt 0 ]]; then
        total_ms=${elapsed}
        prompt_tps="N/A"
        gen_tps=$(echo "scale=1; ${completion_tokens} * 1000 / ${total_ms}" | bc 2>/dev/null || echo "?")
        echo "  Total time: ${total_ms}ms | Prompt tokens: ${prompt_tokens} | Gen tokens: ${completion_tokens} | Gen t/s: ${gen_tps}"
    else
        echo "  Benchmark failed. Raw response:"
        echo "${result}" | head -5
    fi
}

stop_server() {
    # Kill any llama-server on the target port
    taskkill.exe /F /IM llama-server.exe > /dev/null 2>&1 || true
    sleep 2
}

start_hermes() {
    echo "Starting Hermes-4-14B Q4_K_M (Vulkan)..."
    ${LLAMA_SERVER} \
        -m "${LLAMA_DIR}/models/NousResearch_Hermes-4-14B-Q4_K_M.gguf" \
        --host 0.0.0.0 --port ${PORT} \
        --ctx-size 4096 --flash-attn on \
        --cache-type-k q4_0 --cache-type-v q4_0 \
        -ngl 99 -t 4 \
        --metrics --log-disable &
    sleep 5
    echo "Hermes started."
}

start_mtp() {
    echo "Starting Qwen3.5-9B-MTP Q4_K_M (Vulkan)..."
    ${LLAMA_SERVER} \
        -m "${STAGING_DIR}/${MODEL_FILE}" \
        --host 0.0.0.0 --port ${PORT} \
        --ctx-size 4096 --flash-attn on \
        --cache-type-k q4_0 --cache-type-v q4_0 \
        -ngl 99 -t 4 \
        --spec-type draft-mtp \
        --metrics --log-disable &
    sleep 5
    echo "Qwen3.5-9B-MTP started."
}

case "${MODE}" in
    --prep)
        if [[ ! -f "${STAGING_DIR}/${MODEL_FILE}" ]]; then
            echo "ERROR: ${STAGING_DIR}/${MODEL_FILE} not found. Download first."
            exit 1
        fi
        echo "Model ready for benchmark."
        ;;
    --bench-hermes)
        echo "=== Benchmarking Hermes-4-14B ==="
        benchmark_prompt
        ;;
    --bench-mtp)
        echo "=== Benchmarking Qwen3.5-9B-MTP ==="
        benchmark_prompt
        ;;
    --all)
        echo "=========================================="
        echo "  Node B Model Shootout"
        echo "  Hermes-4-14B Q4_K_M vs Qwen3.5-9B-MTP Q4_K_M"
        echo "=========================================="
        echo ""

        # Phase 1: Hermes
        stop_server
        start_hermes
        echo ""
        echo "--- Hermes-4-14B Results ---"
        benchmark_prompt
        benchmark_prompt
        benchmark_prompt
        echo ""

        # Phase 2: Qwen3.5-9B-MTP
        stop_server
        start_mtp
        echo ""
        echo "--- Qwen3.5-9B-MTP Results ---"
        benchmark_prompt
        benchmark_prompt
        benchmark_prompt
        echo ""

        stop_server
        echo "=== Benchmark complete. Restart production Hermes manually. ==="
        ;;
    *)
        echo "Usage: $0 [--prep|--bench-hermes|--bench-mtp|--all]"
        exit 1
        ;;
esac
