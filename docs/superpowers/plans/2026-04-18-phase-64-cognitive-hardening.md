# Phase 64: Cognitive Hardening & Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maximize inference throughput on existing hardware, implement pre-emptive lore caching based on player movement, and upgrade the Ouroboros audit loop to include semantic logic verification.

**Architecture:** Node B VRAM optimization via K-Quants, high-frequency telemetry hooks for anticipatory caching, and Node A Rust kernel logic expansion for intentional auditing.

**Tech Stack:** TypeScript, Rust, llama-server, VSB Protocol, FNV-1a.

---

### Task 1: KV-Cache Quantization (Node B)

**Files:**
- Modify: `scripts/dev/ignite-director.sh` (or respective boot script)

- [ ] **Step 1: Configure KV-Cache K-Quants**
Update the `llama-server` ignition flags for Node B to include `--cache-type-k q4_0` and `--cache-type-v q4_0` (or q8_0 based on fidelity tests).

- [ ] **Step 2: Benchmark VRAM Savings**
Monitor `nvidia-smi` (local) during a high-context lore dump. Ensure no performance degradation.

- [ ] **Step 3: Commit**

```bash
git add scripts/dev/
git commit -m "perf: implement kv-cache quantization for node b"
```

---

### Task 2: Predictive Caching Buffer

**Files:**
- Modify: `src/core/sovereign-narrative-client.ts`
- Modify: `src/api/foundry-adapter.ts`

- [ ] **Step 1: Implement Position Telemetry Hook**
Add a listener to `foundry-adapter.ts` for `TOKEN_MOVE` events. Trigger a background callback when a token enters a "Transition Zone" (within 5 grid units of a scene boundary or door).

- [ ] **Step 2: Implement Anticipatory Seeding**
Create a `preemptiveGrounding()` method in the narrative client that fetches neighboring district lore and sends it as a non-blocking `0x0B` VSB packet to the VLM endpoint.

- [ ] **Step 3: Commit**

```bash
git add src/core/ src/api/
git commit -m "feat: implement predictive lore caching based on player movement"
```

---

### Task 3: Ouroboros v2 (Semantic Logic Vetoes)

**Files:**
- Modify: `zeroclaw/src/rules/rules_oracle.rs`
- Modify: `src/core/sentinel-monitor-service.ts`

- [ ] **Step 1: Implement Logic Veto Logic in Rust**
Expand the Node A `RulesStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle` to accept `Proposal` packets containing mechanical intents (e.g., "Spend 500eb"). Add checks against the SQLite `Akashik.db` state.

- [ ] **Step 2: Implement Intent Interception**
Update `SentinelMonitorService.ts` to block the materialization of any Node B intent that receives a `VETO_LOGIC_FAIL` result from Node A.

- [ ] **Step 3: Commit**

```bash
git add zeroclaw/src/ src/core/
git commit -m "security: upgrade ouroboros to v2 with semantic logic vetoes"
```
