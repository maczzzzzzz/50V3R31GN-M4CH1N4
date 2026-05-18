# Mesh Baseline Benchmark - 2026-05-18

**Methodology:** Direct backend testing via socat bridges. All 5 nodes operational.

## Single-Request Throughput (Baseline)

| Backend | Model | Hardware | Gen t/s | Prompt t/s |
|---------|-------|----------|---------|------------|
| mesh-fast | Qwopus3.5-9B Q8_0 | Node B Vulkan RX 9060 XT | **23.2** | 132.5 |
| mesh-vision | Qwen3-VL-2B-Instruct Q6_K | Node B Vulkan RX 9060 XT | **172.4** | 381.2 |
| mesh-heavy | Qwen3.5-35B-A3B UD-Q4_K_M | Node D CPU (Meteor Lake) | **6.7** | 13.6 |
| mesh-function-calling | Carnice-9B-FC i1-Q4_K_M | Node C CUDA RTX 2060 | **50.3** | 245.0 |
| mesh-micro | Qwen3-0.6B Q8_0 | Node A GTX 1050 Ti | **39.5** | 62.1 |

## Continuous Batching Results (Concurrent Load)

**Configuration:** `-cb -np 4` (continuous batching, 4 slots)

| Backend | Concurrency | Effective t/s | Improvement |
|---------|-------------|---------------|-------------|
| mesh-fast | 1 | 21.2 | baseline |
| mesh-fast | 2 | 30.1 | +42% |
| mesh-fast | 4 | **39.1** | **+84%** |
| mesh-fast | 8 | 38.7 | plateau |
| mesh-vision | 1 | 152.1 | baseline |
| mesh-vision | 2 | 261.9 | +72% |
| mesh-vision | 4 | **369.3** | **+143%** |
| mesh-vision | 8 | 327.2 | -11% (overload) |

### Key Findings

1. **Continuous batching dramatically improves throughput under load**
   - mesh-fast: +84% at 4 concurrent requests
   - mesh-vision: +143% at 4 concurrent requests

2. **Optimal concurrency is 4 slots** (matches `-np 4` config)
   - Going to 8 concurrent provides no additional benefit
   - mesh-vision actually degrades at 8 (overhead > benefit)

3. **mesh-vision is extremely efficient** - 369 t/s effective throughput for a 2B model

4. **Node D CPU-bound** - 6.7 t/s is expected for 35B MoE on CPU
   - NO speculative decoding (MTP 2.8x slower, ngram-mod 16% slower)

5. **Node A operational** - Built llama.cpp from source (Nix package too old for Qwen3)

## Node Status

| Node | Status | Notes |
|------|--------|-------|
| Node A | UP | Built from source, Qwen3-0.6B |
| Node B | UP | Both servers with cont-batching enabled (8081, 8082) |
| Node C | UP | ik_llama.cpp CUDA, Carnice-9B-FC |
| Node D | UP | Plain inference (no speculative - net negative on CPU) |

## LiteLLM Router Issues

LiteLLM has a model name mapping bug when using OpenAI-compatible backends:
- Config uses `openai/ModelName`
- LiteLLM strips the prefix incorrectly
- Backend receives wrong model name → 404

**Current workaround:** Direct backend access via socat bridges

## Files

- Single-request benchmark: `scripts/direct-benchmark.py`
- Concurrent benchmark: `scripts/concurrent-benchmark.py`
- Raw data: `docs/benchmarks/*.json`
- Socat bridges: `sidecars/mesh/start-mesh-bridge.sh`
- Cont-batching batch files: `D:\llama.cpp\start-*-cb.bat`
