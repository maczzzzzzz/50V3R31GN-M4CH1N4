#!/bin/bash
# ◈ v3.8.8 NODE D MODEL FARM
# Standardizing on local ports for high-throughput reasoning

pkill -f llama-server
sleep 2

MODELS_DIR="/home/maczz/llama.cpp/models"
SERVER="/home/maczz/llama.cpp/build/bin/llama-server"

echo "● Igniting Gemma 26B (Port 8080) [Oracle]..."
$SERVER \
  -m "$MODELS_DIR/google_gemma-4-26B-A4B-it-Q6_K.gguf" \
  --host 0.0.0.0 --port 8080 \
  -c 32768 --flash-attn on --mlock -ngl 0 \
  --cache-type-k q4_0 --cache-type-v q4_0 \
  --cont-batching --log-disable > /home/maczz/gemma.log 2>&1 &

echo "● Igniting Qwen 14B (Port 8083) [Auditor]..."
$SERVER \
  -m "$MODELS_DIR/qwen2.5-coder-14b-instruct-q6_k.gguf" \
  --host 0.0.0.0 --port 8083 \
  -c 16384 --flash-attn on --mlock -ngl 0 \
  --cache-type-k q4_0 --cache-type-v q4_0 \
  --cont-batching --log-disable > /home/maczz/qwen.log 2>&1 &

echo "● Igniting GLM 4.7 (Port 8084) [Flash]..."
$SERVER \
  -m "$MODELS_DIR/GLM-4.7-Flash-UD-Q4_K_XL.gguf" \
  --host 0.0.0.0 --port 8084 \
  -c 16384 --flash-attn on --mlock -ngl 0 \
  --cache-type-k q4_0 --cache-type-v q4_0 \
  --cont-batching --log-disable > /home/maczz/glm.log 2>&1 &

echo "◈ NODE D MODEL FARM LIVE."
