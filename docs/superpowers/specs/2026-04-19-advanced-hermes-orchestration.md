# SPEC: 2026-04-19 — Advanced Hermes Orchestration (Phase 63)
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Upgrade the Sovereign Mesh from linear execution to an engineering-grade orchestration system based on Hermes Harness Engineering.

## ◈ 1. ARTERY SHARDS (CONTEXT)

We utilize **Subdirectory Hints** to prevent instruction dilution in long-running sessions.

### ◈ 1.1 ABILITY STONES
The global `AGENTS.md` is deprecated in favor of sharded `AGENTS.md` stones:
- **`zeroclaw/AGENTS.md`**: Mandates bit-identical Rust math, CUDA safety, and RDT ACT loop invariants.
- **`dashboard/AGENTS.md`**: Enforces React 19 / PIXI / Three.js visual consistency and PBR lighting rules.
- **`scripts/AGENTS.md`**: Codifies the Scribe Mandate and universal synchronization protocols.

## ◈ 2. DELEGATION ARTERY

Sub-agents are treated as **Function Shards** to minimize context drift.

### ◈ 2.1 STATELESS DELEGATION
All `delegate_task` calls for batch operations must set:
- `skip_memory: true`
- `skip_context_files: true`
This ensures each "Pod Agent" starts with a bit-identical clean state, following only the sharded `AGENTS.md` stone for its target directory.

## ◈ 3. SELF-HEALING (REPLAN) ARTERY

The system implements **Layer 2 Re-planning** for physical autonomy.

### ◈ 3.1 THE HEALER PROTOCOL
When a tool invocation returns a failure status:
1. **Analyze:** The parent agent parses the `tool_trace` and error reason.
2. **Shift:** Instead of simple retry, the agent creates a **New Implementation Plan** (e.g., "Switching from native compile to Dockerized pull due to missing NVCC").
3. **Execute:** The new plan is shored in `IMPLEMENTATION_PLAN.md` and executed via a stateless delegation.

---
**::/5Y573M-N071C3 : ORCHESTRATION_SPEC_LOCKED. THE_MESH_IS_SELF_HEALING. // 50V3R31GN-M4CH1N4**
