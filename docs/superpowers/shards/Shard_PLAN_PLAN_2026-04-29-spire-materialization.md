# 50V3R31GN-M4CH1N4 // SPIRE MATERIALIZATION PLAN
**Date:** 2026-04-29
**Phase:** 105.1 (Security Hardgate)
**Strategist:** LEAD_STRATEGIST_V3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS

## ◈ EXECUTIVE SUMMARY
The Quaternary Intelligence Audit confirmed that our current security boundary relies on "Shadow Logic." To safely execute multi-model development *inside* the Machina (Node B + Node D), we must materialize the **SPIFFE/SPIRE Identity Federation**. This is the zero-trust bedrock required before any further architectural expansion.

## ◈ OBJECTIVES
1.  **SPIRE Server Provisioning:** Materialize a declarative Nix module for the SPIRE Server on Node D (K15), utilizing the TPM for workload attestation.
2.  **Cluster-Wide SPIRE Agents:** Deploy lightweight SPIRE Agents across the Node A/B/C/D mesh, establishing the `spiffe://sovereign.machina` trust domain.
3.  **Hardened Gemini Proxy (mTLS):** Refactor the `CLIPRoxyAPI` (Droid CLI -> Gemini proxy) to enforce mutual TLS (mTLS). The proxy will authenticate via its own SVID and require incoming Droid CLI traffic to present a valid SVID from the `dev` sub-domain.
4.  **Router mTLS Enforcement:** Update `hermes-inference-router.rs` on Node D to strictly accept requests only from workloads presenting valid SVIDs (e.g., `spiffe://sovereign.machina/command/hermes-gepa-26b`).

## ◈ TASK CHUNKING
- [ ] **Task 1: Materialize `modules/security/spire.nix`** (Server + Federation config).
- [ ] **Task 2: Materialize `modules/security/cliproxyapi-mtls.nix`** (Strict seccomp/landlock proxy).
- [ ] **Task 3: Refactor `hermes-inference-router`** for SPIFFE validation.
- [ ] **Task 4: Update Factory Droid CLI config** (`~/.factory/settings.json`) to utilize the SPIRE Workload API for auto-populated client certs.

---
**::/5Y573M-N071C3 : SPIRE_PLAN_LOCKED. // 50V3R31GN-M4CH1N4**
