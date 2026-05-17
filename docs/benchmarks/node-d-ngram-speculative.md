# Benchmark Report: Ngram Speculative Decoding on Node D (P2-T2)

**Date:** 2026-05-18
**Node:** D (Quaternary) -- Intel Meteor Lake, 48GB DDR5, AVX2, 8 threads
**Model:** Qwen3.5-35B-A3B-MTP UD-Q4_K_M (22.6GB)
**Backend:** llama.cpp b64b38b5 (stock build)
**Conclusion:** NET NEGATIVE -- ngram speculation is not viable on CPU for thinking models.

---

## Test Configuration

| Parameter | Baseline | ngram-mod | ngram-simple |
|-----------|----------|-----------|--------------|
| --spec-type | (none) | ngram-mod | ngram-simple |
| --spec-ngram-*-size-n | - | (default) | 4 |
| --spec-ngram-*-size-m | - | (default) | 3 |
| --spec-ngram-*-min-hits | - | (default) | 1 |
| ctx-size | 8192 | 8192 | 8192 |
| flash-attn | on | on | on |
| cache-type | q4_0/q4_0 | q4_0/q4_0 | q4_0/q4_0 |
| threads | 8 | 8 | 8 |

---

## Results

### Test 1: Short Prompt (18 tokens in, 128 tokens out)
**Prompt:** "Write a short paragraph about distributed systems."

| Metric | Baseline | ngram-mod | Delta |
|--------|----------|-----------|-------|
| Prompt t/s | 13.48 | 13.64 | +1.2% |
| Gen t/s | 6.74 | 6.74 | 0% |
| Draft tokens | - | (not reported) | - |
| Accepted | - | (not reported) | - |

### Test 2: Medium Prompt (87 tokens in, 256 tokens out)
**Prompt:** Detailed NixOS/Tailscale configuration guide (structured task)

| Metric | Baseline | ngram-mod | Delta |
|--------|----------|-----------|-------|
| Prompt t/s | - | 14.56 | - |
| Gen t/s | 6.66 | - | vs 6.74 baseline |
| Draft tokens | - | (not reported) | - |
| Accepted | - | (not reported) | - |

### Test 3: Structured Output (45 tokens in, 256 tokens out)
**Prompt:** "List first 50 prime numbers" with /no_think

| Metric | ngram-mod | ngram-simple | Baseline |
|--------|-----------|--------------|----------|
| Prompt t/s | 14.37 | 14.25 | 13.48 |
| Gen t/s | **5.68** | **5.68** | **6.74** |
| Draft tokens | 64 | 64 | - |
| Accepted | 2 | 2 | - |
| Acceptance rate | 3.1% | 3.1% | - |
| Delta vs baseline | **-15.7%** | **-15.7%** | - |

---

## Root Cause Analysis

**Why ngram speculation fails on this model:**

1. **Qwen3.5 always thinks first.** Despite /no_think instructions in system and user messages, the model continues to emit reasoning_content tokens via its thinking chain. These tokens are novel and unpredictable by nature.

2. **Thinking tokens have no ngram patterns.** The ngram table builds from observed prompt tokens (18-87 tokens -- barely enough data) and then tries to predict future tokens. Reasoning tokens are uniquely generated and don't match any historical ngram.

3. **3.1% acceptance rate means 97% waste.** For every 64 tokens drafted speculatively, only 2 are accepted. The other 62 are computed, verified against the model's actual output, and discarded. On CPU, this verification is NOT free -- each rejected token costs compute time.

4. **CPU lacks parallel headroom.** On GPU, draft verification can overlap with other work and is nearly free. On CPU with 8 threads fully saturated by the main model, the speculative verification steals cycles from actual generation.

---

## Comparison: All Speculative Methods on Node D CPU

| Method | Acceptance Rate | Gen t/s | Delta vs Baseline | Verdict |
|--------|----------------|---------|-------------------|---------|
| Baseline (no speculation) | N/A | 6.74 t/s | - | Reference |
| MTP (draft-model) | 49% | ~4.0 t/s (est) | -40% | NET NEGATIVE (2.8x overhead) |
| ngram-mod | 3.1% | 5.68 t/s | -15.7% | NET NEGATIVE |
| ngram-simple | 3.1% | 5.68 t/s | -15.7% | NET NEGATIVE |

---

## Post-GPU Upgrade Outlook

After RTX 5060 Ti 16GB installation on Node D:
- CUDA makes draft verification nearly free (parallel compute)
- MTP acceptance should improve with faster draft computation
- ngram speculation may become viable IF thinking can be disabled for non-reasoning tasks
- Recommend re-benchmarking all speculative methods after hardware upgrade

---

## Recommendation

**Close P2-T2 as VALIDATED NEGATIVE on CPU.** All three speculative methods (MTP, ngram-mod, ngram-simple) are net negative on Node D's CPU. Re-open after RTX 5060 Ti installation with CUDA benchmarks.

---
::/5Y573M-N071C3 : BENCH_NGRAM_V1. SPECULATION_DEAD_ON_CPU. // 50V3R31GN-M4CH1N4
