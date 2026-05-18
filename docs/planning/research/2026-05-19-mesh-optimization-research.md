# Mesh Optimization Research — Batching, Schedulers, KV, Parallelism (Updated 2026-05-20)

**Context:** Sovereign Mesh Alpha (stable/mesh-alpha). Node B Vulkan primary, Node D CPU (pending GPU), LiteLLM routing, llama.cpp / ik_llama.cpp backends.

**Strict Constraints Applied:**
- Node B: RX 9060 XT Vulkan + f16 KV only. CPU draft auxiliary (≤6 threads dynamic).
- No VRAM regression.
- No shadow logic or external cloud relays.
- Single deployment strategy (native where possible).

## 1. Continuous / Dynamic Batching (High Priority)

**Current State:** Not enabled on any node.

**Recommended Flags (llama-server):**
- `--cont-batching`
- `--batch-size 512 --ubatch-size 256`
- `--parallel 4` (Node B vision/text mix)

**Expected Impact:** 30-60% throughput increase on mixed workloads (text + vision) with minimal latency penalty until queue depth > 6.

**Recent Findings (last 3 months):**
- Dynamic batching shines when request sizes vary significantly (vision images vs short prompts).
- KV cache fragmentation drops measurably when using `--cont-batching` vs sequential.

## 2. KV Cache Fragmentation

**Current Recommendation:**
- Node B (Vulkan): Keep f16 KV (q4_0 causes 39-88% regression).
- Node D (CPU): q8_0 or q4_0 acceptable.
- Keep `--ctx-size` reasonable (4096-8192 on fast nodes, 16384 on heavy).

**Mitigation:**
- Continuous batching reduces fragmentation vs static.
- Periodic cache reset on idle (every 300s) for long-running servers.

## 3. Request Queueing & Schedulers

**LiteLLM Layer (Current):**
- rpm limits per route (mesh-fast: 25, mesh-heavy: 8)
- Timeout: 120s, stream_timeout: 180s

**llama-server Layer:**
- `--parallel` provides basic concurrency control.
- For future scale: external queue (not needed yet).

## 4. Parallelism Strategies

| Strategy              | Node Applicability      | Recommendation                          | Status     |
|-----------------------|-------------------------|-----------------------------------------|------------|
| Tensor Parallelism    | Single GPU nodes        | Not useful                              | Rejected   |
| Pipeline Parallelism  | Multi-GPU               | Not needed (models fit in single GPU)   | Rejected   |
| Expert Parallelism    | Node D (MoE)            | `-fmoe` flag in ik_llama.cpp            | Pending GPU |
| Speculative Decoding  | Node B (CPU draft)      | 0.6B draft model (dynamic, ≤6 threads)  | GO         |

**Node B CPU Draft (New):** Validated viable. Expected +40-55% gen speed at ≥65% acceptance rate.

## 5. Throughput vs Latency Tradeoffs

- **Vision (Node B):** Direct port routing + low parallel = lowest latency
- **General mesh:** LiteLLM + cont-batching = best balance
- **Heavy reasoning:** Max expert parallelism + MTP (post GPU upgrade)

## 6. Sources & Validation (Last 3 Months Focus)

- Internal Gemini viability report (0.6B CPU draft)
- ik_llama.cpp MoE + MTP improvements (2026-05)
- Community patterns for consumer Blackwell / RDNA3.5 cards
- Previous research: 2026-05-19 mesh-optimization-research.html

**Status:** Research synthesized. Actionable flags ready for testing. Physical benchmarks next.
## 7. High-Throughput Recommendations (May 2026)

**Immediate Wins (low risk):**
- Enable `--cont-batching --parallel 4 --batch-size 512` on Node B vision server
- Add direct routing bypass for vision in LiteLLM config
- Cap CPU draft threads at 6 on Node B for speculative decoding

**Next Phase:**
- Full mesh benchmark harness with acceptance rate logging
- KV cache type testing (q8_0 on CPU nodes only)
- Expert parallelism flags after Node D GPU arrival

**Status:** Continuous execution mode active. All changes respect f16 KV on Vulkan and hardware boundaries.

## 8. Execution Log (Continuous Mode)

- 2026-05-20: Quick mesh health tests passed (all routes < 0.03s)
- 2026-05-20: Throughput harness created and executed
- 2026-05-20: Baseline docs generated
- 2026-05-20: Research document expanded with high-throughput recommendations
- Status: No blockers. All changes respect hardware constraints.


## 9. Orthrus Analysis (New - May 2026)

**Paper:** Orthrus: Memory-Efficient Parallel Token Generation via Dual-View Diffusion (arXiv:2605.12825)

**Core Idea:** Uses dual-view diffusion for parallel token generation with significantly reduced memory footprint compared to traditional speculative decoding.

**Relevance to Sovereign Mesh:**
- High potential for Node B (Vulkan) if implementable in llama.cpp
- Could improve the 0.6B CPU draft approach by enabling more aggressive parallel drafting
- Memory efficiency aligns with our VRAM constraints on RX 9060 XT

**Status:** Under review for integration. Not yet in llama.cpp mainline. Monitor for llama.cpp port or independent implementation.

**Action:** Track upstream progress. Re-evaluate after next llama.cpp release.
