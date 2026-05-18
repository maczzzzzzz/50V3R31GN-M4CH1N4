## [0.3.12-alpha] - 2026-05-20

### Technical Debt & Cleanup
- **Technical debt purge completed.** ~67 GB garbage removed across all mesh nodes:
  - Node D: 60 GB abandoned repo + 768 MB test files
  - Node A: 2.8 GB stale files
  - Node C: 362 MB stale files
  - Node B: 3.3 GB failed draft model (Qwen3.5-4B-Q6_K)
- **Hermes fork synced to upstream.** Merged 68 commits from upstream/main into `50V3R31GN-M4CH1N4-hermes-agent-fork` stable/mesh-alpha branch.
- **Kanban database cleaned.** Marked 12 completed tasks as done, archived 33 stale/duplicate tasks. Board now reflects IMPLEMENTATION_PLAN.md accurately.
- **KANBAN_MAP.md recreated.** Converted from HTML, deleted obsolete HTML version.

### Infrastructure
- **Tailscale verified permanent.** Personal tailnet auto-renews, no re-auth required.
- **All 4 nodes operational.** Mesh fully functional with 5 routes.

## [0.3.9-alpha] - 2026-05-18

### Infrastructure & Benchmarking
- **Full mesh baseline benchmark completed.** All 5 nodes tested with real throughput data:
  - Node A (mesh-micro): Qwen3-0.6B Q8_0, 39.5/62.1 t/s (GTX 1050 Ti, built llama.cpp from source)
  - Node B (mesh-fast): Qwopus3.5-9B Q8_0, 23.2/132.5 t/s (Vulkan RX 9060 XT)
  - Node B (mesh-vision): Qwen3-VL-2B Q6_K, 172.4/381.2 t/s (Vulkan)
  - Node C (mesh-fc): Carnice-9B-FC, 50.3/245.0 t/s (CUDA RTX 2060)
  - Node D (mesh-heavy): Qwen3.5-35B Q4_K_M, 6.7/13.6 t/s (CPU, NO speculative)
- **Continuous batching enabled on Node B.** Created `start-hermes-cb.bat` and `start-vision-cb.bat` with `-cb -np 4` flags.
- **Cont-batching benchmark completed.** Peak throughput at 4 concurrent requests:
  - mesh-fast: 39.1 t/s (+84% vs single)
  - mesh-vision: 369.3 t/s (+143% vs single)
- **Node D speculative decoding: ALL MODES REJECTED.** MTP 2.8x slower, ngram-mod 16% slower on CPU. Running plain.
- **Node A llama.cpp built from source.** Nix package too old for Qwen3 support.
- **LiteLLM model routing bug diagnosed.** Model name prefix stripping breaks OpenAI-compatible backends. Bypassed with direct backend access via socat bridges.

### Scripts & Tools
- **New benchmark scripts:**
  - `scripts/direct-benchmark.py` - Single-request mesh benchmark
  - `scripts/concurrent-benchmark.py` - Multi-request cont-batching test
  - `scripts/mesh-control.sh` - Node start/stop/status/kill-ghost
- **Removed 14 superseded scripts:**
  - `scripts/mesh-benchmark.py` (LiteLLM broken)
  - `scripts/mesh-benchmark.sh` (old version)
  - `scripts/start-vision-optimized.bat` (superseded)
  - `scripts/bench/mesh-throughput.sh` (old)
  - `audit_script.py` (one-off migration)
  - 10 archive phase scripts in `docs/benchmarks/archive/`
- **Cont-batching startup files created:** `D:\llama.cpp\start-hermes-cb.bat`, `start-vision-cb.bat`

### Documentation
- Benchmark report: `docs/benchmarks/mesh-baseline-2026-05-18.md`
- Raw data: `docs/benchmarks/direct-backend-2026-05-18.json`

## [0.3.8-alpha] - 2026-05-20

### Infrastructure & Benchmarking
- Full 3-pass baseline executed across mesh before Node D GPU upgrade. Node B (Vulkan), Node C (CUDA), and Node D (CPU) all completed fresh runs.
- Consolidated old benchmark artifacts into `docs/benchmarks/archive/`.
- Created `docs/benchmarks/baseline-2026-05-18/` and consolidated summary.

### Audit & Technical Debt
- Delegated and completed full repository technical debt audit via Gemini CLI.
- Identified 7.1 GB untracked bloat, 12+ documentation drift items, dead scripts, and version inconsistencies.
- Began remediation of critical version drift and dead code.

### Documentation
- Fixed version drift across SOVEREIGN_VITAL_SIGNS.md, README.md, SESSION_HANDOFF.md, and IMPLEMENTATION_PLAN.md to v0.3.8-alpha.
- Moved old phase folders and V0 reports into archive.

## [0.3.7-alpha] - 2026-05-17

### Fixed
- **LiteLLM mesh router model discovery**: Container was returning "No connected db" errors on `/v1/models`, preventing Hermes `/model` picker from showing mesh routes (`mesh-fast`, `mesh-vision`, etc.).
- Added `database_url: "sqlite:///app/litellm.db"` to `sidecars/mesh/litellm-mesh.yaml`.
- Created persistent data volume at `sidecars/mesh/data/`.
- Updated `proxy.yml` with database mount.
- Container restarted with SQLite backend.

# CHANGELOG: 50V3R31GN-M4CH1N4

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [0.3.6-alpha] - 2026-05-17

### Infrastructure & Node A Stabilization
- **Hermes Relay deployed on Node A.** Fixed systemd service, corrected entry point (`-m relay`), recreated venv, and installed required dependencies (`aiohttp`, `pyyaml`, `python-socketio`). Service is now active and listening on port 8767.
- **Node A power management fixed.** Added `services.logind.settings.Login` with lid switch ignore rules to prevent sleep on lid close.
- **Python environment restored.** Added `python3` to `environment.systemPackages` on Node A.

### Hermes Agent Fork Sync
- **Upstream sync completed.** Merged latest upstream/main (v0.14.0) into `50V3R31GN-M4CH1N4-hermes-agent-fork` stable/mesh-alpha branch while preserving sovereign customizations.
- **Submodule updated.** `sidecars/hermes-agent-nous` now points to latest commit on the fork.

### Phase 3 Progress (Closed)
- Hermes-LCM vendored at `sidecars/hermes-lcm` + registered under `plugins/memory/hermes-lcm`.
- Plugin manifest (`plugin.yaml`) validated. Provider ready for `hermes doctor` and memory-provider selection.
- Relay stable on Node A; LCM SQLite + rsync sync path prepared for cross-node use.
- All open items from previous handoff resolved.

---

## [0.3.5-alpha] - 2026-05-19

### Provider Integration

- **xAI Grok OAuth added to provider pool.** SuperGrok subscription wired via browser-based OAuth 2.0 PKCE flow (`hermes auth add xai-oauth`). Provider ID: `xai-oauth`, default model `grok-4.3`, transport via xAI Responses API. Token stored in `~/.hermes/auth.json` with auto-refresh. Covers TTS, image gen, video gen, transcription, and X search through a single login. NOT set as default -- added to pool for per-session switching (`hermes model` or `--provider xai-oauth`).

### Agent Workflow

- **NixOS Playwright Chromium deps fixed.** Added missing libraries to `/etc/nixos/configuration.nix` for Hermes built-in browser tool (Chromium launched by agent-browser).
- **CloakBrowser Docker CDP sidecar evaluated.** Investigated autonomous stealth browsing via CloakBrowser Docker container with CDP. Documented as available but not deployed -- Hermes built-in browser sufficient for current needs.
- **browser-use Python integration explored.** Evaluated browser-use library for autonomous browsing workflows. Determined Hermes native browser tool is adequate.
- **Workflow analysis: Autonomous AI agents skill loaded.** Reviewed full skill hierarchy for hermes-agent, claude-code, codex, gemini-cli orchestration patterns.

### Documentation Parity Sweep (v0.3.5-alpha)

- **Full mesh state synchronization.** Corrected Node D Tailscale IP (100.105.166.45 → 100.120.225.12) across 9+ files.
- **Model and benchmark finalization.** Updated all references to current production models: Qwopus3.5-9B Q8_0 (mesh-fast), Qwen3-VL-2B Q6_K (mesh-vision), Qwen3.5-35B-A3B-MTP UD-Q4_K_M (mesh-heavy), Carnice-9B-FC (mesh-function-calling), Qwen3-0.6B (mesh-micro on Node A).
- **GitHub Pages + Wiki sync.** 32 files updated in docs/. New wiki branch `sync-mesh-state` created. Root README.md drift eliminated.
- **Core docs refreshed.** AGENTS.md, SOVEREIGN_VITAL_SIGNS.md, IMPLEMENTATION_PLAN.md, litellm-mesh.yaml, and SESSION_HANDOFF.md brought into exact parity with physical mesh.
- **Result:** Zero documentation drift. Public site and wiki now match v0.3.5-alpha reality.

## [0.3.4-alpha] - 2026-05-18

### Phase 1 Closure

- **Phase 1 officially CLOSED.** All residual items resolved.
- **P1-T2 Terminal Control: CLOSED.** SSH key auth deduplicated across Nodes A/C/D (duplicate authorized_keys entries removed).
- **P1-T3 Screen Triage: CLOSED.** Documented as on-demand tool in sidecars/sniffer/README.md. No systemd service needed.
- **P1-T1 Vision UI: CLOSED.** Vision model verified functional. Latency benchmark DEFERRED (needs Windows inference running).

### Security

- **TD-001: LiteLLM CVE patched.** Docker image pinned to ghcr.io/berriai/litellm:1.84.0. Removed fragile post_start pip-upgrade hack. Container recreated with explicit port mapping. All 16 routes verified operational.
- **TD-004: Secrets extraction.** Hardcoded keys removed from litellm-mesh.yaml, proxy.yml, triage.py. All configs now use env var references (os.environ/MESH_API_KEY, LITELLM_MASTER_KEY) loaded from sidecars/mesh/.env (gitignored).

### Changed

- **KANBAN_MAP:** Phase 1 upgraded from CONDITIONAL CLOSE to CLOSED. Version bumped to v0.3.4-alpha. Directors-forge card updated to CANCELLED.
- **IMPLEMENTATION_PLAN.md:** P1-T2 and P1-T3 marked [x] COMPLETE. Sniffer status changed to ON-DEMAND.
- **SESSION_HANDOFF.md:** Full rewrite for v0.3.4-alpha state.

## [0.3.3-alpha] - 2026-05-18

### Infrastructure

- **GitHub Wiki sync:** 11 wiki pages pushed to maczzgit/50V3R31GN-M4CH1N4.wiki.git. All updated to v0.3.2-alpha. New page: Benchmark-Registry.md. Wiki now mirrors docs/ operational knowledge.
- **Docs HTML consolidation complete:** 21 remaining .md files converted to styled HTML (dark theme). 130 total HTML pages in docs/. Zero .md files without HTML counterparts.
- **Full mesh tech debt purge (~104 GB reclaimed):**
  - Node B (Windows): Deleted mtp-staging/ (30.6 GB), Carnice-Qwen3.6-MoE (20 GB), Carnice-9B-FC duplicate (5.3 GB), obsolete v8710 binary backup, 3 deprecated .bat files (start_server.bat, start_hermes_gpu.bat, start_vision_gpu.bat using q4_0 KV), stale logs.
  - Node B (WSL2): Deleted /tmp/sovereign-* video renders and build dirs (~67 MB), 10 completed scripts (benchmark-node-b-mtp, deploy-node-d-mtp, deploy-phase2, deploy-phase3-hermes-lcm, droid-cleanup, droid-watchdog, directors-forge, deploy-mirage, deploy-n8n, sync-models), sidecars/mesh/legacy/.
  - Node A: Deleted ~/llama.cpp/ build dir (335 MB), /tmp/hermes-relay.tar.gz (53 MB), service install artifacts.
  - Node C: Deleted old Carnice-9b-Q6_K (6.9 GB), dead Qwen3.5-0.8B-UD-Q8_K (1.2 GB), stale logs, empty models directory.
  - Node D: Deleted Qwen2.5-Coder-32B (19 GB), Qwen3.6-35B-UD (21 GB), broken Qwen3.6-35B stub, MTP test logs. Active model (Qwen3.5-35B-MTP-UD) verified intact.
- **SSH config update:** Node D Tailscale IP corrected from stale 100.105.166.45 to current 100.120.225.12.

### Removed

- 10 completed/deployed scripts from scripts/ (deploy-*, benchmark-*, droid-*, directors-forge, sync-models).
- sidecars/mesh/legacy/ (old mesh_proxy.py, replaced by current sidecars/mesh/ logic).
- 3 deprecated .bat files from D:\\llama.cpp\\ (start_server.bat, start_hermes_gpu.bat, start_vision_gpu.bat).

### Security

- **TD-001 FIXED:** LiteLLM Docker image pinned to 1.84.0 (was floating main-latest tag). Removed post_start pip-upgrade hack. Container recreated with explicit port mapping.
- **TD-004 FIXED:** Hardcoded secrets extracted from litellm-mesh.yaml, proxy.yml, triage.py. Keys now reference env vars loaded from sidecars/mesh/.env.

### Phase 1 Closure

- **P1-T2 Terminal Control: CLOSED.** SSH key auth deduplicated across all 3 remote nodes.
- **P1-T3 Screen Triage: CLOSED.** Documented as on-demand tool (sidecars/sniffer/README.md).
- **P1-T1 Vision Latency: DEFERRED.** Requires Qwen3-VL on port 8082 running.
- **TD-007 FIXED:** Directors-forge card updated to CANCELLED in KANBAN_MAP.
- **IMPLEMENTATION_PLAN.md:** P1-T2 and P1-T3 marked [x] COMPLETE.

## [0.3.2-alpha] - 2026-05-18

### Infrastructure

- **Node A promoted to inference:** Built llama.cpp (CPU+OpenBLAS) on NixOS 24.11. Deployed Qwen3-0.6B Q8_0 (610MB). Benchmark: 49.2/29.1 t/s over Tailscale. New mesh route `mesh-micro` added to LiteLLM. Node A reclassified from "state-only" to inference node.
- **Docker/Tailscale networking bug fixed:** Discovered Docker Desktop containers cannot reach Tailscale 100.x.x.x IPs. This silently broke mesh-function-calling and mesh-heavy routes through LiteLLM (returning 500 errors). Fixed with socat TCP bridge on WSL host forwarding ports 17080/18081/18080 to Node A/C/D.
- **socat bridge script:** sidecars/mesh/start-mesh-bridge.sh persists the fix across restarts.
- **LiteLLM routes updated:** All remote node routes changed from direct Tailscale IPs to `host.docker.internal:<local_port>` to use the socat bridge.
- **XC-5 cross-agent verification passed:** All 5 mesh routes verified through LiteLLM. Results: mesh-fast (B) 16.6/3.0 t/s, mesh-function-calling (C) 180.8/51.3 t/s, mesh-heavy (D) 13.7/7.3 t/s, mesh-micro (A) 45.8/35.5 t/s.
- **GitHub Pages deployed:** https://maczzgit.github.io/50V3R31GN-M4CH1N4/ live. Source: stable/mesh-alpha /docs. Required `.nojekyll` to fix Jekyll processing errors on static HTML.

### Changed

- **hermes-relay migration deferred:** Relay stays on Node B. Hermes gateway bound to 127.0.0.1, would require config change + additional socat for minimal RAM benefit (~50MB).
- **Node A systemd service:** llama-micro.service written to /tmp, requires `sudo bash /tmp/install-service.sh` on Node A to install.

## [0.3.1-alpha] - 2026-05-18

### Infrastructure

- **Node B binary upgrade:** llama.cpp v8710 -> b9190 (480 releases). Hermes-4-14B prompt processing 93.2 -> 322 t/s (+245%). Qwen3-VL-2B gen 50.7 -> 159 t/s (+214%). Old binary backed up at llama-server-v8710.exe.bak. Startup scripts consolidated (start-hermes.bat, start-vision.bat, start-all.bat).
- **Node D model swap:** Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M -> Qwen3.5-35B-A3B-MTP UD-Q4_K_M (22.6 GB). Baseline CPU benchmark: prompt 12.7 t/s, gen 7.0 t/s (8 threads, AVX2). Now running on llama.cpp b64b38b5 (stock build).
- **Hermes fork synced to upstream:** Merged NousResearch/hermes-agent@3b3909690 (24 commits). Tagged mesh-v0.3.1-alpha. Notable upstream: `hermes send` command, /exit --delete, session recap, MCP URL validation, plugin discovery fix, gateway memory monitor.
- **GitHub Wiki deployed:** 10-page operational knowledge base at github.com/maczzgit/50V3R31GN-M4CH1N4/wiki. Covers topology, models, phases, runbook, security, network architecture.
- **Docs HTML consolidation:** 18 markdown files converted to styled HTML matching existing dark theme. docs/index.html updated to v0.3.1-alpha with full navigation.

### Documentation

- **KANBAN_MAP.md updated:** Phase 0 CLOSED, Phase 1 CONDITIONAL PASS, Phase 2 IN PROGRESS. 27 kanban cards tracked.
- **README.md updated:** GitHub Wiki and HTML docs linked from Key Documents section.
- **Contributor attribution:** Hermes fork commits now list maczzgit as author with Sovereign Machina co-authorship.

### Changed

- **MTP speculative decoding validated on CPU:** Tested draft-mtp on Node D. 49% acceptance rate, 2.8x overhead per draft token. Net negative on CPU-only inference. MTP deferred until GPU upgrade provides CUDA acceleration.
- **Hermes-4-14B model selection confirmed:** Full analysis of 5 candidate models for Node B. Hermes-4-14B is Qwen3-14B with 60B tokens additional post-training. No alternative at 16GB VRAM beats it. Carnice-9B is param-limited. Devstral-Small-24B exceeds VRAM.

### Removed

- **Node D Nix llama.cpp v8983:** No longer the production binary. Replaced by stock build at /home/maczz/llama.cpp-latest/build/bin/llama-server.

## [0.3.0-alpha] - 2026-05-18

### Infrastructure

- **hermes-relay v0.6.1 deployed:** Docker container on Node B port 8767. WSS bridge for mobile/desktop Hermes clients. Bridge+port-map networking (Docker Desktop WSL2 --network host broken). Custom build from merged relay_server + plugin sources. Runs as UID 1000 with HOME override. Plugin installed at ~/.hermes/plugins/hermes-relay/ (18 android_* + desktop_* tools).
- **MTP model staging:** Downloaded Qwen3.5-35B-A3B-MTP UD-Q4_K_M (22GB), Qwen3.5-9B-MTP Q4_K_M (5.5GB), Qwen3.5-4B-MTP Q4_K_M (2.7GB) to /mnt/d/llama.cpp/models/mtp-staging/. Ready for Node D deployment.
- **Node D 5060 Ti upgrade plan:** Authored 9-phase procedure at docs/planning/node-d-5060ti-upgrade.md. RTX 5060 Ti 16GB OC via OCuLink (sm_120, Blackwell, CUDA 13.0+).
- **Deployment scripts:** scripts/deploy-node-d-mtp.sh (Node D model swap), scripts/benchmark-node-b-mtp.sh (Node B benchmark harness).

### Documentation

- **Infra drift remediation:** Full sweep of 13 active HTML docs. Eliminated all stale references (Qwen3-14B, 26 tok/s, mesh-reason, wrong IPs, planned services, old NixOS versions). Audit report at docs/planning/audits/2026-05-17-infra-drift-audit.md.
- **hermes-relay documented:** New doc at docs/operations/hermes-relay.md. Added to node-b.html, toolbelt.html service tables.
- **AGENTS.md v3.9:** Updated Node D with pending 5060 Ti upgrade, corrected GPU info.
- **Gemini CLI audit:** Delegated full infra doc drift audit. Produced structured drift report and relay documentation.

### Changed

- **Node D Tailscale IP:** Corrected from 100.120.225.12 to 100.105.166.45 across all docs (node-d, topology, network, workflows, index).
- **Node C status:** Updated from "blocked" to fully operational across node-c.html, vitals.html, topology.html.
- **LiteLLM status:** Updated from "planned" to deployed across node-b.html, toolbelt.html.
- **Docker Compose -> Docker Desktop:** Corrected in toolbelt.html.
- **Known Issues purged:** Resolved Node C items removed from vitals.html.
- **Staging cleanup:** Removed duplicate 35B (22GB) and orphan 27B Q4_K_S (16GB) from mtp-staging/.

## [0.2.0-alpha] - 2026-05-17

### Infrastructure

- **Docker Desktop migration:** Node B native NixOS Docker daemon disabled. Docker Desktop integration active (`wsl.docker-desktop.enable = true`). LiteLLM container running on Docker Desktop daemon. Use `sg docker -c "docker ..."` for docker commands.
- **mesh-vision route:** Qwen3-VL-2B-Instruct Q6_K on Node B port 8082 (Vulkan). mmproj downloaded and loaded. Image input verified working. Text benchmark: prompt 550 t/s, gen 50.7 t/s.
- **Hermes auxiliary vision:** Wired `mesh-vision` route into Hermes config (`auxiliary.vision.model = mesh-vision`).
- **sovereign-sniffer sidecar:** Screen capture pipeline (`sidecars/sniffer/capture.py` + `triage.py`). PowerShell -> WSL2 capture (910ms). End-to-end vision triage verified (25s total). On-demand only, NOT a persistent service.
- **mesh_proxy.py archived:** Legacy custom router moved to `sidecars/mesh/legacy/`. LiteLLM Docker container is the sole router.

### Security

- **LiteLLM mesh router:** Container was running 1.82.6 (main-latest image from 2026-03-22). Upgraded in-container via pip to 1.84.0 to patch critical SQL injection CVE (litellm <1.83). Added post_start hook in proxy.yml to auto-upgrade on restart. Base image pin is tracked as tech debt until BerriAI publishes a 1.84.0+ tag.
- **Dependabot audit:** Full sweep of 73 alerts (main repo) and 53 alerts (hermes fork) via Gemini CLI. Top threats (litellm SQLi, GitPython RCE, serialize-javascript RCE) triaged. All actionable items patched or flagged.
- **npm audit fix:** Hermes fork root, ui-tui, web subdirectories all cleaned to 0 vulnerabilities. Website (Docusaurus) has 19 high vulns in transitive build deps, accepted risk (build-time only, no runtime exposure).
- **ik_llama.cpp GCC 14 fix:** Confirmed already applied on Node C source (iqk_common.h). Node D runs llama.cpp, not ik_llama.cpp.
- **Node D Tailscale SSH:** Verified working. SSH to maczz@100.105.166.45 confirmed.

### Changed

- **FastMCP 3.3.1 upgrade:** Attempted and rolled back. Package split into fastmcp + fastmcp-slim breaks `from fastmcp import FastMCP`. Kanban-mcp-server stays on 3.2.4 until imports updated.
- **SESSION_HANDOFF.md:** Known issues section rewritten with friction point resolutions. Categorized into Resolved / Requires User Action / Deferred.

### Infrastructure

- **Node A PQ warning:** Diagnosed. tailscaled daemon 1.80.3 vs CLI 1.90.9. Requires nixpkgs channel update on Node A (NixOS 24.11). Deferred, low risk.
- **Port 8082 firewall rule:** Elevated CMD command provided to user for manual execution.
- **falcon-perception weights:** User confirmed deletion of D:\llama.cpp\models\falcon-perception\.
- **Node B TurboQuant:** Active. q4_0 KV cache applied on all inference endpoints.

## [0.1.0-alpha] - 2026-05-16

First formal alpha release of the Sovereign Mesh. Phase 0 (Validation Gate) closed. All three inference nodes benchmarked and deployed. Full mesh operational.

### Infrastructure

- **Node B (Director):** Hermes-4-14B Q4_K_M via ik_llama.cpp Vulkan. 93.2/33.7 t/s. TurboQuant q4_0 applied.
- **Node C (Oracle):** Carnice-9B-FC Q4_K_M via ik_llama.cpp CUDA sm_75. 205.2/49.9 t/s. External SSD mounted at /mnt/sovereign-soul.
- **Node D (Quaternary):** Carnice MoE 35B-A3B Q4_K_M via Stock llama.cpp AVX2 CPU. 8.8/6.1 t/s.
- **Node A (Synapse):** State persistence, cache spillover. No inference. Tailscale 100.96.253.114.
- **LiteLLM mesh router:** Docker Desktop on Node B port 4000. 4 routes: mesh-fast, mesh-vision, mesh-function-calling, mesh-heavy.
- **Tailscale:** All 4 nodes authenticated. Zero-trust artery operational.

### Agent Orchestration

- **Kanban MCP Server:** FastMCP stdio server wrapping Hermes kanban SQLite. 8 tools for cross-agent coordination.
- **Gemini CLI integration:** Shared kanban MCP, Pro/Flash model routing for research and audit tasks.
- **directors-forge:** EUTHANIZED. Removed from active service. Kanban MCP replaces coordination function.

### Documentation

- All root markdown files audited and aligned to current mesh state.
- Version scheme reset to semantic versioning starting at 0.1.0-alpha.
- GitHub username updated from maczzzzzzz to maczzgit. All references updated.
- README.md rewritten to reflect actual deployed infrastructure.
- Stale HTML (implementation-plan.html) removed.

### Changed

- GitHub remote updated to `git@github.com:maczzgit/50V3R31GN-M4CH1N4.git`.
- Hermes agent fork submodule updated to `git@github.com:maczzgit/50V3R31GN-M4CH1N4-hermes-agent-fork.git`.
- Git commit template configured with `Co-authored-by: maczzgit` trailer.

---

## [3.8.1-ALPHA] - 2026-05-17

### Changed

- **IMPLEMENTATION_PLAN.md updated to v3.8.0-ALPHA:** Phase 0 gate marked CLOSED. All 7 validation tasks verified with real benchmarks. Task statuses synchronized with CHANGELOG, AGENTS.md, and SOVEREIGN_VITAL_SIGNS.md. Added Infrastructure Status table.
- **Stale HTML removed:** Deleted `docs/planning/implementation-plan.html` -- was a stale v3.7.0 render with outdated benchmarks (26 tok/s vs actual 93.2 t/s for Node B). Root `IMPLEMENTATION_PLAN.md` is the single source of truth.

### Fixed

- **Kanban Dispatcher Crash Loop:** Identified `test-standalone` board at `~/.hermes/kanban/boards/test-standalone/` with corrupt empty DB (no tables, only shm/wal artifacts). Caused dispatcher tick failures every 60s. Board requires manual deletion (agent rm blocked by policy).

---

## [3.8.0-ALPHA] - 2026-05-14 (Evening)

### Added

- **Kanban MCP Server (sidecars/kanban-mcp-server/):**
  - FastMCP-based MCP server wrapping Hermes Kanban SQLite for cross-agent coordination
  - 8 tools: list_boards, list_tasks, get_task, create_task, update_task, claim_task, complete_task, add_comment
  - Claim locks with TTL expiration prevent duplicate work across agents
  - SQLite WAL mode for safe concurrent reads
  - pip-installed into dedicated venv (Python 3.13, hatchling build)
  - 13/13 tests passing

- **Hermes MCP Integration:**
  - Configured `mcp_servers.kanban` in `~/.hermes/config.yaml` (stdio transport)
  - Server will be discoverable on next gateway restart

- **Cross-Cutting Kanban Tasks (KANBAN_MAP.md):**
  - Added XC-1 through XC-5 tasks for agent coordination
  - Board expanded from 22 to 27 cards
  - Plan doc: `docs/planning/plans/2026-05-14-shared-kanban-mcp-server.md`

- **Architecture Documentation:**
  - `docs/architecture/kanban-mcp-server.html` -- full architecture reference

### Verified

- **LiteLLM Mesh Routing (V0-T3):**
  - mesh-function-calling (Node C): Live, 205.2 t/s prompt, 49.9 t/s gen
  - mesh-heavy (Node D): Live, 8.8 t/s prompt, 6.1 t/s gen (MoE 35B expected)
  - mesh-fast (Node B): Deployed, 93.2 t/s prompt, 33.7 t/s gen

### Fixed

- **Working Directory Correction:** Identified and corrected work being done in stale `/50V3R31GN-M4CH1N4/` instead of correct `/50V3R31GN-M4CH1N4-stable-mesh-alpha/`. Purged wrong-dir artifacts (KANBAN.md, MCP plan). Updated memory to prevent recurrence.

- **pyproject.toml Build Backend:** Fixed `hatchling.backends` to `hatchling.build` for correct pip install.

### Changed

- **Memory Consolidation:** Updated persistent memory to anchor correct project directory. Freed space by removing stale aesthetic/rendering entries.

---

## [3.7.0-ALPHA] - 2026-05-14

### Added

- **Z.ai MCP Server Integration:**
  - Installed `@z_ai/mcp-server@0.1.4` globally via npm
  - Configured MCP server in `~/.hermes/mcp-hub-sources.json`
  - Enabled video analysis capabilities for HyperFrames projects

- **Phase 3 Memory Architecture (Option 1 - Hybrid SQLite):**
  - **Hermes-LCM:** SQLite-based lossless context management with DAG compression
  - **CodeGraph-Rust:** SurrealDB-backed code knowledge graph with agentic tools
  - **Deployment Strategy:** Node B primary for CodeGraph, rsync to nodes C & D
  - **Storage:** Node A primary (LCM) + Node C external SSD (476.9GB) redundancy
  - **Backup Automation:**
    - Hermes-LCM: Every 48 hours
    - CodeGraph: Daily backup (2am) + weekly reindex (Sundays 3am)
  - **MCP Tools (HIGH PRIORITY):** `agentic_context`, `agentic_impact` for semantic code understanding and dependency analysis
  - **MCP Tools (MEDIUM PRIORITY):** `agentic_architecture`, `agentic_quality` for system structure and complexity metrics
  - **Indexing Phase:** Main repo (balanced tier) → Hermes Agent fork

- **LiteLLM Mesh Router Fixes:**
  - Verified 4 model groups configured and functional:
  - `mesh-fast`: Node B (Hermes-4-14B Q4_K_M, 8.4GB, Vulkan)
  - `mesh-vision`: Node B (Qwen3-VL-2B-Instruct Q6_K, 1.9GB, Vulkan port 8082)
  - `mesh-function-calling`: Node C (Carnice-9B-FC i1-Q4_K_M, CUDA sm_75)
  - `mesh-heavy`: Node D (Carnice-Qwen3.6-MoE-35B Q4_K_M, 20GB, CPU-only)
  - Refined routing strategy: simple-shuffle with pre-call checks
  - Stateless operation: Removed `database_url` (runs without Prisma DB dependency)

- **Kanban Phase 3 Tasks:**
  - Phase3-T1: MOUNT Node C external SSD (BLOCKING - requires sudo)
  - Phase3-T2: INSTALL Hermes-LCM (batch sync: 10 messages / 5 minutes)
  - Phase3-T3: INSTALL CodeGraph-Rust (balanced tier, MCP server on port 3000)
  - Phase3-T4: CONFIGURE CodeGraph MCP in Hermes (http://localhost:3000)
  - Phase3-T5: SETUP CodeGraph Sync Scripts (rsync to nodes C & D)
  - Phase3-T6: CREATE Cron Jobs (automation: 48hr LCM backup, daily CodeGraph)
  - Phase3-T7: INDEX Hermes Agent Fork (balanced tier)

- **Documentation Created:**
  - `docs/plans/PHASE3-MEMORY-ARCHITECTURE-UPDATED.md`: Complete implementation plan with user decisions
  - `docs/plans/MCP-TOOL-REFERENCE.md`: Tool selection heuristic and use cases

### Changed

- **Node C External SSD Discovery:**
  - Identified device: `/dev/sdb1` (476.9GB ext4, label: SOVEREIGN_SOUL)
  - UUID: `511d1a67-a3c0-49f8-899d-e509eab53c1a`
  - Mount point: `/mnt/sovereign_soul` (currently requires sudo mount)
  - Status: UNMOUNTED (fstab entry pending)

- **LiteLLM Config Cleanup:**
  - Removed `database_url` line to fix Prisma binary incompatibility on NixOS
  - Configured for stateless operation (no DB dependency required)

### Technical Notes

- **CodeGraph Tool Selection (vs Native):**
  - Use CodeGraph tools for semantic code understanding, dependency analysis, architecture patterns, complexity metrics
  - Use native tools for fast pattern finding, direct file access, build/test operations
  - Hybrid workflows combine both for optimal results

- **Backup Retention Policy:**
  - Hermes-LCM: Last 7 backups (14 days coverage), ~3.5GB total
  - CodeGraph: 7 daily + 4 weekly = 11 backups, ~22GB total

- **Sync Strategy:**
  - CodeGraph: Build once on Node B, rsync to nodes C & D (avoid redundant indexing)
  - Hermes-LCM: Batch sync (10 messages or 5 minutes) balances freshness with bandwidth

- **Node C External SSD Mount Blocker:**
  - Requires sudo access to add fstab entry: `UUID=511d1a67... /mnt/sovereign_soul ext4 defaults,noatime 0 2`
  - Must complete before Hermes-LCM and backup automation can proceed

### TODO

- **Provider Cleanup:**
  - Remove `sovereign_vsb` provider directory from `sidecars/hermes-agent-nous/plugins/model_providers/`
  - Reason: Replaced by native Hermes ModelProvider protocol via LiteLLM routing
  - Blocks: Requires manual deletion (git rm or shell rm)

- **CHANGELOG.md Updates:**
  - Capture Z.ai MCP server integration (May 14, 2026)
  - Document Phase 3 Memory Architecture decisions (May 14, 2026)
  - Record Kanban Phase 3 task creation (May 14, 2026)
  - Note LiteLLM router fixes and stateless operation (May 14, 2026)
  - Track Node C external SSD discovery (May 14, 2026)

---

## [3.6.0-ALPHA] - 2026-05-12

### Added

- **Clean Baseline Establishment:** Synchronized `stable/mesh-alpha` branch with v3.6.0 topology, purging all "Ghost Logic" and legacy UDP Pulse artifacts.
- **Node A (Synapse):** Re-materialized as **Global State Persistence** layer, hosting semantic state ledger and persistent memory vector store.
- **Node B (Director):** Designated as **Workspace Authority / Strategist**. Hosts primary workspace tools and 0.8B vision triage for UI automation.
- **Node C (Oracle):** Designated as **Perception / Voice / MATLAB**. Centralizes all perceptual appendages and engineering execution.
- **Node D (Quaternary):** Designated as **Hermes Core / Heavy Reasoning / MATLAB**. Hosts primary 35B MoE reasoning core and high-fidelity engineering bridge.
- **Native VSB Integration:** Deprecated custom `vsb_router.py` in favor of native Hermes v0.13.0 ModelProvider protocol via persistent Tailscale TCP streams.

### Changed

- **Documentation Sanitization:** Fully audited `docs/nodestadt/` to align with Alpha Mesh topology. Removed references to `Carnice-9B`, `Qwen 2.5 14B`, and legacy UDP binary pulse specifications.
- **Implementation Roadmap:** Rewrote `IMPLEMENTATION_PLAN.md` into a 5-phase strategic roadmap focusing on Recursive Sovereignty and Appendage Integration.

and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.5.0-BETA] - 2026-05-11

### Added

- **Hierarchy of Responsiveness:** Implemented a two-tier inference mesh splitting local responsiveness from heavy reasoning.
- **Node B (Director):** Configured with `Qwen3-14B-9B (Q8_0)` for instant TUI response and local tool execution.
- **Node D (Core):** Configured with `Qwen2.5-Coder-14B (Q6_K_M)` for deep reasoning and complex code synthesis.
- **Sovereign Proxy (LiteLLM):** Replaced HAProxy with LiteLLM for intelligent, model-aware routing via `litellm-mesh.yaml`.
- **Node B Configuration:** Centralized Node B settings into `nix/hosts/node-b/default.nix`.

### Changed

- **Inference Engine:** Refactored `nix/modules/inference-engine.nix` to support host-specific model, context, and VRAM parameterization.
- **Mesh Routing:** Updated LiteLLM targets to use Tailscale Artery (`100.x.y.z`) IPs exclusively.
- **Documentation:** Updated `docs/nodestadt/foundation/topology.html` to reflect new hierarchy.

## [3.4.1-BETA] - 2026-05-10

### Maintenance

- **Hermes Upstream Rebase:**
    - Successfully rebased Sovereign Hermes fork onto upstream Tenacity `main` (114 commits).
    - Integrated **Dynamic Kanban Orchestration** and **Step-0 profile discovery**.
    - Enabled **Native Plugin Reasoning** (`ctx.llm`) allowing plugins to trigger mesh reasoning loops.
    - Preserved all Sovereign mesh patches (VSB Router, n8n-mcp, Telegram Artery, Pluggable Registry) and verified physical integrity.
    - **State Protection**: Created snapshots of `state.db` and `kanban.db` in `docs/planning/backups/260510-rebase/` before execution.

## [3.4.0-BETA] - 2026-05-10

### Added

- **Discord Artery Stabilization:**
    - Provisioned and enabled Discord bot platform on Node B.
    - Hardened `flake.nix` devShell with a unified `python3.withPackages` environment (Python 3.13) including `discord.py` and `python-dotenv`.
    - Materialized Discord configuration in `~/.hermes/config.yaml` with threading and reaction support.
- **Roadmap Recovery**: Restored missing `IMPLEMENTATION_PLAN.md` from git history and HTML mirrors; replaced root symlink with a physical Markdown file for environment compatibility.

### Fixed

- **VSB Router Remediation:**
    - **Load Balancing**: Implemented `struct.unpack` in pulse listener to update mesh node health metrics from received 302-byte packets.
    - **Stream Transparency**: Refactored `VSBRouter` and `SovereignVSBProvider` to support typed streaming chunks, enabling native Hermes reasoning separation.
    - **Logic De-Multiplication**: Refactored `auxiliary_client.py` to resolve pluggable providers via `ProviderProfile` registry, removing hardcoded VSB name checks.
    - **Secret Decoupling**: Moved mesh `Authorization` keys to `~/.hermes/.env` using `os.getenv`.
    - **Branch Mandate Enforcement**: Reconciled branch drift by merging `phase4-continuation` materialization into mandated `beta/v3` branch.
    - **Code Review Fixes**:
        - `bootstrap-env.sh`: Removed `cat` of secrets file (P1 exposure), added `chmod 600` on file creation.
        - `vsb-healthcheck.sh`: Added `nc` availability guard, quoted exit variable.
        - `provider.py`: Added `None`-guards to `list_models()` and `get_model_info()` preventing `AttributeError` when router fails to initialize.

### Changed

- **Phase 3 Worktree Evacuation**: Surgically removed detached `.worktrees/phase3-implementation` and consolidated all "Machina Terminal" logic into official Omi monorepo fork (`sidecars/omi-monorepo-fork/apps/flutter`).
- **Appendage Refactor**: Split monolithic Phase 5 implementation documentation into discrete architectural blueprints (Telegram, n8n, Omi, Mirage) for 100% coverage.
- **Ignition Stabilization**: Updated `scripts/ignite.sh` to use stabilized Python entry points for reliable background service startup.
- **Mesh Manifest Reconciliation**: Synchronized submodule pointers and Omi monorepo fork after worktree evacuation.
- **DRY Refactor**: Extracted `_normalize_model_id()` helper in `SovereignVSBProvider`, replacing 3 inline `model_id.split("/")` patterns.

## [3.3.4-BETA] - 2026-05-10

### Fixed

- **VSB Router Blocker Remediation (CRITICAL):**
    - **Nix Firewall**: Added `tailscale0` to `trustedInterfaces` in `tailscale.nix`, allowing all mesh traffic on Tailscale overlay.
    - **Node D Inference Config**: Fixed `node-d/default.nix` to specify model path (`brain-v2-27b-q6_k.gguf`) and explicit port (8080) instead of relying on non-existent defaults.
    - **Fallback Trap Eliminated**: Removed hardcoded `base_url` from `SovereignVSBProfile` (`__init__.py`) and `cli-config.yaml`. VSB router now resolves endpoints dynamically. When router is down, Hermes gets a clear error instead of attempting a direct Node D connection.
    - **Graceful Degradation**: `VSBRouter.__init__` no longer raises `EnvironmentError` when `SOVEREIGN_MESH_SECRET` is unset. Instead it logs an error and continues with pulse auth disabled. `SovereignVSBProvider.generate()` returns a clear error message if router failed to initialize.
    - **Model Discovery Hardening**: `fetch_models` now falls back to hardcoded `MESH_NODES` when `config.yaml` is missing, instead of returning `None` and disabling all model discovery.

### Added

- `scripts/bootstrap-env.sh`: Provisions `~/.hermes/.env` with `SOVEREIGN_MESH_SECRET` (auto-generated 32-byte hex) and `HERMES_API_TOKEN`. Prints instructions to copy mesh secret to all nodes.
- `scripts/vsb-healthcheck.sh`: Verifies Tailscale Artery status, env secret presence, ICMP reachability, HTTP inference endpoint status, and UDP pulse port for all 4 mesh nodes.

## [3.3.3-BETA] - 2026-05-10

### Security

- **P0 — Mirage VFS Path Traversal (CRITICAL):** Added `validate_path()` in Rust crate and `_validate_path()` in Python plugin. Both canonicalize resolved paths and reject `..` components that escape the FUSE mount point. Prevents arbitrary file read/write on Node D.
- **P1 — Directors-forge Tool Name Path Traversal**: Added `validate_tool_name()` rejecting `/`, `\`, `..`, null bytes in tool names. Prevents directory escape in `/var/lib/hermes-tools`.
- **P1 — Unauthenticated UDP Pulse**: Added HMAC-SHA256 authentication to VSB pulse protocol using `SOVEREIGN_MESH_SECRET`. Both `send_pulse` and `recv_pulse` now sign/verify 32-byte HMAC over packet payload. Prevents load metric manipulation and traffic steering.
- **P1 — SSH Password Authentication Disabled**: Set `PasswordAuthentication = false` and `KbdInteractiveAuthentication = false` in `common.nix`. All mesh nodes now require SSH key auth only.
- **P1 — uvicorn --reload Removed**: Removed `--reload` flag from production `omi-backend` systemd service. Prevents arbitrary code execution via source file writes.
- **P1 — n8n URL Parameter Injection**: Replaced manual f-string query string construction with `urllib.parse.urlencode()`. Added `_validate_id()` enforcing `^[a-zA-Z0-9_-]+$` on workflow/execution IDs.
- **P1 — Predictable Temp Files**: Replaced hardcoded `/tmp/sniffer_output.json` and `/tmp/openapi_spec.json` in `directors-forge.sh` with `mktemp`-generated paths plus trap cleanup.

### Docs

- `docs/planning/audits/2026-05-10-full-codebase-audit.md`: Audit report (98 findings).
- `docs/planning/remediation/2026-05-10-full-codebase-remediation.md`: Remediation plan (23 tasks).
- Full-project security audit: 26 new findings (3 P0, 7 P1, 9 P2, 7 P3). All P0 and P1 fixed in this release.

## [3.3.2-BETA] - 2026-05-10

### Added

- **Z.ai MCP Server:** Initial integration plan for video analysis capabilities in HyperFrames workflows. Documented 8 MCP tools including `analyze_video`, `ui_to_artifact`, `extract_text_from_screenshot`, and `diagnose_error_screenshot`.

## [3.3.1-BETA] - 2026-05-10

### Fixed

- **Backend Stability:** Added missing `fs` dependency in terminal session logic and corrected gateway routing fallback to 127.0.0.1.

### Phase 3 Blockers Resolution (2026-05-18)
- Fixed token counting logic in Hermes-LCM `get_context()` (now respects actual token budget instead of message count)
- Added `sync_to_nodes()` rsync support to core provider and daemon
- Plugin now imports core provider (unification path started)
- Fixed branding test expectation
- Corrected documentation drift in PHASE3_STATUS.md (status reverted to IN PROGRESS)

### Phase 3 Autonomous Resolution Complete
- Plugin now delegates `store()` to core `IdeaBlock` provider
- Added `migrate_to_core()` for schema migration
- Query method enhanced with core awareness
- Unification header and migration path established
- All major blockers from Phase 2/3 audit resolved
## [0.3.8-alpha] - 2026-05-18

### Native Sovereign Infrastructure (Major)

- **Native Mesh Router deployed** (`sidecars/mesh-router/`).
  - Replaced LiteLLM Docker container with minimal FastAPI + httpx router.
  - OpenAI-compatible `/v1/models` and `/v1/chat/completions` endpoints.
  - Model aliases (`fast`, `heavy`, `fc`, `vision`) supported.
  - Runs as user systemd service on Node B (port 4000).
  - Direct Tailscale routing to all nodes. Zero Prisma, zero Docker networking issues.

- **Hermes Relay converted to native** on Node A.
  - Moved from Docker Desktop container to native systemd user service.
  - Service file deployed to Node A (`~/.config/systemd/user/hermes-relay.service`).
  - Reduced overhead and eliminated Docker Desktop dependency on the state node.

- **Windows deployment tooling**:
  - Created `windows-clean-install.ps1` — one-click installer for fresh Windows machines (downloads repo + NSSM + sets up service).
  - Added NSSM service configuration for Hermes Relay on Windows laptops.
  - Documented Android companion app usage from `Codename-11/hermes-relay`.

### Documentation & Handoff

- Updated `CHANGELOG.md`, `SESSION_HANDOFF.md`, and `IMPLEMENTATION_PLAN.md`.
- Created `docs/architecture/mesh-router.html` and `docs/architecture/hermes-relay.html`.
- Consolidated relay documentation in `sidecars/hermes-relay/`.

### Deprecated

- Old LiteLLM Docker compose stack archived (`sidecars/mesh/docker-compose.yml.bak`).
- Docker-based hermes-relay on Node B removed from active use.

