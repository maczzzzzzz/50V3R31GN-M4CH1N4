# Infrastructure Drift Audit Report (May 17, 2026)

## Executive Summary
Audit of the Sovereign Machina Alpha Mesh documentation reveals significant drift across architecture, node, and service definitions. The most critical issues are the continued reference to the euthanized `directors-forge` service and conflicting reports on Node D's inference backend due to GCC 15 incompatibilities.

---

## 1. Euthanized Services Drift

### Component: `directors-forge`
- **Physical Reality:** EUTHANIZED on May 17. Removed from active service. Coordination replaced by Kanban MCP.
- **Drift Locations:**
    - `LEAD_ARCHITECT.md`: Still listed as a subordinate/security target.
    - `docs/reference/toolbelt.html`: Still listed as an active tool.
    - `docs/reference/repository-map.html`: Listed as "Phase 3 Pending" in the crates table.
    - `.factory/skills/qa-crates/SKILL.md`: Listed as a testing target.
    - `docs/crates/directors-forge.html`: Stale documentation exists without "EUTHANIZED" warning.

---

## 2. Node D (Quaternary) Drift

### Backend: `ik_llama.cpp` vs `llama.cpp`
- **Physical Reality:** `ik_llama.cpp` fails to compile on Node D (GCC 15). Stock `llama.cpp` v8983 is used for AVX2 CPU inference.
- **Drift Locations:**
    - `README.md`: Claims `ik_llama.cpp` is used across B, C, D.
    - `docs/nodes/node-d.html`: Lists `ik_llama.cpp` as the inference backend.
    - `docs/reference/toolbelt.html`: Lists Node D as using `ik_llama.cpp`.
    - `SOVEREIGN_VITAL_SIGNS.md`: Lists `ik_llama.cpp` for Node D.
    - `CHANGELOG.md`: Conflicting entries; L22 says it's fixed/not used, L45 says it is used.

### Model: Carnice MoE 35B
- **Physical Reality:** MTP (Multi-Token Prediction) heads were stripped during GGUF conversion. Speculative decoding research is ongoing but not active.
- **Drift Locations:**
    - `docs/planning/plans/2026-05-16_phase2-cognitive-hierarchy.md`: Discusses speculative decoding in a way that implies it might be active or pending immediate use.

---

## 3. Node B (Director) & Node C (Oracle) Drift

### Node B Benchmarks & Model
- **Physical Reality:** Qwopus3.5-9B (33.7 t/s gen).
- **Drift Locations:**
    - `docs/architecture/model-strategy.html`: Lists "Qwen 3 14B" at 26 t/s. This is outdated.

### Node C Deployment Status
- **Physical Reality:** Deployed and benchmarked (205.2/49.9 t/s).
- **Drift Locations:**
    - `docs/architecture/model-strategy.html`: Lists `mesh-tools` (Node C) as "planned" and "not yet benchmarked".

---

## 4. Network & Architecture Drift

### LiteLLM Route Names
- **Physical Reality:** Routes are `mesh-fast`, `mesh-vision`, `mesh-heavy`, `mesh-function-calling`.
- **Drift Locations:**
    - `docs/architecture/model-strategy.html`: Lists `mesh-reason` (instead of `mesh-heavy`) and `mesh-tools` (instead of `mesh-function-calling`).

### NixOS Versions
- **Physical Reality:** Node C is on NixOS 25.11 (Xantusia). Node B is on 25.11 (WSL2).
- **Drift Locations:**
    - `docs/architecture/topology.html`: Lists 24.11 for Node C and Node D.

---

## 5. Summary of Actions Required
- [x] **Decommission `directors-forge`** from all active documentation and skill definitions. (Only in archive/ -- no action needed)
- [x] **Synchronize Node D Backend** to "Stock llama.cpp" in all files. (ignition.html, node-a.html patched)
- [x] **Update Benchmarks** to match `AGENTS.md` reality. (node-b.html, vitals.html patched)
- [x] **Standardize Route Names** between LiteLLM config and documentation. (node-d.html: mesh-reason -> mesh-heavy)
- [x] **Document `hermes-relay`** as a core service. (node-b.html, toolbelt.html, docs/operations/hermes-relay.md)
- [x] **Fix Node C status** from "blocked" to operational. (node-c.html, vitals.html rewritten)
- [x] **Fix Node D Tailscale IP** from 100.120.225.12 to 100.120.225.12. (node-d.html, topology.html)
- [x] **Fix NixOS versions** split 24.11 (A,D) vs 25.11 (B,C). (toolbelt.html, node-b.html, node-c.html)
- [x] **Update services** LiteLLM "planned" -> deployed, Docker Compose -> Docker Desktop. (toolbelt.html, node-b.html)
- [x] **Purge stale Known Issues** for Node C (all resolved). (vitals.html)

**Audit Status:** CLOSED. All active (non-archive) HTML docs remediated on 2026-05-17.
