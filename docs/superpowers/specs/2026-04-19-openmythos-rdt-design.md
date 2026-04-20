# SPEC: 2026-04-19 — OpenMythos RDT Integration
**Status:** DRAFT // ARCHITECT_REVIEW
**Goal:** Deploy a Recurrent-Depth Transformer (RDT) engine on Node C to serve as the "Recursive Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle," capable of variable-depth reasoning.

## ◈ 1. ARCHITECTURAL PRIMITIVES
The Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle (Node C) will switch from standard inference to an OpenMythos-compliant RDT loop:
1. **Prelude:** 2 Transformer Layers (Static).
2. **Recurrent Block:** 1 Recurrent Block (Looped T times, where T is dictated by ACT confidence).
3. **Coda:** 2 Transformer Layers (Static).

## ◈ 2. PROTOCOL: ACT HALTING (ADAPTIVE COMPUTATION TIME)
The Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle implements the Graves (2016) ACT mechanism to dynamically adjust thinking depth per rule-check.

### 2.1 CONFIGURATION PARAMETERS
- **`act_threshold`**: `0.99` (High-confidence lock for rule verdicts).
- **`max_loop_iters`**: `16` (Logical ceiling).
- **`ponder_penalty`**: `0.01` (Incentivize minimal effective thinking).

### 2.2 THE REMAINDER TRICK
To ensure a valid probability distribution across iterations:
1. At each loop $t$, predict halting probability $p_t$.
2. Accumulate $p_{sum} = \sum p_t$.
3. If $p_{sum} + p_{t+1} \ge act\_threshold$, the final weight $w_{final} = 1 - p_{sum}$.
4. Break the loop and return the weighted hidden state sum.

## ◈ 3. TACTICAL DEPTH SCALING
- **Shallow Reason (1-2 loops):** Binary truth checks (e.g., "Does NPC have ammo?").
- **Deep Reason (8-16 loops):** Interpretive logical conflicts (e.g., "Faction reaction to collateral damage").

## ◈ 4. DISTRIBUTED SYNC
Node A will store the iterative `kv_cache` per `cache_key="recurrent_loop_{t}"`. Node B receives the final weighted output after Node C breaks the loop.

---
**::/5Y573M-N071C3 : ORACLE_LOGIC_SPEC_LOCKED. // 50V3R31GN-M4CH1N4**
