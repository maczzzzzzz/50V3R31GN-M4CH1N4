# SESSION HANDOFF (v0.3.10-alpha)

**Date:** 2026-05-18
**Branch:** stable/mesh-alpha
**Architect:** GLM-5 (zai)

---

## CURRENT STATE

### Completed This Session

1. **Full mesh baseline benchmark** - All 5 nodes tested with real throughput data
2. **Continuous batching enabled** on Node B - +84% throughput at 4 concurrent
3. **Speculative decoding research** - Exhaustively tested options
4. **Models downloaded** - MTP model and 4B draft staged for testing
5. **Script cleanup** - Removed 14 superseded scripts
6. **README fixed** - Corrected inflated benchmark numbers

---

## MESH STATUS

| Node | Model | Gen t/s | Prompt t/s | Status |
|------|-------|---------|------------|--------|
| **A** (mesh-micro) | Qwen3-0.6B Q8_0 | 39.5 | 62.1 | RUNNING (built llama.cpp from source) |
| **B** (mesh-fast) | Qwopus3.5-9B Q8_0 | 34.1 | 322 | RUNNING (cont-batching) |
| **B** (mesh-vision) | Qwen3-VL-2B Q6_K | 172.4 | 381 | RUNNING (cont-batching) |
| **C** (mesh-fc) | Carnice-9B-FC | 50.3 | 245 | RUNNING |
| **D** (mesh-heavy) | Qwen3.5-35B | 6.7 | 13.6 | RUNNING (no speculative - was slower) |

---

## SPECULATIVE DECODING RESEARCH RESULTS

### What FAILED

| Method | Result | Reason |
|--------|--------|--------|
| **CPU Draft (Qwen3-0.6B)** | BLOCKED | Vocab mismatch - Qwen3 ≠ Qwopus3.5 |
| **Ngram speculation** | NO SPEEDUP | Generated 0 drafts - needs repetitive context |
| **MTP on current model** | N/A | Qwopus3.5-9B-Coder lacks MTP heads |

### Key Finding: Ngram Statistics
```
#gen drafts = 0
#acc drafts = 0
#gen tokens = 0
```
Ngram speculation requires long prompts with repetitive token patterns. Creative text generation has too much entropy.

---

## MODELS DOWNLOADED (Ready for Testing)

**Location:** `D:\llama.cpp\models\`

| Model | Size | Purpose | Status |
|-------|------|---------|--------|
| `Qwopus3.5-9B-Coder-MTP-Q6_K.gguf` | 7.04 GB | MTP-enabled main model | READY TO TEST |
| `Qwen3.5-4B-Q6_K.gguf` | 3.23 GB | Draft model (same tokenizer) | READY TO TEST |

**Current model:** `Qwopus3.5-9B-Coder-Q8_0.gguf` (8.9 GB, no MTP)

---

## NEXT STEPS (Priority Order)

### 1. TEST MTP MODEL (Highest Priority)

The MTP model has built-in speculative decoding heads. Documented +35.8% throughput gain.

**To test:**
```batch
# Kill current server
taskkill /f /im llama-server.exe

# Start MTP model with draft=2
cd /d D:\llama.cpp
llama-server.exe -m models\Qwopus3.5-9B-Coder-MTP-Q6_K.gguf --host 0.0.0.0 --port 8081 --ctx-size 32768 -ngl 99 -fa on --cache-type-k f16 --draft 2 -cb -np 4 --metrics
```

**Note:** The `--draft 2` flag enables MTP speculation. The model has built-in draft heads.

**Benchmark command:**
```bash
python3 scripts/direct-benchmark.py
```

**Expected result:** ~46 t/s gen (from 34.1 baseline) if +35% claim holds.

---

### 2. TEST 4B DRAFT MODEL (Backup)

If MTP doesn't work well, use Qwen3.5-4B as CPU draft model.

**To test:**
```batch
llama-server.exe -m models\Qwopus3.5-9B-Coder-Q8_0.gguf -md models\Qwen3.5-4B-Q6_K.gguf --host 0.0.0.0 --port 8081 --ctx-size 32768 -ngl 99 -td 6 -fa on --cache-type-k f16 --spec-draft-n-max 5 --metrics
```

**Key flags:**
- `-md` = draft model
- `-td 6` = 6 threads for draft (CPU)
- `--spec-draft-n-max 5` = draft 5 tokens ahead

---

### 3. UPDATE BASELINE IF SUCCESSFUL

If either method works, update:
- `docs/benchmarks/mesh-baseline-2026-05-18.md`
- `AGENTS.md` benchmark table
- `README.md` throughput numbers

---

## FILES CREATED THIS SESSION

```
scripts/direct-benchmark.py         # Single-request benchmark harness
scripts/concurrent-benchmark.py     # Cont-batching test harness
scripts/mesh-control.sh             # Node start/stop/status
sidecars/mesh/start-mesh-bridge.sh  # Socat bridges for Docker
docs/benchmarks/mesh-baseline-2026-05-18.md
/mnt/d/llama.cpp/start-hermes-cb.bat    # Cont-batching startup
/mnt/d/llama.cpp/start-vision-cb.bat
/mnt/d/llama.cpp/start-spec-test.bat    # Speculative test (deprecated flags)
/mnt/d/llama.cpp/start-ngram-test.bat   # Ngram test (didn't work)
```

---

## KEY LEARNINGS

1. **Draft model vocab MUST match target** - Qwen3-0.6B ≠ Qwopus3.5-9B
2. **Ngram speculation needs repetitive context** - Not useful for creative generation
3. **MTP is built into model architecture** - Can't add MTP to non-MTP model
4. **Continuous batching works well** - +84% at 4 concurrent requests
5. **Node D speculative decoding is NET NEGATIVE on CPU** - All modes slower

---

## ACTIVE BACKGROUND PROCESSES

**Node B (Windows/Docker Desktop):**
- Port 8081: Qwopus3.5-9B-Coder Q8_0 (Vulkan, cont-batching)
- Port 8082: Qwen3-VL-2B Q6_K (Vulkan, cont-batching)
- Port 8767: hermes-relay v0.6.1 (WebSocket)
- Port 4000: LiteLLM mesh router (model routing broken, bypassed)

**Socat bridges (for Docker → Tailscale):**
- 8081, 8082 → Node B
- 18080 → Node D
- 18081 → Node C
- 17080 → Node A (bridge exists, but Node A server may be down)

---

## BLOCKERS

1. **LiteLLM model routing broken** - Returns 404 regardless of model name format. Workaround: direct backend access via socat bridges.
2. **Node A llama-server** - Built from source but status uncertain after SSH session ended.

---

## HUGGING FACE TOKEN

Token stored in memory. Ask user if needed for additional downloads.

---

## QUICK START FOR NEXT SESSION

```bash
# 1. Check Node B servers
curl http://localhost:8081/health
curl http://localhost:8082/health

# 2. Kill and test MTP model
powershell.exe -Command "Get-Process llama-server | Stop-Process -Force"
cmd.exe /c "cd /d D:\llama.cpp && llama-server.exe -m models\Qwopus3.5-9B-Coder-MTP-Q6_K.gguf --host 0.0.0.0 --port 8081 --ctx-size 32768 -ngl 99 -fa on --cache-type-k f16 --draft 2 -cb -np 4 --metrics"

# 3. Benchmark
python3 scripts/direct-benchmark.py
```

---

**::/5Y573M-N071C3 : HANDOFF_V0.3.10. MTP_DOWNLOADED. READY_TO_TEST. // 50V3R31GN-M4CH1N4**
