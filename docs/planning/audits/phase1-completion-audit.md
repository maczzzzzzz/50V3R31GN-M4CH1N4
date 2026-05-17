# Phase 1 Completion Audit: Kinetic Agency

**Date:** 2026-05-18
**Auditor:** GLM-5 (Lead Architect), independent review of Phase 1 deliverables
**Branch:** stable/mesh-alpha
**Commit:** d3fac7c04

---

## 1. Executive Summary

| Task | Claimed Status | Audit Verdict | Details |
|:-----|:---------------|:--------------|:--------|
| P1-T1: Vision UI | [~] Deployed | **CONDITIONAL PASS** | Core capability delivered. Missing persistent service and latency optimization. |
| P1-T2: Terminal Control | [~] Partial | **CONDITIONAL PASS** | Mesh connectivity verified. Key-based SSH not deployed. Browser re-auth blocker unresolved. |
| P1-T3: Screen Triage | [~] Deployed | **CONDITIONAL PASS** | End-to-end pipeline works. Missing systemd service and trigger hooks. |

**Overall Phase 1 Verdict:** CONDITIONAL PASS -- core capabilities exist but all three tasks have open "remaining" items that were correctly identified but not closed. Phase 1 is ~75% complete, not the estimated 80%.

**Critical Finding:** LiteLLM Docker container is running v1.82.6, not the claimed v1.84.0. The SQL injection CVE patch was never actually applied despite documentation saying it was.

---

## 2. Task Completion Verification

### P1-T1: Vision-Enabled UI Automation

**Claimed:** Deployed. Qwen3-VL-2B Q6_K on mesh-vision route (Node B port 8082). Text: 550/50.7 t/s. Image verified.

**Evidence:**
- `sidecars/mesh/litellm-mesh.yaml` contains mesh-vision route to `http://10.0.0.11:8082` (Node B)
- CHANGELOG v0.2.0-alpha documents mmproj download and image verification
- IMPLEMENTATION_PLAN.md records 550/50.7 t/s text benchmarks
- Docker container `mesh-litellm` is UP (2 hours at audit time)
- Hermes auxiliary vision wired to mesh-vision route

**Remaining (correctly identified):**
- Persistent service for vision endpoint (llama-server restarts are manual)
- Image latency optimization (no benchmarks for image inference latency found)

**Verdict:** CONDITIONAL PASS. Core vision capability exists and is wired. Missing durability items.

---

### P1-T2: Terminal Control

**Claimed:** Partial. All 4 nodes visible. SSH requires browser re-auth. Key-based SSH not deployed.

**Evidence:**
- Tailscale artery documented as operational in SOVEREIGN_VITAL_SIGNS.md
- SSH to Node D (maczz@100.120.225.12) confirmed in CHANGELOG
- Node C SSH confirmed working (maczz@100.102.109.81)
- Node A SSH verified in prior sessions (100.96.253.114)
- Browser re-auth blocker documented in SESSION_HANDOFF.md as "Requires User Action"

**Remaining (correctly identified):**
- Key-based SSH deployment (currently depends on Tailscale SSH + browser checkin)
- Browser re-auth is a user-action item, not an engineering task

**Verdict:** CONDITIONAL PASS. Mesh connectivity is real. Key-based SSH is a legitimate gap but may be acceptable if Tailscale SSH is the intended path.

---

### P1-T3: Screen Triage Sidecar

**Claimed:** Deployed. capture.py + triage.py in sidecars/sniffer/. 910ms capture, 25s total.

**Evidence:**
- `sidecars/sniffer/capture.py` exists (2,738 bytes, May 16 18:29)
- `sidecars/sniffer/triage.py` exists (2,805 bytes, May 16 18:30)
- Code is functional: PowerShell screen capture, LiteLLM vision query, latency measurement
- CHANGELOG documents 910ms capture and 25s end-to-end

**Remaining (correctly identified):**
- systemd service (`sniffer.service` + `sniffer.timer`) not created
- Triage trigger hooks not implemented
- No tests for capture.py or triage.py

**Verdict:** CONDITIONAL PASS. Pipeline works as a one-shot. Not production-ready as a service.

---

## 3. Security Findings

### CRITICAL: LiteLLM Version Mismatch (CVE UNPATCHED)

**CHANGELOG v0.2.0-alpha states:**
> "LiteLLM mesh router: Upgraded from 1.82.6 to 1.84.0 in Docker container to patch critical SQL injection vulnerability (CVE in litellm <1.83). Container restarted and verified healthy."

**Actual container version:**
```
$ docker exec mesh-litellm pip show litellm | grep Version
Version: 1.82.6
```

**Root cause:** `proxy.yml` uses floating image tag `ghcr.io/berriai/litellm:main-latest`. The container was likely restarted and pulled whatever `main-latest` resolved to at that time. The upgrade was either never applied or reverted on restart.

**Impact:** The SQL injection CVE in litellm <1.83 remains UNPATCHED. This is the same vulnerability documented as fixed.

**Recommendation:** Pin the Docker image to a specific version tag (e.g., `ghcr.io/berriai/litellm:v1.84.0-stable` or higher) and verify the version after restart.

### MEDIUM: Hardcoded API Keys in Source Control

Files with hardcoded secrets in the repo:

| File | Secret | Severity |
|:-----|:-------|:---------|
| `sidecars/sniffer/triage.py:21` | `API_KEY = "sk-sov...roxy"` | MEDIUM |
| `sidecars/mesh/mesh_proxy.py:17` | `MASTER_KEY = "sk-sov...roxy"` | MEDIUM |
| `sidecars/mesh/proxy.yml:9` | `SOVEREIGN_MESH_PROXY_KEY=sk-sov...roxy` | MEDIUM |
| `sidecars/mesh/litellm-mesh.yaml:14,33,52,71,96` | `api_key: "machina-sovereign-mesh-v3-secret-key"` and `master_key: "sk-sov...roxy"` | MEDIUM |

**Context:** These are local-only mesh keys, not external service credentials. The repo is private. The keys are obfuscated with `...` in some places but written in full in others. Low immediate risk, but bad hygiene.

**Recommendation:** Move secrets to environment variables or a `.env` file excluded from git. At minimum, ensure `.gitignore` covers any future secret files.

### LOW: mesh_proxy.py is Legacy Code

`sidecars/mesh/mesh_proxy.py` is a custom FastAPI router that predates the LiteLLM Docker deployment. It is NOT in active use -- the Docker container (`mesh-litellm`) handles all routing. The file contains hardcoded node IPs and is 131 lines of dead code.

**Recommendation:** Either delete or archive to a `legacy/` directory. If kept, document that it is superseded by LiteLLM.

### INFO: Kanban MCP SQL is Safe

The kanban MCP `db.py` uses f-strings in SQL construction (`f"UPDATE tasks SET {set_clause} WHERE id = ?"`), but all column names are validated against an allowlist (`allowed` set at line 186-189). The `complete_task` function hardcodes the column name. No injection risk.

---

## 4. Documentation Drift Report

### CHANGELOG.md vs Reality

| Claim | Reality | Drift Level |
|:------|:--------|:------------|
| LiteLLM upgraded to 1.84.0 | Container runs 1.82.6 | **CRITICAL** |
| Docker Desktop migration complete | Container UP and healthy | No drift |
| sovereign-sniffer deployed | Files exist, not a service | Minor (missing "not persistent" qualifier) |
| Node D SSH verified | Confirmed | No drift |

### IMPLEMENTATION_PLAN.md vs Reality

| Section | Status | Drift |
|:--------|:-------|:------|
| P1-T1 marked [~] | Correct, remaining items accurate | No drift |
| P1-T2 marked [~] | Correct, remaining items accurate | No drift |
| P1-T3 marked [~] | Correct, remaining items accurate | No drift |
| Phase 2 section | Lists RTX 5060 Ti 16GB via OCuLink | No drift (plan, not execution) |
| directors-forge EUTHANIZED | Confirmed removed from sidecars/ | No drift |
| Infrastructure Status table | Kanban MCP: LIVE, LiteLLM: LIVE, sniffer: DEPLOYED | Minor (sniffer should be "ON-DEMAND") |

### SOVEREIGN_VITAL_SIGNS.md vs Reality

| Item | Documented | Reality | Drift |
|:-----|:-----------|:--------|:------|
| LiteLLM version | Should be 1.84.0 | 1.82.6 | **CRITICAL** |
| Docker Desktop | Active | Container UP | No drift |
| TurboQuant | Active all nodes | No verification in this audit | UNVERIFIED |
| mesh-vision benchmark | 550/50.7 t/s | As documented | No drift |

### KANBAN_MAP.md vs Reality

- Phase 0 cards: All should be marked COMPLETE (Phase 0 gate closed)
- Phase 1 cards: Status fields not shown in the map (no explicit pass/fail column)
- Phase 2/3/4 cards: Priority 5-8, not started -- correct
- directors-forge card still exists (t_059e22aa) -- should be marked CANCELLED, not just deprioritized
- Crate status table is accurate

### AGENTS.md vs Reality

- Node B specs: Correct
- Node D specs: Correct (CPU-only inference)
- Node C specs: Correct (CUDA, RTX 2060 6GB)
- Docker Desktop note: Correct
- VRAM allocation: Correct (~10.4GB of 16GB)

---

## 5. Code Quality Assessment

### sidecars/sniffer/capture.py (88 lines)

**Strengths:**
- Clean error handling with specific exceptions
- Capture cleanup (keeps last 5) prevents disk fill
- Timeout on PowerShell subprocess (15s)
- File existence check after capture
- Uses `-NoProfile` flag for faster PowerShell startup

**Issues:**
- No logging (only prints to stdout on `__main__`)
- Hardcoded `\\\\wsl$\\nixos` -- WSL distro name is not portable
- `capture_and_save()` is a no-op wrapper (decodes b64 just to verify, returns filepath that already exists)
- No retry logic for transient PowerShell failures
- No unit tests

### sidecars/sniffer/triage.py (100 lines)

**Strengths:**
- Proper latency measurement (capture_ms, inference_ms, total_ms)
- Returns structured dict with token count
- Good CLI output formatting
- Uses `sys.path.insert` for local imports

**Issues:**
- Hardcoded `API_KEY` (see Security Findings)
- Hardcoded `LITELLM_URL` (localhost:4000) -- not configurable for remote use
- No retry on transient HTTP errors
- 30-second timeout may be too short for complex screen analysis
- No response validation (assumes `choices[0].message.content` exists)
- No unit tests

### sidecars/kanban-mcp-server/src/kanban_mcp/db.py (284 lines)

**Strengths:**
- Clean SQLite wrapper with context manager
- Allowlist-based column validation prevents SQL injection
- WAL mode for concurrent access
- Proper use of parameterized queries

**Issues:**
- f-string SQL construction (safe due to allowlist, but code smell)
- No connection pooling (new connection per call)
- No migration strategy (relies on Hermes schema matching)

---

## 6. Technical Debt Register

| ID | Description | Severity | Origin |
|:---|:------------|:---------|:-------|
| TD-001 | LiteLLM floating tag (`main-latest`) allows version regression | HIGH | Docker config |
| TD-002 | No tests for sovereign-sniffer (capture.py, triage.py) | MEDIUM | Phase 1 implementation |
| TD-003 | mesh_proxy.py is dead code in active repo | LOW | Pre-LiteLLM artifact |
| TD-004 | Hardcoded secrets in source files | MEDIUM | Phase 1 implementation |
| TD-005 | No persistent service for sniffer or llama-server endpoints | MEDIUM | Phase 1 scope gap |
| TD-006 | WSL distro name hardcoded in capture.py | LOW | Phase 1 implementation |
| TD-007 | Kanban MAP still lists directors-forge card without CANCELLED status | LOW | Documentation gap |
| TD-008 | FastMCP 3.3.1 upgrade rolled back, kanban MCP stuck on 3.2.4 | LOW | Dependency debt |

---

## 7. Phase 1 Readiness Verdict

**Can we close Phase 1 and plan Phase 2?**

**Answer: YES, with conditions.**

Phase 1 delivered its core promise: the mesh has eyes (vision) and hands (terminal control + screen triage). The remaining items are:

1. **Must-fix before Phase 2:** LiteLLM version pin (TD-001). The CVE is unpatched and the floating tag will cause this to regress again.
2. **Should-fix but non-blocking:** Persistent services for sniffer and llama-server endpoints (TD-005). These affect reliability but not capability.
3. **Can defer:** Key-based SSH, latency optimization, sniffer tests, secret hygiene. These are quality-of-life improvements that do not block Phase 2 planning.

**Recommended closure criteria for Phase 1:**
1. Pin LiteLLM Docker image to v1.84.0+ and verify
2. Update CHANGELOG to reflect actual version
3. Archive or delete mesh_proxy.py
4. Mark Phase 1 as CLOSED in IMPLEMENTATION_PLAN.md with open items documented as known tech debt

---

## 8. Recommended Actions (Prioritized)

1. **[P0] Pin LiteLLM Docker image** to a specific version tag. Verify the running container matches. Update CHANGELOG.
2. **[P1] Move secrets to environment variables** in sniffer and mesh config files. Add `.env` to `.gitignore`.
3. **[P1] Archive mesh_proxy.py** to a `legacy/` directory or delete it. Document that LiteLLM is the sole router.
4. **[P2] Write sniffer tests** -- at minimum, test that capture.py handles PowerShell failures gracefully.
5. **[P2] Create sniffer systemd service** if persistent monitoring is desired. Otherwise document as on-demand.
6. **[P3] Update KANBAN_MAP.md** to mark directors-forge card as CANCELLED (not just deprioritized).
7. **[P3] Add FastMCP 3.3.1 upgrade** to Phase 2 or Phase 3 backlog (import compatibility fix).

---

::/5Y573M-N071C3 : AUDIT_V1_PHASE1. EVIDENCE_BASED. NO_RUBBER_STAMP. // 50V3R31GN-M4CH1N4
