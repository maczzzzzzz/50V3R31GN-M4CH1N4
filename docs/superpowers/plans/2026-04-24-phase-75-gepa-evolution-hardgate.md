# Phase 75: GEPA Evolution & Hardgate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable autonomous prompt optimization while locking the core identity against drift.

**Architecture:** Genetic evolution loop (Python/Rust) and immutable profile hardgates (Rust).

**Tech Stack:** Python, Rust, SQLite.

---

### Task 1: Deterministic Hardgate (Rust)

- [ ] **Step 1: Define Invariants**
File: `crates/sovereign-core/src/identity.rs`
Define the `[INVARIANT]` sections of `SOVEREIGN-IDENTITY.md` as Rust constants.

- [ ] **Step 2: Implement Validation Hook**
Write a function that prevents GEPA from saving changes that modify these invariants.

---

### Task 2: GEPA Evolution Loop (Python)

- [ ] **Step 1: Scaffold Evolution Script**
Create `scripts/evolution/gepa_loop.py`.

- [ ] **Step 2: Implement Mutation Logic**
Write the genetic mutation and evaluation logic using `decision_audit` data.

---

### Task 3: Synapse Traceback Integration

- [ ] **Step 1: Implement Vector Search Hook**
Update the evolution loop to perform a semantic search over previous failures before mutating.

- [ ] **Step 2: Commit**
```bash
git commit -m "feat(evo): deploy GEPA loop and deterministic hardgate"
```
