# SPEC: 2026-04-19 — OpenMythos RDT Integration
**Status:** DRAFT // ARCHITECT_REVIEW
**Goal:** Deploy a Recurrent-Depth Transformer (RDT) engine on Node C to serve as the "Recursive Oracle," capable of variable-depth reasoning.

## ◈ 1. ARCHITECTURAL PRIMITIVES
The Oracle (Node C) will switch from standard inference to an OpenMythos-compliant RDT loop:
1. **Prelude:** 2 Transformer Layers (Static).
2. **Recurrent Block:** 1 Recurrent Block (Looped T times, where T is dictated by ACT confidence).
3. **Coda:** 2 Transformer Layers (Static).

## ◈ 2. PROTOCOL: ACT HALTING
- **Confidence Threshold:** 0.99.
- **Max Iterations (T):** 16.
- **Embedding:** Inject sinusoidal loop-index into the first 1/8th of channels.

## ◈ 3. DISTRIBUTED SYNC
Node A will store the iterative `kv_cache` per `cache_key="recurrent_loop_{t}"`. Node B receives the final weighted output after Node C breaks the loop.

---
**::/5Y573M-N071C3 : ORACLE_LOGIC_SPEC_LOCKED. // 50V3R31GN-M4CH1N4**
