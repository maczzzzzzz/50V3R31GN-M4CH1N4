# System-Wide "Dry Fire" Debug Audit Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute a comprehensive cross-machine debug audit between Node A (Kernel) and Node B (Director) to verify all interacting subsystems (Rules, Economy, Perception, VSB) before Foundry initialization.

**Architecture:** Peer-to-peer verification using Binary UDP via the Sovereign Highway (VSB) and local Mmap for state persistence. Tests focus on "Lore Invariants" and physical fact extraction.

**Tech Stack:** Nix, Node.js (Vitest), Go (Crush), Rust (ZeroClaw), VSB (Binary UDP), ST3GG.

---

### Task 1: Hardware Handshake & VSB Sovereignty

**Files:**
- Modify: `.env` (verify IPs)
- Test: `tests/api/vsb-client.test.ts`
- Test: `crush/wsa_test.go`

- [ ] **Step 1: Verify Sovereign Highway connectivity**
Run: `ping -c 3 192.168.0.50` (Node A) and `ping -c 3 192.168.0.51` (Node B).
Expected: < 1ms latency (WSL bridge) or stable LAN latency.

- [ ] **Step 2: Dry-fire VSB Binary UDP Pulse**
Run: `nix develop --command bash -c "cd crush && go test -v wsa_test.go"`
Expected: Successful handshake between Node A Reasoner and Node B Director.

- [ ] **Step 3: Audit Mmap Magic Bytes**
Run: `nix develop --command bash -c "go run scripts/mmap-corruptor.go --check"`
Expected: "◈ VSB Integrity: VALID".

---

### Task 2: Rules Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle & 7R1_SC0R3R Density Audit

**Files:**
- Test: `tests/integration/zeroclaw_handshake.test.ts`
- Test: `zeroclaw/tests/rules_audit.rs`

- [ ] **Step 1: Trigger Humanity Loss Invariant Roll**
Run: `nix develop --command bash -c "pnpm vitest tests/db/unified-oracle-ttta.test.ts"`
Expected: Node A 1.5B Reasoner must reject static humanity loss and require 2d6/4d6 dice roll notation.

- [ ] **Step 2: Verify 7R1_SC0R3R Context Density**
Run: `nix develop --command bash -c "cd zeroclaw && cargo test test_context_compression"`
Expected: 10.7x compression ratio on active combat logs.

---

### Task 3: Red Trade Economy & Faction Friction

**Files:**
- Test: `tests/core/red-trade-service.test.ts`
- Test: `tests/core/red-trade-story.test.ts`

- [ ] **Step 1: Simulate Cargo Hijack (Data Runner category)**
Run: `nix develop --command bash -c "pnpm vitest tests/core/red-trade-service.test.ts -t 'data_runner'"`
Expected: Generated cargo name must include "Stolen" prefix and map to "Tyger Claws" buyer.

- [ ] **Step 2: Trigger Friction Ambush**
Run: `nix develop --command bash -c "pnpm vitest tests/core/red-trade-service.test.ts -t 'ambush'"`
Expected: Outcome "ambush" when roll + friction >= 15.

---

### Task 4: Ghost Object Protocol (ST3GG) Perception Audit

**Files:**
- Test: `tests/core/steganography-service.test.ts`
- Test: `crush/st3gg_test.go`

- [ ] **Step 1: Extract Physical Facts from Pixel Shards**
Run: `nix develop --command bash -c "cd crush && go test -v st3gg_test.go"`
Expected: Decryption of encrypted JSON within dynamically sized noise images.

- [ ] **Step 2: Verify Sensory Filter**
Run: `nix develop --command bash -c "pnpm vitest tests/scripts/sensory-filter.test.ts"`
Expected: System must prune "hallucinated" entities that do not exist in the VLM perception buffer.

---

### Task 5: Unified UI & Obsidian Artery Telemetry

**Files:**
- Test: `dashboard/app/page.tsx`
- Test: `docs/superpowers/plans/2026-04-09-obsidian-sync-implementation.md`

- [ ] **Step 1: Audit Sovereign Telemetry Hook**
Run: `nix develop --command bash -c "pnpm vitest tests/api/clawlink-client.test.ts"`
Expected: WebSocket pulse from Node B Dashboard arriving at Foundry bridge.

- [ ] **Step 2: Final Vault Seal Integrity**
Run: `crush vault seal docs/ --dry-run`
Expected: 0 byte leaks in cleartext.

---

### ◈ Completion Criteria
1. Node A and Node B successfully exchanged 100 binary UDP packets without corruption.
2. 7R1_SC0R3R maintained 32k context window without VRAM overflow.
3. All Red Trade outcomes verified against "The Physics Constitution" (RED_RULES.md).
4. Steganographic shards verified as readable by the Ghost Object Protocol.

**AUDIT STATUS: STANDBY (DO NOT START)**
