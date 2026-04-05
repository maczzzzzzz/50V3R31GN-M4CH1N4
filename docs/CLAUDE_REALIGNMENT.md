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
... (omitted for brevity)

### 2. DECK IGNITER ORCHESTRATION
... (omitted for brevity)

### 3. AI-DRIVEN SCRIPT INJECTION (NEW)
- **Power:** Node B can now inject raw JavaScript into Foundry via `foundry.runScript(code, broadcast)`.
- **Trust:** This is a high-privilege orchestration tool. Use it for immersive effects (UI glitches, sound triggers, lighting shifts).
- **Service:** `NetrunnerAntagonistService` provides a high-level API for these "attacks."

### 4. ZERO-TRUST SCRIPT AUDITING
- **Protocol:** Every generated script MUST be validated by Node A before execution.
- **Enforcement:** `NetrunnerAntagonistService` automatically calls `nitro.auditScript()` for all injections.
- **Rules:** Flag keywords like `fetch`, `pull`, `get` (non-game), `rm`, `fs`, `eval`.
- **Failure:** If Node A returns `passed: false`, execution is blocked.

### 5. NIX-NATIVE EXECUTION
... (omitted for brevity)

## 🗺️ RESEARCH & SPEC ANCHORS
- **Phase 25:** Native Inference Engine (llama-server migration completed).
- **Phase 24:** Sidecar Registry (Crush) and Physical ACK (Flush Gate).
- **ST3GG:** Immersive data caching in asset pixels (Rust/TypeScript).
- **easy-phasey:** Narrative-physical bridge for beat-driven environment shifts.

## 🎯 NEXT OBJECTIVE
**Final Code Audit & Merge:** Prepare to merge the `feature/deck-igniter` worktree into `master`. Ensure the VSB protocol implementation in Rust (`zeroclaw`) perfectly matches the Go implementation in `deck-igniter/prober.go`.

---
*Status Check: The Highway is open. Proceed with mechanical integrity.*
