# Cognitive Hardening & Artery Optimization (Phase 66) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize Node C (Strategic Oracle) and Node A (Synapse) for high-performance, disaggregated inference using threshold routing and sharded Rust crates.

**Architecture:** Node C (Llama-Server) -> Threshold Router -> Node A (Mooncake Master). Migrates `zeroclaw` to the v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS workspace standard.

**Tech Stack:** Rust (Cargo Workspaces), SGLang, Mooncake, `gojq`.

---

### Task 1: Zeroclaw Workspace Migration (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS Standard)

**Files:**
- Create: `zeroclaw/Cargo.toml` (Workspace root)
- Create: `zeroclaw/crates/` (New directory)
- Move: Existing `zeroclaw/src` to `zeroclaw/crates/zeroclaw-kernel/src`

- [ ] **Step 1: Initialize Workspace Root**

```toml
[workspace]
members = [
    "crates/zeroclaw-kernel",
    "crates/zeroclaw-api",
    "crates/zeroclaw-runtime"
]
resolver = "2"
```

- [ ] **Step 2: Decompose Monolith**
  - Extract rule arbitration to `zeroclaw-kernel`.
  - Extract VSB messaging to `zeroclaw-runtime`.

- [ ] **Step 3: Commit**

```bash
git add zeroclaw/
git commit -m "chore(arch): migrate zeroclaw to workspace standard v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS"
```

---

### Task 2: Threshold Routing (PrfaaS Pattern)

**Files:**
- Modify: `zeroclaw/src/bin/artery_manager.rs`
- Modify: `src/db/unified-oracle-client.ts`

- [ ] **Step 1: Implement Length-Based Offloading**
  - Add logic: if `prompt_tokens > 4000`, route to Node A (Mooncake). Else, route to Node C (Local).

```rust
pub fn determine_route(tokens: usize) -> NodeTarget {
    if tokens > 4000 { NodeTarget::NodeA } else { NodeTarget::NodeC }
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(arch): implement length-based threshold routing for Node A offloading"
```

---

### Task 3: Ingest Engine Hardening (gojq Integration)

**Files:**
- Modify: `scripts/forge/ingest-local-assets.ts`
- Modify: `package.json`

- [ ] **Step 1: Wire Built-in jq Engine**
  - Use `crush` built-in `gojq` for all lore shard queries to eliminate external dependencies.

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(ingest): harden lore ingestion via built-in gojq engine"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
