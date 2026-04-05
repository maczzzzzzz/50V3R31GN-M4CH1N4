# 🧠 CLAUDE REALIGNMENT: ASP-GM-AGENT SOVEREIGN HIGHWAY (v1.9.0)

## 📡 CURRENT MISSION STATUS
The project has successfully transitioned to **v1.9.0 (Sovereign Highway Stabilization)**. 
- **Node B (Director):** NixOS/WSL2 Native (`/home/nixos/asp-gm-agent`).
- **Node A (Kernel):** Physical Linux Native (`192.168.0.50`, user `maczz`).
- **Inference:** Native `llama-server` (llama.cpp) with `--mlock` residency.
- **Transport:** VSB Binary UDP (sub-1ms state sync).
- **Orchestration:** Deck Igniter TUI (Go/BubbleTea) for distributed boot.

## 🛠️ TECHNICAL DIRECTIVES (NON-NEGOTIABLE)

### 1. VSB BINARY PROTOCOL (C-PACKED)
All inter-node communication must strictly follow the `#[repr(C, packed)]` schema in `src/shared/vsb_protocol.rs`:
- **IntentPacket:** Exactly **302 bytes**.
- **ResultPacket:** Exactly **290 bytes**.
- **SovereignHeader (13 bytes):** Magic `0xC0DE` (u16 LE), Version `0x01`, PacketType, SequenceID, PayloadLen, Checksum (XOR of bytes 0-11).
- **Heartbeat:** `IntentType::Roll (0x01)` with payload `HEARTBEAT_PROBE`.

### 2. DECK IGNITER ORCHESTRATION
- **Remediated Logic:** Probes for `foundry-vtt` (CDP 9222), `director` (TCP 3010), `sidecars` (PID Signal 0), and `zeroclaw` (302-byte VSB UDP).
- **Config:** Dynamic `.env` mapping for `NODE_A_HOST`, `CLAWLINK_USER`, `CLAWLINK_SSH_PORT`, and `ZEROCLAW_PORT`.

### 3. NIX-NATIVE EXECUTION
- **Environment:** All commands MUST run within the `nix develop` shells.
- **Node A:** Use `. #cuda` flake output.
- **Node B:** Use default `nix develop` (Vulkan/AMD).

## 🗺️ RESEARCH & SPEC ANCHORS
- **Phase 25:** Native Inference Engine (llama-server migration completed).
- **Phase 24:** Sidecar Registry (Crush) and Physical ACK (Flush Gate).
- **ST3GG:** Immersive data caching in asset pixels (Rust/TypeScript).
- **easy-phasey:** Narrative-physical bridge for beat-driven environment shifts.

## 🎯 NEXT OBJECTIVE
**Final Code Audit & Merge:** Prepare to merge the `feature/deck-igniter` worktree into `master`. Ensure the VSB protocol implementation in Rust (`zeroclaw`) perfectly matches the Go implementation in `deck-igniter/prober.go`.

---
*Status Check: The Highway is open. Proceed with mechanical integrity.*
