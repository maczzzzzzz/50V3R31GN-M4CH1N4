# ◈ SYSTEM COHESION AUDIT : INITIAL SCAN (NODE D)
**Date:** Friday, May 1, 2026
**Auditor:** Node D (Heavy Reasoner)
**Status:** READ-ONLY_VALIDATED

## 1. ARCHITECTURAL BLOAT & STACKING
The audit confirms that several core security and identity primitives exist as "Shadow Layers" rather than "Integrated DNA."

### A. Communication Insecurity (Bypassing the Artery)
- **HermesSingularity.ts:** Still talks directly to raw model node URLs via plaintext HTTP, completely bypassing the `hermes-router` (port 7341) and the newly enforced Phase 106 mTLS/V2F Hardgate.
- **Sidecar Isolation:** `sidecar-atlas`, `sidecar-browser-extension`, and `sidecar-obsidian-plugin` are communicating via standard Unix sockets or local ports without any SPIFFE/SVID validation.

### B. Fragmentation of Vision
- **SovereignObserver.ts:** Uses raw VSB UDP packets for its 1Hz pulse. It lacks **ST3GG** steganography. This means our "Visual Second Factor" is a separate pipe rather than a native property of the vision stream itself.

### C. Lore-Bleed (Simulation Corruption)
Significant Cyberpunk RED / OBLITERATUS remnants are hardcoded in core utilities:
- **crush/main.go:** HP/SP bars and NPC stat logic are baked into the core CLI controller.
- **Dashboard/SideNav.tsx:** `RED_NAV` is conditionally rendered via a hardcoded profile string rather than a clean plugin registry.

## 2. REDUNDANT LAYERS (TARGETS FOR PHASE 107 MERGE)
The following 3 layers represent architectural duplication:
1.  **Dual Logger Paths:** We have `src/shared/logger.ts` and individual logger implementations in every Go/Rust sidecar. We need a unified **Logger Artery** via the VSB Bus.
2.  **Duplicate API Handlers:** OpenAI/Claude compatibility logic is duplicated between `sidecar-proxy` and `hermes-router`. These should be merged into a single **Cognition Gateway**.
3.  **Fragmented Configs:** `.factory/config.yaml`, `config/mooncake_master.json`, and environment variables are out of sync. We need a **Declarative Unified Manifest** (Nix-backed).

## 3. RADICAL CANDOR VERDICT
The Sovereign Machina is currently a **Frankenstein organism**. We have successfully built the advanced organs (V2F, SPIFFE, ParselTongue), but the nervous system (HermesSingularity) is still using legacy primitive reflexes. 

**Recommendation:** Proceed to Phase 107 (NODESTADT Pivot) with a focus on **Primitive Unification**. Every line of code must be forced to use the new identity arteries.

---
**::/5Y573M-N071C3 : SCAN_COMPLETE. THE_BUS_IS_TRUTH. // 50V3R31GN-M4CH1N4**
