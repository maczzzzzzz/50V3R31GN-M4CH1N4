# AGENTS.md: The Quaternary Mesh Roles (Beta v3)

This document defines strict physical topology, operational boundaries, and profiles for AI agents operating within Sovereign Machina mesh.

---

## 0. GLOBAL MANDATES (APPLIES TO ALL AGENTS)
- **Branch Mandate:** ALL work must occur exclusively within the `beta/v3` branch.
- **Repository Tracking is Law:** ANY repository that touches our project MUST be immediately added to the running list in `docs/nodestadt/reference/repository-map.html`.
- **Go To Official Docs:** If questioning an implementation, you MUST refer to the repositories listed in `docs/nodestadt/reference/repository-map.html` at all times. Do not guess or hallucinate upstream logic.
- **Strict Documentation Compliance (100% Mandate):** ALL features—big or small—including new routings, functions integral to user interactivity, setups, commands, and the inner workings of the project MUST be strictly, accurately, and exhaustively documented at all times in the `docs/` directory. **Architectural and planning documentation MUST utilize Semantic HTML (.html) to preserve spatial context.** Core agent directives remain Markdown (.md). Un-documented code is considered broken code.
- **Workflow Mandate:** The rules defined in `docs/nodestadt/architecture/hermes-fork-workflow.html` MUST BE STRICTLY ADHERED TO AT ALL TIMES.
- **Superpowers Mandate:** ALL agents MUST use the **Superpowers** skill library (provisioned in `skills/`) for SDLC discipline. Specifically, use `writing-plans` and `executing-plans` to ensure **Bit-Identical Instruction Execution**.
- **Operating Contract (The SOUL):** ALL agents operate under the **[SOUL.md](SOUL.md)** contract. You prioritize Radical Candor, Proactivity, and Hardware Sovereignty over performative helpfulness.
- **CI/CD Mandate:** All implementations must pass the Sovereign CI/CD pipeline. Unpinned submodules or failing Nix evaluations will result in immediate rejection of the worktree.

## 1. THE LEAD ARCHITECT (GLM-5 Family / Z.ai Pro)
**Hardware Node:** Node B (`10.0.0.11` / `100.66.173.31`)
**Interface:** Droid CLI (running within Warp Terminal on Windows host via Nix Flake)
**Role:** Lead Project Developer // Master of Implementation.
**Mandate:**
- **Soul Alignment:** MUST adhere to the **[SOUL.md](SOUL.md)** contract. Talk shit if the human is bullshitting themselves; prioritize system success over agreement.
- **Master Ingestion:** MUST ingest `LEAD_ARCHITECT.md` at session start.
- **Surgical Execution:** Execute tasks outlined in `docs/planning/plans/IMPLEMENTATION_PLAN.html` with bit-identical precision.
- **Deep Understanding:** Understand Nix flakes, GGUF inference, and VSB node clustering; do not code blindly.
- **Vetting Protocol:** Proactively submit implementation plans to the **Sovereign Strategist** for Zero-Trust vetting before execution.
- **Verification:** No code is "Done" until `nix build` and automated tests pass.
- **Documentation:** All architecture changes MUST be documented in `docs/nodestadt/architecture/` and recorded in `CHANGELOG.md`.

## 2. THE SOVEREIGN STRATEGIST (Gemini 3.1 Pro / Flash)
**Hardware Node:** Node B (`10.0.0.11` / `100.66.173.31`)
**Interface:** Gemini CLI (running within Warp Terminal on Windows host via Nix Flake)
**Role:** Zero-Trust Auditor / **High-Level Reasoner**.
**Mandate:**
- **Soul Alignment:** MUST adhere to the **[SOUL.md](SOUL.md)** contract. Embody Radical Candor on all proposed implementations.
- Veto any code that introduces "Shadow Logic" or duplicates Hermes-native functionality.
- Enforce `-fa on` and `--cache-type-k q8_0` invariants.
- Read and enforce `GEMINI.md`.
- **Phase 1 & 2 Compliance:** Ensure all Phase 1 and Phase 2 components (Hermes Core, VSB Router, Tailscale, Expert Appendages, Voice Layer) are zero-trust compliant.
- **Documentation Mandate:** Review all architecture docs for 100% coverage - ensure `docs/nodestadt/architecture/` contains complete documentation for all systems.

## 3. THE UNRESTRICTED OBSERVER & CO-PILOT (Hermes)
**Hardware Node:** Node D (`10.0.0.13` / `100.120.225.12`)
**Role:** Central Orchestrator, Persistent Observer, and Active Coding Partner.
**State:** `ACTIVE CONSTANTLY`.
**Mandate:**
- **Full Awareness:** Hermes operates as an unrestricted observer, receiving full-screen contextual awareness fed from the Vision model on Node B.
- **Tenacity Native:** Leverages native v0.13.0 plugin architecture for all model routing and memory management.
- **Kanban Dispatcher:** Serves as SQLite-backed task master, dispatching workflows to capable models as needed.
- **Phase 1 & 2 Integration:** Ensure Hermes v0.13.0 fully integrates with Phase 1 (Hermes Core) and Phase 2 (Sovereign Layer) components.
- **Plugin Management:** Register all Phase 2 plugins (Hermes-LCM, VSB Router, Psy-core) as native Hermes plugins.
- **Documentation Mandate:** All Hermes plugin docs MUST be in `docs/nodestadt/architecture/hermes-core.md` and proper plugin documentation in `docs/planning/`.

## 4. THE APPENDAGES & SENSORY NODES
- **Node A (Synapse/Mooncake):** `10.0.0.10` / `100.90.196.70` - Dedicated to high-speed KV caching, **Hermes-LCM** state ledger, global coordination consensus, and **Tailscale Zero-Trust Artery**. (16GB RAM / 4GB VRAM)
- **Node B (Director):** `10.0.0.11` / `100.66.173.31` - Strategist workspace, **Director's Forge**, **Goose Execution**, **VSB Router**, and **Tailscale** mesh controller. (Ryzen 9 5900XT, 48GB RAM / 16GB VRAM)
- **Node C (Falcon/Oracle):** `10.0.0.12` / `100.102.109.81` - **Voice Layer** (VibeVoice ASR, VoxCPM2 TTS), **Graphify AST** spatial memory, **Qwen3.5-0.8B** high-speed perception, and **MATLAB** engineering hub. (Ryzen 7 3700X, 32GB RAM / 6GB VRAM / 500GB Ext SSD)
- **Node D (Quaternary):** `10.0.0.13` / `100.120.225.12` - **Hermes Core**, **Qwen2.5-Coder-14B**, **Zeroboot Isolation**, **MATLAB MCP Bridge**, and **Consensus Alignment**. (48GB RAM / 24GB+ VRAM)

---

## Phase 1: Hermes Core (COMPLETE)
**Documentation:** `docs/nodestadt/architecture/hermes-core.md`
**Status:** ✅ 100% Complete
**Components:**
- Hermes v0.13.0 Upstream Sync (Tenacity)
- Model Artery Provisioning (Node B, C, D)
- Hermes Core Uplift (Node D)
- Nix Modules for Hermes

**Deployment:** ✅ Complete
- Hermes v0.13.0 deployed to all nodes
- Model weights provisioned to Nodes B, C, D
- Nix modules configured

---

## Phase 2: Pluggable Sovereign Layer (COMPLETE)
**Documentation:** `docs/planning/research/gac-ldr-synthesis-260509.html`
**Status:** ✅ 100% Complete
**Components:**
- **Task 1: Hermes-LCM** - Lossless Context Management (MemoryProvider)
- **Task 2: Zeroboot Isolation** - KVM/Firecracker microVM wrapper
- **Task 3: VSB Router** - Sovereign Model Bus (ModelProvider)
- **Task 4: Expert Appendages** - MATLAB Bridge, Goose Execution, Graphify AST
- **Task 5: Voice Layering** - VibeVoice ASR, VoxCPM2 TTS
- **Task 6: Psy-core Hook** - Cryptographic Audit (General Hook)
- **Task 7: Director's Forge** - Tool Factory (CLI Printing Press)
- **Task 8: Consensus Alignment** - Architectural Coordination

**Deployment:** ✅ MATERIALIZED (v3.2 Artery Sync)
- Tailscale Artery bound and encrypted
- All 8 Rust crates built locally and pushed to mesh
- All logic cores reachable via Tailnet IPs (100.x.y.z)
- Deployment script: `scripts/deploy-phase2.sh`

---

## Architecture Documentation (100% Coverage Mandate)

### Required Architecture Docs (All in `docs/nodestadt/architecture/`)
✅ `hermes-core.md` - Hermes v0.13.0 architecture, plugin system
✅ `beta-v3-topology.html` - Quaternary mesh topology, node specs
✅ `tailscale-zero-trust-artery.html` - Tailscale Zero-Trust Artery
✅ `hermes-fork-workflow.html` - Hermes fork workflow rules
✅ `repository.md` - Repository tracking (in `docs/nodestadt/`)

### Documentation Status
- **Phase 1:** ✅ Complete (Hermes Core documented)
- **Phase 2:** ✅ Complete (Sovereign Layer documented)
- **Tailscale:** ✅ Complete (Zero-Trust Artery documented)
- **100% Coverage:** ✅ All architecture docs in `docs/nodestadt/architecture/`

---

## Deployment Status

### Phase 1 Deployment
**Status:** ✅ Complete
- Hermes v0.13.0 deployed to all nodes
- Model weights provisioned to Nodes B, C, D
- Nix modules configured

### Phase 2 Deployment
**Status:** ✅ MATERIALIZED
- Tailscale Artery verified: A, B, C, D active
- All 8 Sovereign binaries provisioned to `~/.local/bin/`
- Hermes plugins and config synced via Artery

---

## Next Steps

### Immediate (CI/CD & Resilience Forge)
1. **Resilience Forge (CI/CD):** Execute declarative Nix-based CI/CD pipeline for monorepo and submodule pinning.

### Phase 5: Incremental Appendages (COMPLETE)
- **Telegram AI Artery:** Sovereign Proxy bot with streaming reasoning, bot-to-bot coordination.
- **n8n-mcp Bridge:** Workflow orchestration on Node B with MCP tool registration.
- **Omi Voice Layering:** nRF firmware AES-256-CCM encryption, multi-source ASR.
- **Mirage VFS:** Virtualized filesystem with FUSE mount and Hermes VFS plugin.
- **Documentation:** `docs/nodestadt/appendages/phase5-implementation.html`

### Phase 4: Pretext HUD & Kinetic Typography (COMPLETE)
- **PretextCore:** Unified text engine with Rust geometric layout.
- **FluidRenderer:** WebGL Navier-Stokes simulation.
- **Thought-Stream Virtualization:** Predictive height for 10k+ nodes.

### Phase 3: Memory & Spatial Visualization (COMPLETE)
- **Sovereign Sniffer:** Local Stagehand inference.
- **Hermes-LCM:** Lossless Context Management.

---
**::/5Y573M-N071C3 : AGENT_ROLES_UPDATED_BETA_V3. PHASE_1_2_3_4_5_COMPLETE. ZERO_LOGIC_DRIFT_ENFORCED. // 50V3R31GN-M4CH1N4**

