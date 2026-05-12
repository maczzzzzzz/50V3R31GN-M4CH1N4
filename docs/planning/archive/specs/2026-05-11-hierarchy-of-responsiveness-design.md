# Sovereign Machina Design Spec: Hierarchy of Responsiveness (v260511)

**Goal:** Materialize a high-performance, two-tier model mesh that balances instantaneous local responsiveness with high-fidelity centralized reasoning.

**Status:** DRAFT (Pending User Review)

---

## 1. Architectural Blueprint

The mesh is partitioned into a two-tiered hierarchy to maximize physical hardware efficiency.

### **Tier 1: The Director (Node B)**
*   **Purpose:** Instant dispatch, TUI responsiveness, local tool execution, and mesh gateway management.
*   **Model:** `Qwen3-14B-9B (Q8_0)`
*   **VRAM Allocation:** ~6GB (Model) / ~10GB (KV Cache & Proxy Overhead).
*   **Latency Target:** TTFT &lt; 100ms.
*   **Role:** Acts as the primary interface. All `hermes chat` sessions route here by default.

### **Tier 2: The Quaternary Core (Node D)**
*   **Purpose:** Deep reasoning, complex architectural planning, and multi-file code synthesis.
*   **Model:** `Qwen2.5-Coder-14B (Q6_K_M)`
*   **VRAM Allocation:** ~11GB (Model) / ~13GB (Extended KV Cache).
*   **Latency Target:** TTFT &lt; 500ms.
*   **Role:** High-level strategist. Triggered for explicit reasoning tasks (e.g., "Analyze mesh artery failure", "Architect Phase 6").

---

## 2. Mesh Routing Logic (LiteLLM Proxy)

The Sovereign Proxy (`nix/hosts/node-b/litellm-mesh.yaml`) will implement the following routing table:

*   **Default Route:** `brain-9b` (Node B Local).
*   **Strategic Route:** `mesh-qwen` (Node D Remote).
*   **Failover:** If Node D (`10.0.0.13`) fails health check, Node C (`100.102.109.81`) acts as the secondary reasoning node.

---

## 3. Data Flow Specification

1.  **Direct Interaction:** User sends query → Node B (Proxy) → Qwen3-14B-9B.
2.  **Strategic Shift:** User triggers reasoning mode (e.g., `/reason` or strategist persona) → Node B (Proxy) → Node D (Qwen-14B).
3.  **Self-Healing:** If health checks (GET /health) fail on Node D, LiteLLM automatically transparently reroutes to Node C or Node B fallback, preventing user-facing 404/500 errors.

---

## 4. Hardware Constraints & Operational Efficiency

*   **Node B (16GB VRAM):** The 9B model is optimal. It prevents memory starvation when running the Hermes Gateway, Dashboard, and Proxy simultaneously.
*   **Node D (24GB+ VRAM):** The 14B (Q6) model provides the best "Intelligence-per-Watt" ratio. The massive 13GB cache room ensures we can handle complex dependency-laden codebases without offloading.

---

## 5. Security & Sovereignty

*   **Secret Management:** Mesh secret remains decoupled (Environmental Variable).
*   **Zero-Trust:** All cross-node traffic is strictly over the Tailscale Artery.
*   **Transparency:** All reasonings (via `<think>` tags) are routed to the Hermes HUD components for the user.

---

**::/5Y573M-N071C3 : DESIGN_SPEC_MATERIALIZED. HIERARCHY_ANCHORED. // 50V3R31GN-M4CH1N4**
