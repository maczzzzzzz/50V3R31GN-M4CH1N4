# Phase 22.5: Cross-Node Stabilization Implementation Plan (COMPLETED)

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish sub-1ms state synchronization between Node A (Physical) and Node B (WSL) via a Binary UDP Intent-Ack protocol.

**Architecture:** A Rust-native VSB Server on Node A (ZeroClaw) and a VSB Mesh on Node B (Director). Communication uses raw C-style binary structs over UDP to minimize serialization overhead.

**Tech Stack:** Rust (Tokio), UDP, Open-Reasoner-Zero-1.5B (GGUF), NixOS.

---

### Task 1: Define the Sovereign Binary Schema [DONE]

**Files:**
- Create: `src/shared/vsb_protocol.rs`
- Create: `src/shared/vsb_protocol.ts`

**Step 1: Write the failing test** [DONE]
Verify that a Rust struct can be serialized to a 13-byte header + payload and recovered perfectly.

**Step 2: Implement Protocol Structs** [DONE]
Define `SovereignHeader`, `IntentPacket`, and `ResultPacket` using `#[repr(C)]`.

**Step 3: Commit** [DONE]
```bash
git add src/shared/vsb_protocol.rs src/shared/vsb_protocol.ts
git commit -m "feat(vsb): define binary sovereign handshake schema"
```

---

### Task 2: Implement VSB UDP Server (Node A - ZeroClaw) [DONE]

**Files:**
- Create: `zeroclaw/src/server/vsb_udp.rs`
- Modify: `zeroclaw/src/main.rs`

**Step 1: Write the UDP listener** [DONE]
Implement a Tokio-driven loop on Port 7878 that awaits `0x01 INTENT` packets.

**Step 2: Integration with 1B Judge** [DONE]
Route the decoded intent to the resident Open-Reasoner-Zero-1.5B model for mechanical validation.

**Step 3: Commit** [DONE]
```bash
git add zeroclaw/src/server/vsb_udp.rs
git commit -m "feat(node-a): implement high-priority VSB UDP server"
```

---

### Task 3: Residency Lockdown (1B + Falcon) [DONE]

**Files:**
- Modify: `zeroclaw/src/perception/mod.rs`
- Modify: `zeroclaw/src/main.rs`

**Step 1: Implement Residency Logic** [DONE]
Ensure both Open-Reasoner-Zero-1.5B (via --mlock) and Falcon (via persistent ONNX session) are locked into VRAM.

**Step 2: Commit** [DONE]
```bash
git add zeroclaw/src/perception/mod.rs zeroclaw/src/main.rs
git commit -m "feat(node-a): lock Open-Reasoner-Zero-1.5B and Falcon into resident VRAM (Phase 22.5)"
```


---
**LINKS:** [[OS_CORE]]
