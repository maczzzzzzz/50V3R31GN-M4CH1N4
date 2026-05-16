# CHANGELOG: 50V3R31GN-M4CH1N4

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

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
  - mesh-function-calling (Node C): Live, 108.7 t/s prompt, 56.6 t/s gen
  - mesh-heavy (Node D): Live, 8.2 t/s prompt, 7.2 t/s gen (MoE 35B expected)
  - mesh-fast (Node B): Server down, needs restart (Windows llama-server on 10.0.0.11:8081)

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
  - Verified 3 model groups configured and functional:
    - `mesh-fast`: Node B (Hermes-4-14B Q4_K_M, 8.4GB, Vulkan)
    - `mesh-function-calling`: Node C (Carnice-9B-FC Q4_K_M, Qwen3.5 hybrid SSM+attn)
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
