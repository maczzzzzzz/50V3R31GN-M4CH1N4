# CHANGELOG: 50V3R31GN-M4CH1N4
All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
## [3.6.0-ALPHA] - 2026-05-22
### Added
- **Clean Baseline Establishment:** Synchronized the `stable/mesh-alpha` branch with the v3.6.0 topology, purging all "Ghost Logic" and legacy UDP Pulse artifacts.
- **Node A (Synapse):** Re-materialized as the **Global State Persistence** layer, hosting the semantic state ledger and persistent memory vector store.
- **Node B (Director):** Designated as **Workspace Authority / Strategist**. Hosts primary workspace tools and 0.8B vision triage for UI automation.
- **Node C (Oracle):** Designated as **Perception / Voice / MATLAB**. Centralizes all perceptual appendages and engineering execution.
- **Node D (Quaternary):** Designated as **Hermes Core / Heavy Reasoning / MATLAB**. Hosts the primary 35B MoE reasoning core and high-fidelity engineering bridge.
- **Native VSB Integration:** Deprecated the custom `vsb_router.py` in favor of the native Hermes v0.13.0 ModelProvider protocol via persistent Tailscale TCP streams.

### Changed
- **Documentation Sanitization:** Fully audited `docs/nodestadt/` to align with the Alpha Mesh topology. Removed references to `Carnice-9B`, `Qwen 2.5 14B`, and legacy UDP binary pulse specifications.
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
- **Mesh Routing:** Updated LiteLLM targets to use the Tailscale Artery (`100.x.y.z`) IPs exclusively.
- **Documentation:** Updated `docs/nodestadt/foundation/topology.html` to reflect the new hierarchy.

### Fixed
- **Backend Stability:** Added missing `fs` dependency in terminal session logic and corrected gateway routing fallback to 127.0.0.1.

## [3.4.1-BETA] - 2026-05-10
### Maintenance
- **Hermes Upstream Rebase**:
    - Successfully rebased the Sovereign Hermes fork onto upstream Tenacity `main` (114 commits).
    - Integrated **Dynamic Kanban Orchestration** and **Step-0 profile discovery**.
    - Integrated **Pixel-Fidelity Vision** (raw pixel passing to vision models).
    - Enabled **Native Plugin Reasoning** (`ctx.llm`) allowing plugins to trigger mesh reasoning loops.
    - Preserved all Sovereign mesh patches (VSB Router, n8n-mcp, Telegram Artery, Pluggable Registry) and verified physical integrity.
- **State Protection**: Created snapshots of `state.db` and `kanban.db` in `docs/planning/backups/260510-rebase/` before execution.

## [3.4.0-BETA] - 2026-05-10
### Added
- **Discord Artery Stabilization**:
    - Provisioned and enabled the Discord bot platform on Node B.
    - Hardened `flake.nix` devShell with a unified `python3.withPackages` environment (Python 3.13) including `discord.py` and `python-dotenv`.
    - Materialized Discord configuration in `~/.hermes/config.yaml` with threading and reaction support.
- **Roadmap Recovery**: Restored the missing `IMPLEMENTATION_PLAN.md` from git history and HTML mirrors; replaced root symlink with a physical Markdown file for environment compatibility.

### Fixed
- **VSB Router Remediation**:
    - **Load Balancing**: Implemented `struct.unpack` in the pulse listener to update mesh node health metrics from received 302-byte packets.
    - **Stream Transparency**: Refactored `VSBRouter` and `SovereignVSBProvider` to support typed streaming chunks, enabling native Hermes `<think>` reasoning separation.
    - **Logic De-Mutilation**: Refactored `auxiliary_client.py` to resolve pluggable providers via the `ProviderProfile` registry, removing hardcoded VSB name checks.
    - **Secret Decoupling**: Moved mesh `Authorization` keys to `~/.hermes/.env` using `os.getenv`.
- **Branch Mandate Enforcement**: Reconciled branch drift by merging `phase4-continuation` materialization into the mandated `beta/v3` branch.
- **Code Review Fixes**:
    - `bootstrap-env.sh`: Removed `cat` of secrets file (P1 exposure), added `chmod 600` on file creation.
    - `vsb-healthcheck.sh`: Added `nc` availability guard, quoted exit variable.
    - `provider.py`: Added `None`-guards to `list_models()` and `get_model_info()` preventing `AttributeError` when router fails to initialize.

### Changed
- **Phase 3 Worktree Evacuation**: Surgically removed the detached `.worktrees/phase3-implementation` and consolidated all "Machina Terminal" logic into the official Omi monorepo fork (`sidecars/omi-monorepo-fork/apps/flutter`).
- **Appendage Refactor**: Split monolithic Phase 5 implementation documentation into discrete architectural blueprints (Telegram, n8n, Omi, Mirage) for 100% coverage.
- **Ignition Stabilization**: Updated `scripts/ignite.sh` to use stabilized Python entry points for reliable background service startup.
- **Mesh Manifest Reconciliation**: Synchronized submodule pointers and Omi monorepo fork after worktree evacuation.
- **DRY Refactor**: Extracted `_normalize_model_id()` helper in `SovereignVSBProvider`, replacing 3 inline `model_id.split("/")` patterns.

## [3.3.4-BETA] - 2026-05-10
### Fixed
- **VSB Router Blocker Remediation (CRITICAL)**:
  - **Nix Firewall**: Added `tailscale0` to `trustedInterfaces` in `tailscale.nix`, allowing all mesh traffic on the Tailscale overlay. Added VSB pulse port (7878/UDP) to `hermes-core.nix`. Added dynamic firewall port opening in `inference-engine.nix`.
  - **Node D Inference Config**: Fixed `node-d/default.nix` to specify model path (`brain-v2-27b-q6_k.gguf`) and explicit port (8080) instead of relying on non-existent defaults.
  - **Fallback Trap Eliminated**: Removed hardcoded `base_url` from `SovereignVSBProfile` (`__init__.py`) and `cli-config.yaml`. VSB router now resolves endpoints dynamically. When the router is down, Hermes gets a clear error instead of attempting a direct Node D connection.
  - **Graceful Degradation**: `VSBRouter.__init__` no longer raises `EnvironmentError` when `SOVEREIGN_MESH_SECRET` is unset. Instead it logs an error and continues with pulse auth disabled. `SovereignVSBProvider.generate()` returns a clear error message if the router failed to initialize.
  - **Model Discovery Hardening**: `fetch_models` now falls back to hardcoded `MESH_NODES` when `config.yaml` is missing, instead of returning `None` and disabling all model discovery.

### Added
- `scripts/bootstrap-env.sh`: Provisions `~/.hermes/.env` with `SOVEREIGN_MESH_SECRET` (auto-generated 32-byte hex) and `HERMES_API_TOKEN`. Prints instructions to copy the mesh secret to all nodes.
- `scripts/vsb-healthcheck.sh`: Verifies Tailscale Artery status, env secret presence, ICMP reachability, HTTP inference endpoint status, and UDP pulse port for all 4 mesh nodes.

## [3.3.3-BETA] - 2026-05-10
### Security
- **P0 — Mirage VFS Path Traversal (CRITICAL)**: Added `validate_path()` in Rust crate and `_validate_path()` in Python plugin. Both canonicalize resolved paths and reject `..` components that escape the FUSE mount point. Prevents arbitrary file read/write on Node D.
- **P1 — Directors-forge Tool Name Path Traversal**: Added `validate_tool_name()` rejecting `/`, `\`, `..`, null bytes in tool names. Prevents directory escape in `/var/lib/hermes-tools`.
- **P1 — Unauthenticated UDP Pulse**: Added HMAC-SHA256 authentication to VSB pulse protocol using `SOVEREIGN_MESH_SECRET`. Both `send_pulse` and `recv_pulse` now sign/verify 32-byte HMAC over packet payload. Prevents load metric manipulation and traffic steering.
- **P1 — SSH Password Authentication Disabled**: Set `PasswordAuthentication = false` and `KbdInteractiveAuthentication = false` in `common.nix`. All mesh nodes now require SSH key auth only.
- **P1 — uvicorn --reload Removed**: Removed `--reload` flag from production `omi-backend` systemd service. Prevents arbitrary code execution via source file writes.
- **P1 — n8n URL Parameter Injection**: Replaced manual f-string query string construction with `urllib.parse.urlencode()`. Added `_validate_id()` enforcing `^[a-zA-Z0-9_-]+$` on workflow/execution IDs.
- **P1 — Predictable Temp Files**: Replaced hardcoded `/tmp/sniffer_output.json` and `/tmp/openapi_spec.json` in `directors-forge.sh` with `mktemp`-generated paths plus trap cleanup.

### Docs
- `docs/planning/audits/2026-05-10-full-codebase-audit.md`: Audit report (98 findings).
- `docs/planning/plans/2026-05-10-full-codebase-remediation.md`: Remediation plan (23 tasks).
- Full-project security audit: 26 new findings (3 P0, 7 P1, 9 P2, 7 P3). All P0 and P1 fixed in this release.

## [3.3.2-BETA] - 2026-05-10
### Security
- **Command Injection Patches (CRITICAL)** — 3 crates fixed:
    - `goose-execution`: Added `DANGEROUS_CHARS` input sanitization rejecting `|&;$`><` in scripts. Removed broken `rustc --eval` executor (returns error for "rust"/"rs" language).
    - `matlab-mcp-bridge`: Added `validate_script()` rejecting single quotes and shell metacharacters. Replaced `format!("run('{}')", script)` string interpolation with safe separate `-batch` argument passing.
    - `directors-forge`: Added `shell_escape()` method for single-quote wrapping of tool commands/args in generated wrapper scripts. Replaced per-tool `Command::new("--help")` process spawn with Unix execute-bit check.
- **Hardcoded Secrets Removed**:
    - `vsb_router.py`: Removed default `"machina-sovereign-mesh-v3-secret-key"` — now requires `SOVEREIGN_MESH_SECRET` env var (raises `EnvironmentError` if unset).
    - `deploy-n8n.sh`: Removed `:-sovereign-machina` default password — now requires explicit `N8N_PASSWORD` env var.
- **Nix Hardening**:
    - `hermes-core.nix`: Removed `wheel` from Hermes user groups (was granting full sudo).
    - `inference-engine.nix`: Parameterized hardcoded `User = "maczz"` into configurable `services.ik-llama.user` option (default: `nixos`).
    - `common.nix`: Added security warning comment on SSH password authentication.

### Fixed
- **Runtime Crashes**:
    - `bot_coordinator.py`: Fixed `NameError` — `session_id` was undefined in `finally` block, changed to `session.session_id`. Sessions were never evicted, causing unbounded memory leak.
    - `vsb_router.py`: Fixed `start_pulse_sync()` blocking Hermes agent startup forever — replaced `asyncio.new_event_loop().run_until_complete()` infinite loop with `threading.Thread(daemon=True)`.
- **Broken Functionality**:
    - `zeroboot-isolation`: Fixed PID tracking — Firecracker doesn't output PID to stdout. Changed from `.output()` (blocks until VM exits, PID always None) to `.spawn()` (immediate PID capture). Replaced `kill -0` fork+exec per-second with zero-fork `/proc/{pid}/stat` check (5s interval). Added `libc` dependency for `libc::kill` SIGTERM.
    - `consensus-alignment`: Replaced fake consensus (substring matching + always-true ledger) with honest stub documentation. Added typed `ConsensusAction` enum (Block/Warn/Log).
    - `vibevoice-asr`: Documented hardcoded `confidence: 0.95` as TODO.
    - `voxcpm-tts`: Replaced fabricated `duration_ms = text.len() * 100` with `0` + TODO for real metadata reading.

### Changed
- **Python Plugin Quality**:
    - `psy-core/hook.py`: Replaced fake cryptographic signatures (`sha256(name)[:8]`) with simple `frozenset` tool allowlist. Replaced `print()` + bare `except:` with `logging` module and specific exception types. Added `FileHandler` for audit logging.
    - `streaming_handler.py`: Removed dead `reasoning_steps`, `step_count`, `THOUGHT_DELIMITER` fields. Replaced hacky `__import__("collections").deque()` with proper import. Batched `feed_tokens()` instead of per-character calls.
    - `hermes-lcm/provider.py`: Fixed `[::-max_tokens:]` returning every Nth element (changed to `[-max_tokens:]`). Replaced `print()` with `logger.error()`. Added persistent SQLite connection (`_get_conn()`) instead of per-operation connect/close.
    - `mirage-vfs/vfs_bridge.py`: Moved `import base64`, `import subprocess` from function bodies to module level.
- **Rust Crate Quality**:
    - `pretext-core/lib.rs`: Added `ffi_str()` safe wrapper with null pointer and UTF-8 validation for all FFI functions (was using `unsafe { from_utf8_unchecked }` on raw pointers).
    - `pretext-core/virtualization.rs`: Removed dead `buffer_size` field and `#[allow(dead_code)]`. Renamed `calculate_virtual_height` to `initial_visible_range` (accurately reflects always-starts-from-0 behavior).
    - `pretext-core/ascii_mapper.rs`: Deduplicated `ASCII_BRIGHTNESS_PALETTE` (56→49 entries, removed 7 duplicate chars).
    - `vibevoice-asr`: Const-ified `POSITIVE_WORDS` and `NEGATIVE_WORDS` arrays (were allocating `Vec` per call). Switched to `to_ascii_lowercase()`.
- **Shell Script Hardening**:
    - `deploy-mirage.sh`, `deploy-phase2.sh`, `ignite.sh`: Upgraded `set -e` to `set -euo pipefail`. Quoted variable expansions in SSH/rsync calls.
    - `semantic-shift.sh`: Replaced per-file `nix-shell -p pandoc` with single nix-shell processing all files via temp file list.

### Added
- **Code Reuse & Architecture**:
    - `scripts/lib/deploy-common.sh`: Shared deployment utility library with `ssh_exec()`, `scp_to_node()`, `wait_for_health()`, `ssh_batch()`, and logging functions.
    - `scripts/build-ik-llama.sh`: Unified parameterized build script replacing near-identical `node-b-build-ikllama.sh` and `node-d-build-ikllama.sh`.
    - `scripts/sync-models.sh`: Unified parameterized model sync script replacing near-identical `sync-to-node-c.sh` and `sync-to-node-d.sh`.
    - `flake.nix`: Added `buildSovereignCrate` helper function for DRY Rust crate package definitions.

### Docs
- `docs/planning/audits/2026-05-10-full-codebase-audit.md`: Full codebase audit report (98 findings across Code Reuse, Code Quality, Efficiency).
- `docs/planning/plans/2026-05-10-full-codebase-remediation.md`: Remediation plan covering all findings across 6 batches / 23 tasks.

## [3.3.1-BETA] - 2026-05-10
### Fixed
- **Simplify Review (Phase 5 Quality Pass)**
    - `ble_stream.rs`: Bounded PCM buffer to 4MB max, removed dead `streaming` field, replaced `clone()+clear()` with `std::mem::take()` for zero-copy buffer drain.
    - `vfs_bridge.py`: Eliminated TOCTOU race and double file read — read bytes once, decode in-memory, handle `FileNotFoundError` directly.
    - `n8n_client.py`: Cached SSL context as instance attribute (was recreating per request), capped exponential backoff at 30s.
    - `streaming_handler.py`: Auto-evict finalized streams from `_active_streams` to prevent unbounded memory growth.
    - `bot_coordinator.py`: Auto-evict completed sessions from `_sessions` to prevent unbounded memory growth.
    - `mount.rs`: Replaced hardcoded `/etc/mirage/mirage.yaml` with configurable `mirage_config_path` field from `MirageConfig`.
    - `n8n_config.py`: Removed unused `field` import.

### Added
- **QA Skill Installation** — Modular QA skill at `.factory/skills/qa/` with orchestrator, 3 sub-skills (qa-workspace, qa-agent, qa-crates), config.yaml, report template, and GitHub Actions workflow (`qa.yml`).
- QA targets Tailscale mesh (Node B: 100.66.173.31:3002) with 10 workspace flows (agent-browser), 7 agent flows (curl), and 7 crate flows (shell).

## [3.3.0-BETA] - 2026-05-10
### Added
- **Phase 5: Incremental Appendages (MATERIALIZED)**
    - **Task 1: Telegram AI Artery Integration** — Sovereign Proxy bot with real-time reasoning stream (monospaced Thought Visualization), bot-to-bot coordination between Node C perception and Node D reasoning, and Tailscale Artery configuration. 59 tests passing.
    - **Task 2: n8n-mcp Integration** — n8n workflow orchestration bridge for Node B (100.66.173.31:5678). MCP tools: `n8n_health_check`, `n8n_list_workflows`, `n8n_execute_workflow`, `n8n_get_execution`. Docker deployment script included. 37 tests passing.
    - **Task 3: Omi Voice Layering** — nRF firmware encryption patch with AES-256-CCM (nRF Crypto), HKDF-SHA256 key derivation, anti-replay counter checks. vibevoice-asr extended with `AudioSource` enum (OmiHardwareBLE > MobileMic > FileInput priority). 10 tests passing.
    - **Task 4: Mirage VFS** — Virtualized filesystem Rust crate (FUSE mount management, read/write/list operations) and Hermes plugin (4 VFS tools). Targets Node D with Node A Redis backend. Deployment script and Nix flake integration. 55 tests passing (16 Rust + 39 Python).

### Changed
- Updated SOVEREIGN_VITAL_SIGNS.md to mark Phase 5 as completed.
- Added `mirage-vfs` to Nix flake overlay and packages.
- Updated `vibevoice-asr` to v1.1.0 with multi-source audio support.

## [3.2.0-BETA] - 2026-05-10
### Remediation (Strategist Audit)
- **Phase 4 Audit & Stabilization**: Conducted a Zero-Trust audit of Phase 4 materialization.
- **Nix Flake Fixed**: Resolved `node-a` evaluation failure by correctly importing the `hermes-lcm` module.
- **Rust Stabilization**: Fixed borrow-checker error in `directors-forge` (Task 2 of Phase 2 regression).
- **Dashboard Integrity**: Remediated 2,000+ linter violations and fixed broken tests in `ChatMessageList`, `ChatComposer`, and `i18n`.
- **Pretext Integration**: Stabilized the `usePretext` hook and added the `wasm/` distribution bridge.

### Added
- **Phase 4: Pretext HUD & Kinetic Typography (MATERIALIZED)**
    - Implemented **PretextCore** unified text engine with pure Rust geometric layout arithmetic.
    - Added **usePretext** React hook for 60fps layout calculations with WASM bindings.
    - Materialized **KineticThoughtStream** canvas-based component for obstacle-aware text flow.
    - Integrated **FluidRenderer** WebGL implementation with Navier-Stokes fluid simulation.
    - Added **Fluid Smoke Fragment Shader** for Ambient Artery background with node telemetry mapping.
    - Implemented **Variable Typographic ASCII** mapper with 56-char Georgia palette (gradient, wave, pulse effects).
    - Added **Thought-Stream Virtualization** for predictive height measurement of 10k+ nodes.
    - Materialized **Flutter/FFI bindings** for Machina Terminal with KineticHUDPanel CustomPainter.
- Added WASM build requirements documentation (`docs/nodestadt/operations/phase4-wasm-requirements.html`).

### Fixed
- Resolved WASM symbol conflicts by renaming duplicate function bindings (pretext_layout -> wasm_pretext_layout).
- Fixed unused variable warning in ThoughtStreamVirtualizer buffer_size field.

### Changed
- Updated SOVEREIGN_VITAL_SIGNS.md to mark Phase 4 as completed.

## [3.1.1-BETA] - 2026-05-10
### Added
- Native Windows execution support for Droid CLI (Sidecar Tunnel architecture).
- Network Vaccination: Implemented TCP KeepAlive/MTU clamping in NixOS modules for WSL2/Host stabilization.
- Hardware Invariants: Synchronized CPU/RAM/Storage specs for Nodes A, B, and C in all system manifests.

### Fixed
- Resolved Droid CLI "No active subscription" error by forcing Z.ai Coding Plan endpoint binding.
- Neutralized WSL2 memory-ballooning/hang vectors through native host transition and systemd resource constraints on Node D.
- Fixed submodule audit script recursive failures.

## [3.1.0-BETA] - 2026-05-10
### Added
- **Phase 3: Memory & Spatial Visualization (MATERIALIZED)**
    - Implemented **Hermes-LCM** native Tenacity MemoryProvider, enabling zero-trust synchronization over the Tailscale Artery.
    - Integrated **Sovereign Sniffer** using Stagehand SDK via local `brain-v2-27b` inference.
    - Added **Directors Forge** API discovery capability using isolated `nix-shell` execution.
    - Materialized **Omi Backend** for localized voice and perception layering on Node D.
- Phase 7 Blueprint: Formally integrated CloakBrowser, DataDog/pup, Hello-Agents, Nano Banana 2, and Memoir into the roadmap and implementation plans.

### Fixed
- Remediated critical sovereignty breaches by removing hardcoded `gpt-4o-mini` calls from Stagehand SDK.
- Fixed `hermes-lcm` systemd path desynchronization and logging crash vectors.

## [3.0.0-BETA] - 2026-05-09
### Added
- Phase 3 Planning: Materialized Memory distillation blueprints (`docs/planning/audits/status-audit-v3.html`).
- Phase 3 Audit: Generated comprehensive worktree audit (`docs/planning/audits/phase3-worktree-audit.html`).

### Changed
- **Worktree Strategy**: Abandoned `phase3/memory-viz` worktree due to upstream sync drift. Worktree artifacts removed from main repo. Pending Gemini Strategist completion before Phase 3 restart.

### Changed
- Artery Architecture: Shifted primary UI from `hermes-desktop` to `hermes-workspace`.
- HUD Interface: Hardcoded HUD terminal launch command to `hermes chat --tui`.
- Mesh Configuration: Synchronized `.env` across nodes to resolve credential binding loops.

### Fixed
- Authentication: Patched Node D API server to enforce strict `_SESSION_TOKEN` parity.
- HUD Stability: Resolved Electron/GPU sandboxing crashes in WSL2 via flake dependency injection.
- Connectivity: Diagnosed TUI gateway deadlock (SIGTERM lockup); documented recovery path in `status-audit-v3.html`.

### Fixed
- **Phase 2 Build Infrastructure**
    - Created 8 missing `default.nix` files for Nix build evaluation.
    - Generated 8 `Cargo.lock` files for reproducible builds.
    - Fixed Rust syntax errors across all crates (elog, unwrap_or_else, borrow issues).
    - All 8 Phase 2 crates now build successfully via `nix build .#<crate-name>`.
- **Mesh Stability**
    - **Identity Alignment:** Restored `maczz` user logic across all nodes to match physical reality.
    - **Filesystem Stability:** Fixed Btrfs subvolume mapping to prevent SSH drops during Nix activation.
    - **Priority Conflict:** Resolved DHCP conflicts in NixOS networking modules using `lib.mkForce`.

### Added
- **Upstream Sync & Modernization**
    - Synchronized `sidecars/hermes-agent-nous` with **NousResearch/Hermes-Agent v2026.5.7** (v0.13.0 core).
    - Merged 794 upstream commits and consolidated fork to a single authoritative `main` branch.
- **Phase 2: Pluggable Sovereign Layer (MATERIALIZED)**
    - Deployed pre-built binaries for all 8 Sovereign crates across the Artery.
    - Materialized the pluggable plugin layer (Hermes-LCM, VSB, Psy-Core) mesh-wide.
    - Finalized the **Zero-Trust Artery** (Tailscale) binding for all four nodes and mobile terminal.
    - **Sovereign HUD:** Materialized the `...-hermes-desktop-fork` as the primary visual hub.
- **Native Intelligence**
    - Installed the **Lead Architect (GLM-5)** skill as a native `/lead-architect` command in the Droid CLI.
    - Materialized the **SOUL.md** operating contract to govern all agentic behavior.

### Changed
- **Deployment Protocol (v3.2)**
    - Overhauled `scripts/deploy-phase2.sh` to follow the Nix-First mandate (Local Build -> Artery Sync).
    - Switched from `cargo build` on remote nodes to high-speed binary distribution via `rsync`.
- **Workflow Optimization**
    - Consolidated Hermes, HUD, and Omi forks to a single branch model (main) to reduce PR overhead.
    - Updated `docs/nodestadt/architecture/hermes-fork-workflow.html` to reflect Beta v3 standards.
- **Aesthetic DNA Alignment**
    - Mesh-wide injection of `docs/sovereign-style.css` following the **Operational Lo-Fi Brutalism** standard.
    - Stabilized all relative documentation paths and cross-links across 50+ Semantic HTML files.

## [Unreleased] - 2026-05-11
### Added
- **Hybrid Sovereign Architecture (v3.5)**
    - Materialized the **Hybrid Mesh Design** (`docs/planning/specs/2026-05-11-hybrid-mesh-design.md`) to resolve heterogeneous hardware utilization.
    - Added **Research Synthesis** (`docs/planning/research/2026-05-11-hybrid-mesh-synthesis.md`) detailing the shift to NixOS Stable + Docker Compose.
    - Created **Emergency Remediation Audit** (`docs/planning/audits/2026-05-11-mesh-remediation-audit.md`) tracking stabilization progress.
- **Node D Hardware Optimization**
    - Identified and documented Node D's **NVMe** advantage for high-speed model caching.
    - Provisioned Intel **OneAPI/OpenVINO** runtime strategy for Node D NPU.

### Changed
- **NixOS Baseline**
    - Stabilized cluster on `nixos-24.11` to resolve GCC/CUDA toolchain build failures.
- **Mesh Runtime**
    - Transitioned from source-compiled binaries to **OCI-containerized runtimes** via Docker Compose to enforce hardware-agnostic stability (CUDA/ROCm/OpenVINO).
- **Node B WSL2 Foundation**
    - Resolved 100% CPU pinning (`vmmem`) by standardizing WSL2 host-bridge configurations.

### Fixed
- **Build Infrastructure**
    - Patched `nixos-wsl` dependency drift with pinned stable-compatible versions.
    - Corrected broken Nix package derivations (`ik_llama.cpp`, `directors-forge`) for Node B stabilization.

## [0.2.0] - 2026-05-10
### Added
- Initial quaternary mesh topology mapping.
- Core Nix flake initialization.

---
**::/5Y573M-N071C3 : CHANGELOG_INITIALIZED. THE_BUS_IS_TRUTH. // 50V3R31GN-M4CH1N4**
