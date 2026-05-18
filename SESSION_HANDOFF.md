# SESSION HANDOFF (v0.3.9-alpha)

**Date:** 2026-05-18
**Branch:** stable/mesh-alpha
**Architect:** GLM-5 (zai)

---

## CURRENT STATE

### Completed Work

**Full Mesh Baseline Benchmark - ALL 5 NODES OPERATIONAL:**

| Node | Backend | Model | Gen t/s | Prompt t/s | Hardware |
|------|---------|-------|---------|------------|----------|
| A | mesh-micro | Qwen3-0.6B Q8_0 | 39.5 | 62.1 | GTX 1050 Ti |
| B | mesh-fast | Qwopus3.5-9B Q8_0 | 23.2 | 132.5 | Vulkan RX 9060 XT |
| B | mesh-vision | Qwen3-VL-2B Q6_K | 172.4 | 381.2 | Vulkan RX 9060 XT |
| C | mesh-fc | Carnice-9B-FC | 50.3 | 245.0 | CUDA RTX 2060 |
| D | mesh-heavy | Qwen3.5-35B Q4_K_M | 6.7 | 13.6 | CPU Meteor Lake |

**Continuous Batching Results:**
- mesh-fast: 39.1 t/s at 4 concurrent (+84% vs single)
- mesh-vision: 369.3 t/s at 4 concurrent (+143% vs single)

**Key Findings:**
- Node D speculative decoding: ALL MODES REJECTED (MTP 2.8x slower, ngram-mod 16% slower on CPU)
- LiteLLM model routing has bug - bypassed with direct backend access
- Node A required llama.cpp build from source (Nix pkg too old for Qwen3)

### Scripts Created
- `scripts/direct-benchmark.py` - Single-request mesh benchmark
- `scripts/concurrent-benchmark.py` - Multi-request cont-batching test
- `scripts/mesh-control.sh` - Node start/stop/status/kill-ghost
- `sidecars/mesh/start-mesh-bridge.sh` - Socat bridges for Docker
- `D:\llama.cpp\start-hermes-cb.bat` - Cont-batching startup
- `D:\llama.cpp\start-vision-cb.bat` - Cont-batching startup

### Cleanup Completed
- Removed 14 superseded scripts (mesh-benchmark.py, old .sh files, archive scripts)

---

## INFRASTRUCTURE STATUS

### All Services Running
- **Node A:** llama-server on port 8080 (built from source)
- **Node B:** llama-server on 8081/8082 with cont-batching enabled
- **Node C:** llama-server CUDA on port 8081
- **Node D:** llama-server CPU on port 8080 (no speculative decoding)
- **LiteLLM:** Docker on port 4000 (5 routes, model routing buggy)
- **hermes-relay:** Docker on port 8767
- **Socat bridges:** 8081, 8082, 17080, 18080, 18081

### Known Issues
- **LiteLLM model name stripping:** `openai/` prefix removed, breaks backend routing. Workaround: use direct backend access via socat bridges.
- **Node A startup:** Manual start required until systemd service created.

---

## NEXT STEPS

1. **Fix LiteLLM model routing** or accept direct backend approach
2. **Create Node A systemd service** for auto-start on boot
3. **Node D GPU upgrade** - RTX 5060 Ti 16GB via OCuLink (docs/planning/node-d-5060ti-upgrade.md)
4. **Node B CPU draft speculative** - Feasibility analysis complete (docs/benchmarks/archive/node-b-cpu-draft-speculative.md)

---

## FILES

```
docs/benchmarks/mesh-baseline-2026-05-18.md     # Full report
docs/benchmarks/direct-backend-2026-05-18.json  # Raw data
scripts/direct-benchmark.py                      # Working benchmark
scripts/concurrent-benchmark.py                  # Cont-batching test
scripts/mesh-control.sh                          # Node management
sidecars/mesh/start-mesh-bridge.sh              # Socat bridges
```
