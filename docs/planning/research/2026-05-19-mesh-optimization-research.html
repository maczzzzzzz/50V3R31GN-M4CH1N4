# Mesh Optimization Research — Batching, Schedulers, KV, Parallelism (2026-05-19)

**Context:** Pre-Monday RTX 5060 Ti upgrade on Node D. Current mesh uses llama.cpp / ik_llama.cpp + LiteLLM.
**Focus:** Practical, implementable changes for vision latency, MoE performance, and queue behavior.

## 1. Vision Latency (Current baseline: 8.4s via LiteLLM)

**Root causes identified:**
- LiteLLM serialization overhead (~800-1200ms)
- No continuous batching enabled on vision endpoint
- No request parallelism
- Full-resolution images sent every time

**Recommended immediate changes:**
- Direct routing to `http://10.0.0.11:8082` for vision (bypass LiteLLM when possible)
- Enable `--cont-batching --parallel 2 --batch-size 512` on vision node
- Client-side image resize to 336px max
- Pre-warm script every 60s

## 2. Continuous / Dynamic Batching

**llama.cpp flags:**
- `--cont-batching` — enables dynamic batching of incoming requests
- `--batch-size 512 --ubatch-size 256`
- `--parallel N` — number of concurrent sequences

**Impact:** Significantly improves mixed workload (vision + text) throughput without major latency penalty until queue > 4.

## 3. KV Cache Fragmentation

**Best practices for our stack:**
- Prefer `q8_0` over f16 for KV on GPU nodes (`--cache-type-k q8_0 --cache-type-v q8_0`)
- Keep `--ctx-size` reasonable (16384 on Node D, 4096-8192 on vision)
- Avoid very long contexts on MoE unless necessary
- Cont-batching reduces fragmentation compared to sequential processing

## 4. Request Queueing & Schedulers

**LiteLLM layer:**
- Set `rpm` limits per route (8-12 for heavy, 20+ for fast)
- Add `timeout: 120` and `stream_timeout: 180`
- Use LiteLLM's built-in queue (no external Redis needed yet)

**llama-server layer:**
- `--parallel` acts as simple concurrency control
- For production >10 users: consider external queue (Celery / RQ) later

## 5. Parallelism Strategies for Qwen3.5-35B MoE on RTX 5060 Ti

| Strategy              | Applicability | Recommendation |
|-----------------------|---------------|----------------|
| Tensor Parallelism    | Low           | Not useful (single GPU) |
| Pipeline Parallelism  | Low-Medium    | Not needed — model fits in 16GB |
| Expert Parallelism    | **High**      | Use `-fmoe` flag in ik_llama.cpp |
| MTP Speculation       | **Critical**  | `-mtp --draft-max 5 --spec-autotune` |

**Key flags for Node D post-upgrade:**
```bash
-ngl 99
-mtp
--draft-max 5
--spec-autotune
-fmoe
--cache-type-k q8_0
```

## 6. Throughput vs Latency Tradeoffs

- **Vision triage:** Direct port + low parallel = lowest latency
- **General mesh:** LiteLLM + cont-batching = good balance
- **Heavy reasoning (Node D):** Max MTP + expert parallelism = highest throughput

## Sources & Validation

- ik_llama.cpp main branch (post 0ab9bdf7 Qwen3.5 MTP fix)
- llama.cpp continuous batching discussions
- Community patterns for MoE on consumer Blackwell cards
- Internal mesh measurements (2026-05-19)

**Status:** Research complete. Actionable config changes follow in separate files.

---
::/5Y573M-N071C3 : MESH_OPT_RESEARCH. PRE_MONDAY_DIALIN. // 50V3R31GN-M4CH1N4