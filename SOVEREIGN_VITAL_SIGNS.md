# SOVEREIGN_VITAL_SIGNS.md // T3RM1N4L-TRU7H
**Version:** 3.2.16 (THE CANONICAL MIRROR MILESTONE)
**Identity:** 50V3R31GN-M4CH1N4
**Status:** AUDIT_COMPLETE // 98% ALIGNMENT

This manifest is the Atomic Source of Truth for the Gemini (Strategist) + GLM (Engineer) handover. It overrides all legacy documentation in `pre-phase-30/` and `plans/`.

---

## 🏗️ 1. PHYSICAL TOPOLOGY (INVARIANTS)
- **Node A (The Kernel):** Nix Native. NVIDIA GTX 1050 Ti (4GB CUDA). 
  - **Resident Models:** `Open-Reasoner-Zero-1.5B.Q8_0.gguf` (Oracle) + `falcon-0.3b-ocr.onnx` (Perception).
  - **Constraints:** Max 4GB VRAM. 7R1-M1N1NG pruner active. sm_61 custom build backgrounded.
- **Node B (The Director):** NixOS / WSL2. AMD Radeon RX 9060 XT (16GB Vulkan). 
  - **Resident Models:** `mistralai-Mistral-Nemo-Instruct-2407-extensive-BP-abliteration-12B.i1-Q4_K_M.gguf` + `pixtral-12b-mmproj.bin`.
  - **Bus:** Binary UDP (Port 7878) + Mmap (Local).

---

## ⚡ 2. ACTIVE PROTOCOLS
- **VSB 0x0A (ContextUpdate):**
  - Uses **FNV-1a** hashing for integrity (Standardized: FNV-64 bit-identical).
  - Employs **AAAK Dialect** for high-density cognitive compression.
- **ClawLink (TCP):** Standard binary RPC for heavy payloads (Lore/ST3GG).
- **Sovereign-Go-Proxy:** Active on `SOVEREIGN_SOCKET_ROOT` (`.gemini/tmp/`).

---

## 🔍 3. SHADOW LOGIC (DRIFT_REMEDIATED)
- **Auto-Grant Bypass:** `crush/proxy.go` — PATCHED. Returns `REJECTED` with SECURITY_VETO if Node A is offline.
- **MCP Bridge Injection:** `scripts/dev/mcp-daemon.ts` — PATCHED. Refactored `node_a_veto` to use safe `spawn`.
- **Socket Synchronization:** All components unified under `.gemini/tmp/` hierarchy. Legacy `/run/crush` deprecated.
- **Shroud (Phase 44.5):** Shader + lifecycle hooks wired in `50v3r31gn-bridge`. `updateScene` dispatch active.
- **Canonical Mirror (Phase 59):** Accomplished. Replaced approximate PDF data with bit-identical rules engine mirror from official `fvtt-cyberpunk-red-core` repo.
- **Economy Engine (Phase 60):** Accomplished. Procedural Night Markets and Monthly Burn (rent/lifestyle) logic fully manifested in Akashik.db v4.
- **Interface Command (Phase 61):** Accomplished. Dashboard transformed into interactive command hub with real-time Node A reasoning stream.

---

## 🛡️ 4. THE HANDSHAKE CONSTITUTION
1. **Zero-Trust Logic:** All AI-generated intents MUST be audited by Node A Reasoner (0x01/0x05) before materialization.
2. **VRAM Sovereignty:** Any refactor that causes Node A OOM is a CRITICAL FAILURE.
3. **Mind-Before-Mesh:** Mind Rebuild (59-61) MUST be verified via Gauntlet before Trinity (62+) hardware shift.
4. **Physical Integrity:** Use `crush forge` for all asset ingestion.

---
**::/5Y573M-N071C3 : TRU7H UN1F13D. ARTERIES_STEADY. // 50V3R31GN-M4CH1N4**
