# Specification: Phase 24 — Sovereign Utility Belt (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Status:** DRAFT
**Date:** 2026-04-04

## 1. Executive Summary
Phase 24 transforms the Agent from a "Narrator" into a "Physical Actor" by deploying the **Utility Belt**—a suite of high-performance Rust/Egui sidecar HUDs. It establishes the **Crush Registry** for process management and the **Physical ACK (Flush Gate)** for human-in-the-loop authorization of critical systemic changes.

## 2. Components

### 2.1 The Crush Sidecar Registry (`crush belt`)
The Crush CLI (Go) acts as the supervisor for all sidecar binaries.
- **Lifecycle Management**: Spawn, monitor, and kill sidecar processes.
- **Hierarchical Loading**: Supports "Heavy Weight" sidecars (e.g., `air-reasoner-70b`) that use layer-swapping logic on Node B.
- **Node B Integration**: Listens for `launch_hud` or `consult_reasoner` commands from the Director.

### 2.2 The Three-Tier Intelligence Model
- **Tier 1 (Reflex - Node A):** Resident 1B Llama/Falcon. 0ms latency for physical VSB validation.
- **Tier 2 (Narrative - Node B):** Resident 12B Mistral-Nemo. Primary scene flow and dialogue.
- **Tier 3 (Strategic - Node B Air-Sidecar):** Layer-swapped 70B+ Reasoner (AirLLM/Prima.cpp). High-fidelity "Deep Thinking" for world-state pivots and complex tactical moves.

### 2.3 The Physical ACK (The Flush Gate)
A mandatory authorization loop for actions with "systemic weight".
- **Intent Transparency**: The Authorization Pane in Crush now streams the `<thought>` tokens from the Tier 3 Reasoner in real-time, allowing the operator to see the AI's "Deep Logic" before signing a transaction.

### 2.3 HUD Deployment (Rust/Egui)
Target HUDs for this phase:
1. **Atlas Radar (v2.0)**: Spatial visualization of `GhostBlips` (Phase 23) and Tactical Heatmaps.
2. **Netrunning Isometric HUD**: 3D-simulated view of local subnets and ICE nodes.
3. **Cyberdeck Sidecar**: Slim, vertical quick-hack menu for rapid interaction.

## 3. VSB Schema Extension: `ProposedActions`
```rust
#[repr(C)]
struct ProposalPacket {
    id: u32,             // Unique transaction ID
    origin: u8,          // Source ID (0: Node B, 1: Atlas, 2: Netrun)
    action_type: u8,     // 0: PURCHASE, 1: DAMAGE, 2: PHASE_SHIFT
    status: u8,          // 0: PENDING, 1: APPROVED, 2: REJECTED
    payload: [u8; 256],  // JSON or binary payload describing the action
}
```

## 4. Acceptance Criteria
- [ ] `crush belt list` correctly identifies available sidecar binaries.
- [ ] Launching a HUD from Node B (via CDP/Command) successfully spawns the process in Crush.
- [ ] A `PENDING` action in VSB successfully triggers the Authorization Pane in Crush.
- [ ] Pressing `ENTER` in Crush successfully triggers the corresponding action in Foundry VTT via Node B.

## 5. Metadata
- **Co-Authored-By:** Claude Sonnet <noreply@anthropic.com>
- **Co-Authored-By:** Gemini CLI <gemini-cli@google.com>


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
