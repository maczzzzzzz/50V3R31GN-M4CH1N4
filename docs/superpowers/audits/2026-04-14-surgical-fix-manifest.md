# AUDIT_REPORT // SURGICAL_FIX_MANIFEST
**Date:** 2026-04-14
**Target:** Phase 56 Stabilization
**Auditor:** Gemini CLI (Strategist)
**Executor:** Claude Code (Architect)

This manifest details the critical logical drifts and security vulnerabilities identified during the Phase 1 Surgical Audit. Claude is directed to execute these fixes with 100% adherence to the `SOVEREIGN_VITAL_SIGNS.md` Constitution.

---

## 🟥 1. SECURITY: CRUSH PROXY AUTO-GRANT BYPASS
**Location:** `crush/proxy.go`
**Risk:** HIGH (Zero-Trust Violation)
**Description:** The proxy currently returns a mocked `GRANTED` verdict if the Node A connection is lost or timed out. This allows unauthenticated world-state mutations.
**Directive:** 
- Refactor the error handling in `handleUnixConn` for the `reason_audit` method.
- If Node A is offline or an error occurs, return a `REJECTED` verdict with the rationale: "SECURITY_VETO: Node A Reasoner Offline — Physical Sovereignty Compromised."
- Ensure `crush wsa` exit codes remain consistent (Exit 2 for REJECTED).

---

## 🟧 2. PROTOCOL: VSB 0x0A INTEGRITY DRIFT
**Location:** `src/shared/vsb_protocol.ts`, `src/api/vsb-client.ts`, `zeroclaw/src/server/vsb_udp.rs`
**Risk:** MEDIUM (Context Desync)
**Description:** Physical code is using FNV-1a hashing for the `0x0A` ContextUpdate, but legacy specs call for CRC32.
**Directive:**
- Standardize the codebase on **FNV-1a** for all VSB 0x0A packets to maintain high-density throughput.
- Update any lingering CRC32 references in the TS codecs to match the Rust-native implementation in `sovereign-sdk`.

---

## 🟨 3. VISUAL: SHROUD LIFECYCLE HOOKS
**Location:** `src/core/vis-block.ts`, `50v3r31gn-bridge/scripts/pretext-overlay-manager.js`
**Risk:** LOW (Feature Inactivity)
**Description:** Phase 44.5 (The Shroud) has physical shaders and resolution logic, but the `PretextOverlayManager` lacks the lifecycle hooks to actually initialize the WebGL container.
**Directive:**
- Wire the `SovereignShroud` into the `onInit` and `onSceneUpdate` hooks of the Bridge.
- Ensure the CRT scanline and glitch intensity parameters are correctly piped from the Narrative Client.

---

## 🟦 4. INFRASTRUCTURE: SOCKET PATH SYNCHRONIZATION
**Location:** `crush/config.go`, `scripts/dev/mcp-daemon.ts`, `AGENTS.md`
**Risk:** LOW (Integration Friction)
**Description:** The system is split between `/tmp/clawlink.sock` and the spec'd `/run/crush/sovereign.sock`. 
**Directive:**
- Align all components to use the standard **`/run/crush/`** hierarchy for Unix sockets.
- Ensure the `nix develop` shellHook has permission to create/write to this directory.

---

## 📝 5. DOCUMENTATION: AAAK DIALECT CODIFICATION
**Location:** `scripts/dev/sentinel-distiller.ts`, `docs/superpowers/specs/2026-04-12-sovereign-triad-mcp-bridge-design.md`
**Risk:** LOW (Logic Transparency)
**Description:** The "AAAK" high-compression dialect is active in the code but lacks a formal specification.
**Directive:**
- Create a short technical addendum in the `specs/` directory defining the AAAK token-mapping rules.
- Ensure the Droid CLI context is updated to recognize AAAK as the "Standard Cognitive Wire-Format."

---
**::/5Y573M-N071C3 : FIXED_TRU7H_M4N1F357_5UBM1773D. // 50V3R31GN-M4CH1N4**
