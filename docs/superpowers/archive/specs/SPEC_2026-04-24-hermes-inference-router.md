# SPECIFICATION: HERMES INFERENCE ROUTER
**Version:** 3.8.25-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Status:** DRAFT
**Topic:** Intelligent payload routing based on profile and hardware capacity.

---

## 1. OBJECTIVE
To maximize Node B (16GB VRAM) and Node C (6GB VRAM) efficiency by intelligently routing LLM requests based on task complexity and active profiles.

## 2. ARCHITECTURE (RUST SIDECAR)
A lightweight Rust daemon (`hermes-router`) sits between the HUD and the LLM backends.

### 2.1 Routing Logic
- **Light Parsing ($L < 1000$):** Route to Node C (Gemma-4-Q3).
- **Deep Synthesis ($L > 4000$):** Route to Node B (Director Q8).
- **Researcher Mode:** Weights Node B for deep historical RKG retrieval.
- **Daily-Use Mode:** Weights Node C for speed and conciseness.

## 3. MULTI-MODEL FARM (NODE C)
Deploy three separate vLLM instances on Node C:
- `8081`: Q3_K_M (Light parsing).
- `8082`: Q4_K_M (Medium synthesis).
- `8083`: Q5_K_M (Heavy local reasoning).

## 4. SUCCESS CRITERIA
- **Throughput:** 40% increase in concurrent task handling.
- **Latency:** TTFT (Time To First Token) < 200ms for Daily-Use tasks.

---
**::/5Y573M-N071C3 : INFERENCE_ROUTER_SPEC_V1. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
