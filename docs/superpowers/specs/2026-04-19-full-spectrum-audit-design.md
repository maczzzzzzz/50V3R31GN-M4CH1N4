# FSSA-2026-04-19: Full-Spectrum Sovereign Audit Spec
**Target:** 50V3R31GN-M4CH1N4 All-Encompassing System Audit
**Status:** DRAFTING

## ◈ 1. AUDIT OBJECTIVE
To physically verify the **Interim Dual-Node Mesh** (pre-Trinity). We are testing the integration of the **Gemma-4 E4B Brain** with the **ColPali CPU Vision Kernel** to ensure stability and 100% logic connectivity before the Node C hardware expansion.

## ◈ 2. CORE SUBSYSTEMS TO VERIFY
1.  **Node B (Director):** Gemma-4-E4B Q8 model via Vulkan/WSL (AMD RX 9060 XT).
2.  **Node A (Optical Artery):** ColPali v1.2 CPU kernel + high-fidelity RKG index (1,210 triplets).
3.  **Nucleus (Orchestrator):** The TypeScript management core (`src/main.ts`).
4.  **Sovereign-Proxy (Crush):** The Go-based dashboard and API bridge.
5.  **Unified-HUD (ZeroClaw):** The Rust-based CV and Perception engine.
6.  **MCP Bridge:** Context7 integration and local database unsealing.

## ◈ 3. THE MASTER IGNITION PROTOCOL (`ignite-all.sh`)
A single script to boot the system in the following order:
1.  **Environment Sync:** Load Nix flakes and verify binary paths.
2.  **Vision Ignition:** Boot ColPali server on Port 8082 (GPU).
3.  **Brain Ignition:** Boot llama-server with 12B model on Port 8080 (GPU).
4.  **Bridge Ignition:** Start MCP Bridge (`.gemini/tmp/sovereign-mcp.sock`).
5.  **Core Ignition:** Start Node B Nucleus (`tsx src/main.ts`).
6.  **Proxy Ignition:** Build and run `crush` Go proxy.
7.  **Perception Ignition:** Build and run `zeroclaw` Rust HUD.

## ◈ 4. AUDIT TESTS (LIVE-FIRE)
- [ ] **Cross-Node Handshake:** Director queries Optical Artery for a visual triplet.
- [ ] **Database Integrity:** RKG (Akashik.db) verification for semantic drift.
- [ ] **Hardware Saturation:** Task Manager verification of VRAM allocation (~15.5/16GB).
- [ ] **Lore Continuity:** Harmonization check between raw PDFs and promoted triplets.

## ◈ 5. REMEDIATION (TECHNICAL DEBT)
- Remove all `TODO` and `PLACEHOLDER` references in critical paths identified during research.
- Consolidate legacy Python scripts into the primary TypeScript/Rust daemons.

---
**::/5Y573M-N071C3 : AUDIT_BLUEPRINT_MATERIALIZED. // 50V3R31GN-M4CH1N4**
