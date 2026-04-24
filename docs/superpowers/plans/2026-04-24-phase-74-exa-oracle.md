# Phase 74: The Sovereign Oracle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy memory-safe, zero-trust semantic search and hallucination detection via Exa-Labs.

**Architecture:** Native Rust/Go SDK ports, Go-based MCP server, and a Rust verification gate.

**Tech Stack:** Rust, Go, Exa API.

---

### Task 1: exa-rs SDK & Verification Gate

- [ ] **Step 1: Scaffold exa-rs**
Create a new Rust crate `crates/exa-rs`.

- [ ] **Step 2: Implement Shield Gate**
Implement the claim extraction and verification logic in `crates/exa-rs/src/shield.rs`.

- [ ] **Step 3: Write Tests**
Test with a known hallucination and verify the Shield Gate blocks it.

---

### Task 2: exa-mcp-go Server

- [ ] **Step 1: Scaffold MCP Server**
Create `scripts/ops/exa-mcp-go`.

- [ ] **Step 2: Implement Search Tools**
Expose `search`, `find_similar`, and `get_contents` as MCP tools.

---

### Task 3: Integration & Deployment

- [ ] **Step 1: Wire into machina-hub**
Update the hub configuration to include the new Exa MCP server.

- [ ] **Step 2: Commit**
```bash
git commit -m "feat(oracle): deploy Exa-native SDK and verification shield"
```
