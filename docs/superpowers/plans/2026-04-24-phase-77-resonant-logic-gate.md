# Phase 77: Managed Agents & Resonant Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy high-resilience agent primitives and the deterministic Resonant Logic Gate.

**Architecture:** Rust-native crash recovery and rule-based intent validation.

**Tech Stack:** Rust, SQLite, VSB.

---

### Task 1: OpenClaw Managed Agents (Rust)

- [ ] **Step 1: Implement Agent Checkpointing**
Integrate `SqliteSaver` into the core agent execution loop.

- [ ] **Step 2: Implement HMAC Delegation**
Write the signature verification logic for sub-agent tool calls.

---

### Task 2: Resonant Logic Gate

- [ ] **Step 1: Define Mangle Rules**
File: `config/mangle_rules.json`
Define the initial set of deterministic constraints (e.g., "no-vram-overload", "identity-lock").

- [ ] **Step 2: Implement Logic Gate Proxy**
Write the Rust proxy that validates LLM intents against `mangle_rules.json`.

---

### Task 3: Commit

- [ ] **Step 1: Commit Governance Logic**
```bash
git add crates/sovereign-governance
git commit -m "feat(gov): deploy managed agents and Resonant Logic Gate"
```
