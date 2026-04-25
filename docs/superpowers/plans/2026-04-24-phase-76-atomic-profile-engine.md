# Phase 76: Sovereign Artery & Cognition Fabric Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform static manifests into an atomic context engine and deploy the Hermes Cognition Router.

**Architecture:** Rust-based router sidecar and Mooncake-KV profile synchronization.

**Tech Stack:** Rust, Mooncake, vLLM.

---

### Task 1: Atomic Profile Engine (Rust)

- [ ] **Step 1: Implement Mooncake-KV Mesh**
Create `crates/sovereign-core/src/kv_bridge.rs` to sync `SOVEREIGN-IDENTITY.md` state.

- [ ] **Step 2: Implement Signal Handler**
Write the `SIGUSR1` reload logic in the `artery_manager`.

- [ ] **Step 3: Test Profile Switch**
Run: `/profile researcher` and verify triad-wide synchronization.

---

### Task 2: Hermes Cognition Router (Rust)

- [ ] **Step 1: Scaffold hermes-router**
Create `crates/hermes-router`.

- [ ] **Step 2: Implement Routing Logic**
Implement the $L$-length and profile-based routing rules.

- [ ] **Step 3: Deploy vLLM Farm (Node C)**
Scaffold the Nix/Systemd units for the 3-instance model farm.

---

### Task 3: Commit

- [ ] **Step 1: Commit Fabric Logic**
```bash
git add crates/hermes-router crates/sovereign-core/src/kv_bridge.rs
git commit -m "feat(fabric): deploy atomic profile engine and inference router"
```
