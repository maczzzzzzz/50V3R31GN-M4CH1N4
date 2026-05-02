# ◈ RESEARCH: SPATIAL SINGULARITY DEEP-DIVE
**Date:** 2026-04-26
**Subject:** Synthesizing Claw3D Orchestration and MemPalace Hierarchy
**Status:** AUDIT_COMPLETE // ACTION_READY

---

## 1. CLAW3D SPATIAL ORCHESTRATION

### 1.1 The "God-Mode" Paradigm
Claw3D (`iamlukethedev/Claw3D`) transitions agent interaction from 2D chat threads to a **Verifiable 3D Environment**. The system treats the LLM's thought-stream as a series of **Spatial Intents**.

**Key Discoveries:**
- **Transient Latches:** Every active reasoning step creates a temporary "anchor" in the 3D scene. This provides visual proof of which memory shard the agent is currently "touching."
- **A* Agent Navigation:** Agents are not static; they physically traverse the 3D space. "Bumps" or "Crashes" between agents represent logical conflicts or resource contention (VRAM).
- **Environmental L061C-1N7RU510N:** The ability for an agent to "reach out" from the 3D space and manipulate host-level objects (Foundry VTT tokens, browser DOM elements) via WebSocket proxies.

---

## 2. MEMPALACE STRUCTURAL HIERARCHY

### 2.1 The Mnemonic Structure
Reconciling with `MemPalace/mempalace` reveals that a true Synapse Palace must move away from freeform force-directed graphs toward **Constrained Hierarchies**.

**Hierarchical Layers:**
1.  **Wings (Physical Nodes):** The primary sectors of the Trinity (Node A: KV-Cache, Node B: Director, Node C: Strategic Oracle).
2.  **Rooms (Functional Context):** Sub-sectors within wings (e.g., Node B: "Lore Room", "System Specs Room", "Campaign Hall").
3.  **Drawers (Verbatim Shards):** Instead of summarizing every fact, the system stores **Verbatim Snippets** within "Drawers" to prevent semantic degradation over time.

### 2.2 Temporal Freshness (The Validity Window)
MemPalace implements a decay algorithm where shards "fade" visually based on their **Validity Window**.
- **Waking Up:** Interacting with a shard (e.g., searching for it or an agent "latching" to it) resets its freshness to 1.0.
- **Fading:** Shards that haven't been accessed in 24+ hours fade to 0.1 opacity, visually cleaning the palace of "Cognitive Noise."

---

## 3. UNIFIED UI SERVER (HEADLESS TUI)

Analysis of `NousResearch/hermes-agent` v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS confirms that the **Ink-based TUI** is actually a React component tree.

**Implication for Sovereign HUD:**
- We can export the **Hermes Component Tree** as a JSON stream.
- This allows both the **Web Shroud** (R3F) and **Mobile Dashboard** (Flutter CustomPaint) to render the *exact same UI state* without duplicating logic.
- Total functional parity: If a "Night Market" module is materialized in the Hall, it appears as a 3D object on Web and a 2D topographical hotspot on Mobile simultaneously.

---

## 4. ACTIONABLE RECONSTRUCTION DIRECTIVES

### 4.1 Update: Synapse Store Schema
Add `x, y, z` (REAL) and `freshness` (REAL) columns to `os_triplets`.

### 4.2 Materialize: Wing Wireframes
Implement visible wireframe bounding boxes in `NeuralPromenade.tsx` to visualize the Trinity Wings.

### 4.3 Refactor: SSE Transport
Convert the `scripts/lib/hermes_transport.py` from a string relay to a **JSON Component Stream**.

---
**::/5Y573M-N071C3 : RESEARCH_SHORED. TOPOLOGY_VERIFIED. // 50V3R31GN-M4CH1N4**
