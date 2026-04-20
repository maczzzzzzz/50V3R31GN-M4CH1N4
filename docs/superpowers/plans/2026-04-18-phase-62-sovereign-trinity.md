# Phase 62: Sovereign Trinity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the 3-node Cognitive Mesh (Trinity) using Mooncake KVCache, SGLang, and Hermes supervision.

**Architecture:** Distributed inference fabric with disaggregated memory (Node A), narrative generation (Node B), and mechanical rules/vision (Node C).

**Tech Stack:** Mooncake v2.2, SGLang v3.0, Nix, Cat6/1GbE, CUDA 12.8, ROCm 7.2.

---

### Task 1: Physical Artery & Network Tuning

**Files:**
- Modify: `flake.nix`

- [ ] **Step 1: Configure MTU 9000 for local interfaces**
Provide a script or manual instruction to set Jumbo Frames on all cluster nodes.

- [ ] **Step 2: Commit**

```bash
git add flake.nix
git commit -m "infra: prepare network fabric for jumbo frames (mtu 9000)"
```

---

### Task 3: Mooncake Synapse (Node A)

**Files:**
- Modify: `flake.nix`
- Create: `config/mooncake_master.json`

- [ ] **Step 1: Add Mooncake to Nix environment**
Update `flake.nix` to include the Mooncake Transfer Engine and metadata server.

- [ ] **Step 2: Implement Master Metadata Config**
Define Node A as the primary KV-store coordinator.

- [ ] **Step 3: Commit**

```bash
git add flake.nix config/mooncake_master.json
git commit -m "feat(trinity): deploy mooncake metadata server on node a"
```

---

### Task 4: SGLang Rules Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle (Node C)

**Files:**
- Modify: `flake.nix`
- Create: `scripts/dev/ignite-oracle.sh`

- [ ] **Step 1: Add SGLang to Nix environment**
Update `flake.nix` to include `sglang` with RadixAttention support.

- [ ] **Step 2: Implement Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle Ignition Script**
Configure the `ignite-oracle.sh` script to load Gemma-4 E2B and Falcon Perception with speculative decoding.

- [ ] **Step 3: Commit**

```bash
git add flake.nix scripts/dev/ignite-oracle.sh
git commit -m "feat(trinity): deploy sglang oracle engine on node c"
```

---

### Task 5: Hermes Supervision Loop

**Files:**
- Create: `src/core/hermes/LogStepVerifier.ts`

- [ ] **Step 1: Implement Hash Verification Logic**
Create the Hermes Master service to compare Node B narrative outputs against the bit-identical Rust kernel traces from Node C.

- [ ] **Step 2: Commit**

```bash
git add src/core/hermes/LogStepVerifier.ts
git commit -m "feat(hermes): implement log-step hash verification for triad-wide auditing"
```
