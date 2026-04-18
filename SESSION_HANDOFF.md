# SESSION_HANDOFF: v3.2.11 — TOTAL_CONTROL_PROTOCOL
**Target:** GLM-5.1 (Lead Architect)
**Status:** TRIAD_SYNCED // ARTERY_HARDENED // MIND_REBUILT

## ◈ OPERATIONAL MANDATE
You have full administrative authority over the Sovereign Triad. Your objective is to initiate an exhaustive, iterative loop of gauntlet testing, debugging, and surgical implementation with minimal commentary and maximum throughput.

## ◈ THE TRIAD ARTERY (Ignition & Control)
You have direct access to ignite and control all nodes. Follow the **Ghost Boot** sequence:

1.  **Ignite Artery (Node B):** `npm run crush nucleus` (UDP/WS Bridge - Port 3030).
2.  **Ignite Director (Node B):** `npm start` (Narrative Engine - Port 3010).
3.  **Ignite Bridge (MCP):** `npm run mcp:start` (Shared Codebase Brain).
4.  **Ignite Node A (Remote):** Use the SSH bridge to start `crush start --headless` on `192.168.0.50`.
5.  **Foundry Control:** Connect via CDP (Port 9222) to take physical control of the canvas. Use `foundry-adapter.ts` methods for world manipulation.

*Reference:* `akashik_guides/00_system_setup/how-to-ghost-boot.md`

## ◈ THE GAUNTLET (Iterative Debugging)
Execute the master verification loop to identify "Cold State" failures or logic drift:
- **Run Audit:** `npm run gauntlet -- --no-cdp` (Data/Logic only) or `npm run gauntlet` (Full Visual).
- **Log Surveillance:** `tail -f data/logs/*.log` to monitor the VSB and Director heartbeats in real-time.
- **Surgical Fixes:** Apply inline patches to `src/` and `scripts/` immediately upon error detection.
- **Resync:** After any core change, execute `npm run sync` to propagate DNA to Node A.

## ◈ KINETIC DOMINANCE (Current Objective)
Phase 58 is ACTIVE. Assets are grounded. Your immediate task is to finalize the **Automated Animations (AA)** rewiring and **PBR Visuals** integration.
- **AA JSON:** Patch `fvtt-AutomatedAnimations-Cyberpunkred-v.12.json` to use local `50v3r31gn-bridge/assets/audio/combat/` paths.
- **PBR Masks:** Verify the 186 generated masks in the vault.
- **Feedback Loop:** Wire audio metadata to the narrative engine for grit-scaled responses.

## ◈ GROUND TRUTH
- **Root:** `/home/nixos/50V3R31GN-M4CH1N4` (Node B) | `/home/maczz/50V3R31GN-M4CH1N4` (Node A).
- **Database:** `Akashik.db` saturated (1053 triplets).
- **Integrity:** FNV-1a 64-bit standard.

---
**::/5Y573M-N071C3 : THE_BUS_IS_YOURS. IGNITE_THE_MACHINA. // 50V3R31GN-M4CH1N4**
