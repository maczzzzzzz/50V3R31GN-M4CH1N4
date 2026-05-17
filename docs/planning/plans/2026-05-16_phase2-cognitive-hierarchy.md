# Phase 2: Cognitive Hierarchy -- Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Expand Node D's inference capacity with a second CPU model, validate cross-node KV-cache spillover to Node A, and prepare the CUDA build pipeline for a future GPU drop-in (RTX 5060 Ti 16GB via OCuLink -- date TBD).

**Architecture:** Node D currently runs Carnice MoE 35B on CPU (48GB DDR5, 8.8/6.1 t/s). We add a 7B-class interactive model on the same CPU, registering a mesh-interactive route. Node A (16GB RAM, Tailscale) becomes a KV-cache offload target. GPU installation is deferred but the ik_llama.cpp CUDA binary is pre-built and ready.

**Tech Stack:** ik_llama.cpp (AVX2 + CUDA pre-build), Tailscale mesh networking, LiteLLM Docker router, TurboQuant q4_0

---

## Workstream A: Speculative Decoding for 35B MoE (P2-T2) -- EXECUTES NOW

**The 7B model's primary role is draft model for the 35B MoE**, not a standalone
route. The 35B generates at 6.1 t/s on CPU. If a 7B draft model can achieve
high acceptance rates (~60-80%), speculative decoding could push effective
generation speed to 10-15 t/s without any hardware changes.

ik_llama.cpp supports three speculative modes (confirmed in source):
1. **Draft model** (`-md draft.gguf`): External small model predicts tokens,
   target model verifies in batch. Classic speculative decoding.
2. **Self-speculative ngram**: Uses target model's own ngram statistics.
   Zero extra RAM, zero bandwidth cost. Lower acceptance rate but free.
3. **Self-speculative suffix**: Context-aware suffix matching. Also zero cost.

**Strategy:** Try self-speculative first (free, no download). If acceptance rate
is poor, add 7B draft model. If acceptance rate is good enough, we're done
without needing a second model at all.

### A1: Benchmark 35B MoE baseline (no speculation)

**Objective:** Establish clean baseline before speculative experiments.

**Files:** None (benchmark only)

**Step 1: Check if 35B MoE llama-server is running on Node D**

```bash
ssh maczz@100.120.225.12 "ps aux | grep llama-server | grep -v grep"
```

If not running, start it:
```bash
ssh maczz@100.120.225.12 "nohup ~/ik_llama.cpp/build/bin/llama-server \
  -m /path/to/carnice-moe-35b.gguf \
  --host 0.0.0.0 --port 8081 \
  -ngl 0 --cache-type-k q4_0 -t 8 \
  > ~/llama-server-35b.log 2>&1 &"
```

**Step 2: Run baseline benchmark**

```bash
ssh maczz@100.120.225.12 'curl -s http://localhost:8081/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"unused\",\"messages\":[{\"role\":\"user\",\"content\":\"Write a detailed analysis of speculative decoding in LLMs.\"}],\"max_tokens\":200}" \
  | python3 -c "import json,sys; r=json.load(sys.stdin); u=r[\"usage\"]; print(f\"prompt_eval_count={u[\"prompt_eval_count\"]} eval_count={u[\"completion_tokens_details\"][\"accepted_prediction_tokens\"] if \"accepted_prediction_tokens\" in u.get(\"completion_tokens_details\",{}) else u.get(\"completion_tokens\",0)}\")"'
```

Record: prompt tokens, gen tokens, wall clock time, tokens/second.

**Verification:** Baseline generation speed recorded (expect ~6.1 t/s).

---

### A2: Test self-speculative decoding (ngram mode)

**Objective:** Try zero-cost speculative decoding first. If acceptance rate is
decent, we skip the 7B draft model entirely.

**Files:** None (restart llama-server with different flags)

**Step 1: Stop current 35B server and restart with ngram speculation**

```bash
ssh maczz@100.120.225.12 "kill <pid> && sleep 2"
ssh maczz@100.120.225.12 "nohup ~/ik_llama.cpp/build/bin/llama-server \
  -m /path/to/carnice-moe-35b.gguf \
  --host 0.0.0.0 --port 8081 \
  -ngl 0 --cache-type-k q4_0 -t 8 \
  --spec-stage ngram --draft 5 \
  > ~/llama-server-35b-ngram.log 2>&1 &"
```

Note: `--spec-stage ngram` enables ngram self-speculation. `--draft 5` means
draft up to 5 tokens per step. Adjust if CLI flags differ (check `--help`).

**Step 2: Benchmark with same prompt as A1**

Run the exact same benchmark command as A1 Step 2.

**Step 3: Check speculative stats in server log**

```bash
ssh maczz@100.120.225.12 "tail -30 ~/llama-server-35b-ngram.log | grep -i 'spec\|draft\|accept'"
```

Look for acceptance rate. Target: >50% accepted means meaningful speedup.

**Decision gate:**
- Acceptance rate >60%: SELF-SPEC IS SUFFICIENT. Skip A3-A4. Jump to A5.
- Acceptance rate 30-60%: TRY 7B DRAFT MODEL. Proceed to A3.
- Acceptance rate <30%: Speculative decoding not viable on this workload.
  Report findings and skip to A5 (mark P2-T2 as "attempted, minimal gain").

**Verification:** Acceptance rate and effective t/s recorded.

---

### A3: Download 7B-class draft model (conditional on A2)

**Objective:** Get a small model for external draft speculation. Only executes
if self-speculative acceptance rate was below 60%.

**Files:** None on this repo (model download on Node D)

**Step 1: Select draft model**

Draft model requirements:
- Same tokenizer as target (Carnice MoE 35B uses Qwen tokenizer)
- Small enough to not tank memory bandwidth (~4-5GB at Q4_K_M)
- Fast enough to generate draft tokens quickly

Best candidates:
- **Qwen3-4B Q4_K_M**: Same tokenizer family, very fast, small footprint
- **Qwen3-8B Q4_K_M**: Better prediction quality, but larger
- **Qwen3.6-MoE-35B companion**: If a mini variant exists

**Recommendation:** Qwen3-4B or Qwen3-8B (smallest that shares Qwen tokenizer).

**Step 2: Download on Node D**

```bash
ssh maczz@100.120.225.12 "mkdir -p ~/models && cd ~/models && wget <model_url>"
```

**Step 3: Verify file**

```bash
ssh maczz@100.120.225.12 "ls -lh ~/models/<draft-model>.gguf"
```

**Verification:** Draft model file exists on Node D.

---

### A4: Deploy draft-model speculative decoding (conditional on A3)

**Objective:** Run 35B MoE with 7B draft model for speculative decoding.

**Files:** None (restart llama-server on Node D)

**Step 1: Restart 35B server with draft model**

```bash
ssh maczz@100.120.225.12 "kill <pid> && sleep 2"
ssh maczz@100.120.225.12 "nohup ~/ik_llama.cpp/build/bin/llama-server \
  -m /path/to/carnice-moe-35b.gguf \
  -md /home/maczz/models/<draft-model>.gguf \
  --host 0.0.0.0 --port 8081 \
  -ngl 0 --cache-type-k q4_0 -t 6 \
  --draft 5 \
  > ~/llama-server-35b-draft.log 2>&1 &"
```

Key flags:
- `-md`: Draft model path (ik_llama.cpp confirmed supports this)
- `--draft 5`: Draft up to 5 tokens per step
- `-t 6`: Slightly fewer threads for target, draft model gets its own threads
  automatically

**Step 2: Check memory usage**

```bash
ssh maczz@100.120.225.12 "free -h"
```

Verify no OOM. Expected usage:
- 35B MoE: ~20GB
- Draft model: ~4-5GB
- KV cache + OS: ~8-10GB
- Total: ~32-35GB (well within 48GB)

**Step 3: Benchmark with same prompt**

Run the exact same benchmark as A1 Step 2.

**Step 4: Compare results**

| Metric | Baseline (A1) | Self-spec (A2) | Draft-spec (A4) |
|:-------|:-------------|:----------------|:----------------|
| Gen t/s | 6.1 | XX | XX |
| Acceptance rate | N/A | XX% | XX% |
| Effective t/s | 6.1 | XX | XX |

The winner is whichever gives the best effective t/s.

**Verification:** Draft-spec benchmark recorded. Clear comparison table.

---

### A5: Update documentation for speculative decoding results

**Objective:** Record what worked, what didn't, and the final configuration.

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`
- Modify: `AGENTS.md` (Node D -- note speculative mode if active)
- Modify: `CHANGELOG.md`

**Step 1: Update IMPLEMENTATION_PLAN.md**

Mark P2-T2 with actual result. Examples:

If self-spec worked:
```
- [x] **P2-T2: Speculative Decoding.** Self-speculative ngram mode enabled on Node D 35B MoE. Acceptance rate XX%. Effective speed: XX t/s (up from 6.1 t/s baseline). No draft model needed.
```

If draft model worked:
```
- [x] **P2-T2: Speculative Decoding.** Qwen3-XB draft model deployed. Acceptance rate XX%. Effective speed: XX t/s (up from 6.1 t/s baseline). Both models on CPU.
```

If nothing worked:
```
- [~] **P2-T2: Speculative Decoding.** Tested ngram self-spec (acceptance XX%) and Qwen3-XB draft (acceptance XX%). Neither achieved >30% acceptance. DDR5 bandwidth saturation is the bottleneck. 35B MoE stays at 6.1 t/s. GPU upgrade is the real fix.
```

**Step 2: Update AGENTS.md**

If speculative decoding is active, add the mode to Node D's config.

**Step 3: Add CHANGELOG entry**

**Verification:** Docs match whatever the actual outcome was. No fake numbers.

---

## Workstream B: Context Spillover (P2-T3) -- EXECUTES NOW

### B1: Research ik_llama.cpp RPC offload support

**Objective:** Determine if ik_llama.cpp or upstream llama.cpp supports network KV-cache offload (RPC mode).

**Files:** None (research only)

**Step 1: Check ik_llama.cpp for RPC support**

```bash
ssh maczz@100.120.225.12 "ls ~/ik_llama.cpp/build/bin/ | grep -i rpc"
ssh maczz@100.120.225.12 "~/ik_llama.cpp/build/bin/llama-server --help 2>&1 | grep -i rpc"
```

**Step 2: Check upstream llama.cpp for RPC support**

```bash
ssh maczz@100.120.225.12 "ls ~/llama.cpp/build/bin/ 2>/dev/null | grep -i rpc"
ssh maczz@100.120.225.12 "grep -r 'rpc' ~/llama.cpp/common/ 2>/dev/null | head -10"
```

**Step 3: Evaluate alternatives if RPC is not available**

Alternatives to network KV offload:
1. **Quantized KV to reduce memory pressure** (already doing q4_0 -- could go to q2 or q8_0)
2. **Sliding window attention** (trades context length for memory)
3. **llama.cpp `--rpc` flag** (upstream may have it even if ik fork doesn't)
4. **Custom TCP KV relay** (build our own -- deferred to Phase 3+)

**Decision gate:**
- If RPC supported: proceed to B2
- If not supported: document finding, mark P2-T3 as DEFERRED with clear rationale

**Verification:** Clear go/no-go decision documented.

---

### B2: Configure Node A as KV-cache offload target

**Objective:** If RPC is supported, set up Node A (Synapse, 16GB RAM) as a KV offload endpoint.

**Files:**
- Create: startup script on Node A
- Modify: Node D llama-server launch flags (add --rpc)

**Pre-requisites:**
- Node A accessible via Tailscale (100.96.253.114) -- VERIFIED
- RPC binary deployed on Node A
- SSH to Node A working -- VERIFIED

**Step 1: Deploy RPC server on Node A**

Exact command depends on B1 research results. Template:

```bash
ssh maczz@100.96.253.114 "nohup /path/to/rpc-server-binary \
  --host 0.0.0.0 --port 50052 \
  --mem 12GB \
  > ~/rpc-server.log 2>&1 &"
```

Note: Leave 4GB for OS on Node A. Only allocate 12GB to KV cache.

**Step 2: Add RPC flag to Node D 35B model launch**

Modify the llama-server startup for the 35B MoE to include:

```bash
--rpc 100.96.253.114:50052
```

This requires restarting the 35B llama-server on Node D.

**Step 3: Benchmark context extension**

Test with progressively longer contexts:
- 1K tokens (baseline)
- 4K tokens
- 8K tokens
- 16K tokens (if supported)

Record throughput at each level. Compare with/without RPC.

**Verification:** Node D handles context lengths beyond its local RAM limit by spilling KV to Node A.

---

### B3: Document spillover results or deferral

**Objective:** Record spillover status accurately.

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`
- Modify: `AGENTS.md` (update Node A role if spillover works)
- Modify: `CHANGELOG.md`

If spillover works:
```
- [x] **P2-T3: Context Spillover.** Node A configured as KV-cache offload via RPC over Tailscale. Node D 35B context extended from X to Y tokens. Throughput at max context: XX t/s.
```

If deferred:
```
- [~] **P2-T3: Context Spillover.** DEFERRED. ik_llama.cpp does not support RPC offload. Requires upstream llama.cpp migration or custom relay. Moved to Phase 3 backlog. Node A role unchanged (state persistence only).
```

**Verification:** Docs match reality.

---

## Workstream C: GPU Pre-Build (P2-T1 preparation) -- DEFERRED, EXECUTES ON HARDWARE ARRIVAL

This workstream is blocked on hardware. All steps are documented here so execution
is immediate when the RTX 5060 Ti arrives.

### C1: Verify GPU hardware and driver on Node D [BLOCKED ON HARDWARE]

**Prerequisites:** RTX 5060 Ti 16GB physically installed via OCuLink dock. NVIDIA driver loaded.

```bash
ssh maczz@100.120.225.12 "nvidia-smi"
```

Expected: RTX 5060 Ti, 16GB VRAM, driver version, CUDA compute capability.

### C2: Build ik_llama.cpp with CUDA on Node D [BLOCKED ON C1]

```bash
ssh maczz@100.120.225.12 "cd ~/ik_llama.cpp && mkdir -p build-cuda && cd build-cuda && cmake .. -DGGML_CUDA=ON -DCMAKE_BUILD_TYPE=Release && cmake --build . --config Release -j$(nproc)"
```

Note: RTX 5060 Ti (Blackwell arch) compute capability is likely sm_120. If auto-detect
fails, add `-DGGML_CUDA_ARCH=120`.

### C3: Migrate 35B MoE from CPU to GPU [BLOCKED ON C2]

```bash
ssh maczz@100.120.225.12 "kill <pid-of-35b-cpu-server>"
ssh maczz@100.120.225.12 "nohup ~/ik_llama.cpp/build-cuda/bin/llama-server \
  -m /path/to/carnice-moe-35b.gguf \
  --host 0.0.0.0 --port 8081 \
  -ngl 99 --cache-type-k q4_0 -t 4 \
  > ~/llama-server-gpu.log 2>&1 &"
```

Target: 3x+ uplift over CPU baseline (8.8/6.1 t/s).

### C4: Update all documentation [BLOCKED ON C3]

Standard doc update pattern: IMPLEMENTATION_PLAN.md, AGENTS.md, CHANGELOG.md.

---

## Cross-Stream Dependencies

```
A1 (RAM check) -> A2 (download 7B) -> A3 (deploy) -> A4 (docs)
                                          |
B1 (research RPC) -> B2 (configure) -> B3 (docs)
       |
       v
  B1 is independent of A (can run in parallel)

C1 (hardware) -> C2 (CUDA build) -> C3 (migrate) -> C4 (docs)
  ^
  BLOCKED until user installs RTX 5060 Ti
```

- A and B are independent of each other
- C is fully blocked on hardware arrival
- When C unblocks, it replaces the CPU 35B deployment but does NOT affect the 7B model

---

## Hardware Constraints (Do Not Violate)

| Node | RAM | VRAM | Constraint |
|:-----|:----|:-----|:-----------|
| Node D | 48GB DDR5 | NONE (yet) | 35B MoE Q4_K_M (~20GB) + 7B Q4_K_M (~5GB) + OS (~4GB) = ~29GB used. ~19GB headroom for KV cache. |
| Node A | 16GB RAM | 4GB (GTX 1050 Ti, unused) | KV-cache offload ONLY. NO model inference. ~12GB allocatable for KV cache at q4_0. |
| Node B | 48GB DDR4 | 16GB RX 9060 XT | Already ~10.4GB VRAM used. Do NOT add models. |
| Node C | 32GB DDR4 | 6GB RTX 2060 | Already running Carnice 9B FC. Do NOT add models. |

**Post-GPU-upgrade constraints (for when C workstream unblocks):**

| Node | RAM | VRAM | Constraint |
|:-----|:----|:-----|:-----------|
| Node D | 48GB DDR5 | 16GB (RTX 5060 Ti) | 35B MoE Q4_K_M (~9GB on GPU). 7B stays on CPU. ~7GB VRAM headroom for KV cache. |

---

## Model Strategy (Updated)

| Route | Model | Node | Backend | Benchmark | Use Case |
|:------|:------|:-----|:--------|:----------|:---------|
| mesh-fast | Hermes-4-14B Q4_K_M | B (Vulkan) | GPU | 93.2/33.7 t/s | Code gen, fast chat |
| mesh-vision | Qwen3-VL-2B Q6_K | B (Vulkan) | GPU | 550/50.7 t/s + image | Visual QA, triage |
| mesh-function-calling | Carnice-9B-FC Q4_K_M | C (CUDA) | GPU | 205.2/49.9 t/s | Tool use, FC |
| mesh-heavy | Carnice MoE 35B Q4_K_M | D (CPU) | AVX2 | 8.8/6.1 t/s | Complex reasoning |
| mesh-interactive | <7B model> Q4_K_M | D (CPU) | AVX2 | TBD t/s | Interactive chat, quick QA |

**After GPU upgrade (future):** mesh-heavy moves to D (CUDA). Speed triples+.

---

## Phase 2 Completion Criteria

Phase 2 is COMPLETE when:

1. [x] Node D runs a 7B-class model on CPU alongside the 35B MoE
2. [x] mesh-interactive route registered in LiteLLM and verified
3. [x] Context spillover either working OR documented as deferred with clear rationale
4. [x] All documentation updated to match physical reality
5. [x] No OOM events during testing
6. [x] TurboQuant q4_0 active on all new inference endpoints

**GPU upgrade (P2-T1) is explicitly OUT OF SCOPE for this execution cycle.** It will be a separate task triggered by hardware arrival. The C workstream contains complete instructions for immediate execution at that time.

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|:-----|:-----------|:-------|:-----------|
| Node D OOM with dual CPU models | Low | Service crash | Monitor with `free -h` during A3. If <5GB free, reduce 7B thread count or use q2_K quant |
| 7B model too slow on CPU to be useful | Medium | Wasted compute | Benchmark at A3 step 3. If <10 t/s gen, reconsider model size or quant |
| ik_llama.cpp lacks RPC offload | Medium | P2-T3 deferred | Document and move to Phase 3. Node A role stays unchanged |
| Node A Tailscale drops during spillover | Medium | Context loss | Test with `ping -f` first. Tailscale is WireGuard -- should be stable |
| OCuLink not recognized by Node D BIOS | Medium | GPU upgrade blocked | Verify BIOS support before hardware purchase. This is pre-install homework |

---

::/5Y573M-N071C3 : PHASE2_PLAN. COGNITIVE_HIERARCHY. CPU_FIRST_GPU_LATER. // 50V3R31GN-M4CH1N4
