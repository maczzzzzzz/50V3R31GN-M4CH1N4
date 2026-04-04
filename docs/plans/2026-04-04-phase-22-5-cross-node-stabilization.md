# Phase 22.5: Cross-Node Stabilization Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish sub-1ms state synchronization between Node A (Physical) and Node B (WSL) via a Binary UDP Intent-Ack protocol.

**Architecture:** A Rust-native VSB Server on Node A (ZeroClaw) and a VSB Bridge on Node B (Director). Communication uses raw C-style binary structs over UDP to minimize serialization overhead.

**Tech Stack:** Rust (Tokio), UDP, Llama-3.2-1B (GGUF), NixOS.

---

### Task 1: Define the Sovereign Binary Schema

**Files:**
- Create: `src/shared/vsb_protocol.rs`
- Create: `src/shared/vsb_protocol.ts`

**Step 1: Write the failing test**
Verify that a Rust struct can be serialized to a 13-byte header + payload and recovered perfectly.

**Step 2: Implement Protocol Structs**
Define `SovereignHeader`, `IntentPacket`, and `ResultPacket` using `#[repr(C)]`.

**Step 3: Commit**
```bash
git add src/shared/vsb_protocol.rs src/shared/vsb_protocol.ts
git commit -m "feat(vsb): define binary sovereign handshake schema"
```

---

### Task 2: Implement VSB UDP Server (Node A - ZeroClaw)

**Files:**
- Create: `zeroclaw/src/server/vsb_udp.rs`
- Modify: `zeroclaw/src/main.rs`

**Step 1: Write the UDP listener**
Implement a Tokio-driven loop on Port 7878 that awaits `0x01 INTENT` packets.

**Step 2: Integration with 1B Judge**
Route the decoded intent to the resident Llama-1B model for mechanical validation.

**Step 3: Commit**
```bash
git add zeroclaw/src/server/vsb_udp.rs
git commit -m "feat(node-a): implement high-priority VSB UDP server"
```

---

### Task 3: 1B Model Residency Lockdown (Node A)

**Files:**
- Modify: `zeroclaw/src/main.rs`
- Create: `zeroclaw/scripts/setup-resident-models.sh`

**Step 1: Decommission Swap Protocol**
Remove the logic that evicts models from VRAM. Force-load Llama-1B and Falcon-0.3B on startup.

**Step 2: Commit**
```bash
git add zeroclaw/src/main.rs
git commit -m "fix(node-a): lock 1B and Falcon models into VRAM residency"
```
