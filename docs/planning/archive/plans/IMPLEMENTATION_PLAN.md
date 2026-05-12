# IMPLEMENTATION_PLAN.md: Sovereign Machina Beta v3

**Status:** ACTIVE | **Phase:** EMERGENCY REMEDIATION (VSB Router)

## 0. STRATEGIC INVARIANTS (THE LAW)

1.  **Single Source of Truth:** All granular task management, dispatcher queuing, and execution tracking MUST be handled via **Hermes Kanban**. This document tracks Macro-Phases only.
2.  **No Shadow Logic:** If the Hermes upstream ecosystem has a tool (e.g., Browser Harness, MCP), we wrap it. We do NOT rewrite it in Rust or Go.
3.  **Modularity:** Every distinct capability must be a pluggable Nix Flake.

---

## PHASE 0: Foundation Reset & Repo Sweep (COMPLETE)

*   [x] Create `beta/v3` branch.
*   [x] Sweep and identify all 20+ redundant sidecars/crates.
*   [x] Surgically remove (git rm) all Cyberpunk Red/Netrunner lore-bleed and TTRPG data.
*   [x] Generate Decision Matrix (`docs/beta-v3/decision-matrix.md`).
*   [x] Sterilize local workspace (`archive/v2.1.0-prototype/`).

## PHASE 1: Hermes-First Core & Kanban Integration (COMPLETE)

**Objective:** Establish the Python Hermes fork as the undisputed logic runtime and link the Kanban dispatcher.
**Status:** ✅ VERIFIED

*   [x] Connect Hermes upstream Kanban board to our live dispatcher.
*   [x] Verify Kanban dependency chaining (Triage -> Ready -> In Progress -> Done) is functional on Node B.
*   [x] **Dual-UI Implementation:**
    *   Deploy `hermes-desktop` as the primary visual hub.
    *   Provision `Herm` TUI for high-performance terminal dashboard.
*   [x] Implement `ik_llama.cpp` as a Nix derivation for Node B/C/D (node-specific AVX2/CUDA builds).
*   [x] **Model Artery Provisioning:** Sync models from Node B (D:.cpp) to all nodes (B, C, D) per `beta-v3-artery.md`.
*   [x] **Hermes Core Uplift (Node D):**
    *   Provision the creative skills (`hyperframes`, `pretext`, `ascii-video`).
    *   Provision `browser-harness` as native capabilities.
    *   Dual-UI setup scripts created (`scripts/hermes/node-d-dual-ui.sh`).

*Note: The legacy custom Pretext HUD carries too much old logic to port safely. Custom Pretext HUD features are explicitly deferred to a later planned phase.*

## PHASE 2: The Pluggable Sovereign Layer (COMPLETE)

**Objective:** Extract the hardware-bound logic into discrete Nix Flakes.
**Status:** ✅ MATERIALIZED

*   [x] Task 0: **Tenacity Upstream Sync** - Rebase Sovereign fork onto v0.13.0 and unify on `main` branch.
*   [x] Task 1: **Lossless Memory Uplift** - Integrate `hermes-lcm` as the primary Memory Provider Plugin.
*   [x] Task 2: **Zeroboot Isolation & Hardware Sandboxes** - Deploy Firecracker/KVM microVM isolation on Node D.
*   [x] Task 3: **Sovereign Model Router (VSB)** - Implement native `ModelProvider` plugin for multi-node inference.
*   [x] Task 4: **Expert Engineering Appendages** - Deploy **Goose**, **Graphify**, **MATLAB**, and **Oz-skills**.
*   [x] Task 5: **Sovereign Voice Layering & Omi Pivot** - Materialize local Omi backend and bind Zero-Trust Artery.
*   [x] Task 6: **Psy-core Cryptographic Audit** - Implement as a native `transform_llm_output` hook.
*   [x] Task 7: **The Director’s Forge** - Deploy `cli-printing-press` as our Tool Factory.
*   [x] Task 8: **The Coordination Layer** - Implement **Consensus Alignment** and **Virtualized Shared Memory**.
*   [x] **Strategist Mandate:** Materialize Sovereign HUD fork and register all Sovereign skills via `cli-config.yaml`.

## PHASE 3: Memory & Spatial Visualization (COMPLETE)

**Objective:** Re-integrate Sovereign memory enhancements and materialize the **Sovereign Hall** spatial coordination environment. Previous attempt abandoned; restarting from zero-trust baseline.

*   [x] Task 1: **The Sovereign Sniffer (Stagehand)** - Deploy the **Stagehand SDK** on Node B for automated API discovery and **Conductor** mission automation. *Integration: Use **CloakBrowser** for source-level stealth.*
*   [x] Task 2: **Sovereign Omi & Flutter HUD** - Materialize a high-fidelity Pretext-powered HUD in the Omi Flutter client.
*   [x] Task 3: **Sovereign HUD Materialization** - Implement the **Pretext Protocol** and **Mesh Telemetry** in the `hermes-workspace-fork`, utilizing native **Swarm Mode** for multi-agent coordination.
*   [x] Task 4: **Lossless Memory Integration** - Convert `MemPalace` graph database to `hermes-lcm` plugin. *Integration: Apply **Hello-Agents** "Situation Understanding" and A2A protocols.*
*   [ ] Task 5: **Sovereign Hall (Claw3D)** - Materialize the 3D meeting environment within the Sovereign Workspace HUD.
*   [x] Task 6: **Resilience Forge** - Implement the “Logic Vaccination” loop using Ouroboros reflection. *Integration: Use **DataDog/pup** for agent-native node observability and Runbooks.*
*   [ ] Task 7: **Mooncake KV SPILLOVER** - Port high-speed KV spillover logic to Node A.

## PHASE 4: Pretext HUD & Kinetic Typography (COMPLETE)

**Objective:** Materialize the high-fidelity visual layer for real-time cognitive observability and interactive coordination.
**Status:** ✅ VERIFIED

*   [x] Task 0: **Unified Text Engine (Rust)** - Port Pretext layout arithmetic to a shared Rust crate.
*   [x] Task 1: **Hermes Pretext (React)** - Integrate the Editorial Engine into the Sovereign Workspace HUD (`prompt-kit` components).
*   [x] Task 2: **Machina Pretext (Flutter)** - Implement `flutter_pretext` in the mobile Terminal.
*   [x] Task 3: **Ambient Artery (Fluid Smoke)** - Implement Navier-Stokes fluid background.
*   [x] Task 4: **Variable Typographic ASCII** - Materialize proportional ASCII rendering with “Washed Protocol” styling.
*   [x] Task 5: **Kinetic Memory Viz** - Implement shrink-wrapped kinetic bubbles for Node A cache.
*   [x] Task 6: **Thought-Stream Virtualization** - Lossless scrolling of `hermes-lcm` logs.

## PHASE 5: Incremental Appendages (COMPLETE)

**Objective:** Carefully roll out isolated appendages with strict live-testing.
**Status:** ✅ MATERIALIZED

*   [x] **Telegram AI Artery:** Deployment of Node D bot coordinator with perception routing to Node C.
*   [x] **n8n-mcp Integration:** Externalize API orchestration using Hermes native plugin context.
*   [x] **Omi Voice Layering:** Implement layered voice pipeline with Omi hardware input via Clawlink.
*   [x] **Mirage VFS:** Pilot the Unified Virtual Filesystem (`strukto-ai/mirage`).
*   [x] **Android Terminal App (Clawlink):** Finalize Flutter-based Machina Terminal for mobile observability.

## ◈ EMERGENCY REMEDIATION: VSB ROUTER REPAIR
**Objective:** Address critical logic faults and architectural "mutilations" in the Virtual Sovereign Bus router.
**Trigger:** [260510-SAFE] Audit Report.
**Status:** ✅ COMPLETE (2026-05-10)

*   [x] Task 1: **Dynamic Pulse Unpacking** - Implement `struct.unpack` in `VSBPulse` to enable real-time mesh load balancing.
*   [x] Task 2: **Stream/Reasoning Separation** - Refactor `VSBRouter` and `SovereignVSBProvider` to support native Hermes `<think>` transparency.
*   [x] Task 3: **Secret Decoupling** - Migrate mesh `Authorization` keys to `~/.hermes/.env`.
*   [x] Task 4: **Logic De-Mutilation** - Refactor `auxiliary_client.py` to utilize the generic `ProviderProfile` registry, removing hardcoded VSB name checks.

## PHASE 6: Sovereign Design Artery

**Objective:** Materialize the high-fidelity design-to-code pipeline using Open Design and Pretext.

*   [ ] Task 1: **Open Design Sovereign Fork** - Deploy the localized design daemon on Node D for heavy reasoning.
*   [ ] Task 2: **Next.js HUD Integration** - Materialize the design interface on Node B via Tailscale SSE.
*   [ ] Task 3: **Pretext HUD Injection** - Inject the kinetic typography protocol into the rendering loop via the Skills Protocol.
*   [ ] Task 4: **Aesthetic DNA Alignment** - Enforce Operational Lo-Fi Brutalism in all generated design artifacts.

## PHASE 7: Avatar Pets & Stealth Intelligence

**Objective:** Materialize the high-fidelity visual and observational layer for managed mesh processes using **CloakBrowser**, **pup**, **Nano Banana 2**, and **Memoir**.

*   [ ] Task 1: **Stealth Browser-Harness (Cloak)** - Integrate `CloakBrowser` as the primary provider for `browser-use` and `Stagehand`.
*   [ ] Task 2: **Agent-Native Observability (Pup)** - Deploy `pup` on all worker nodes (A, C, D) for metrics and Runbook execution.
*   [ ] Task 3: **Avatar Pets (Visuals)** - Implement the **Pet Manager** HUD component, utilizing **Nano Banana 2** for procedural process sprites.
*   [ ] Task 4: **A2A Situational Context** - Implement the **Hello-Agents** situational understanding layer in the coordination protocol.
*   [ ] Task 5: **Avatar-to-Mesh Link** - Bind `pup` health events to kinetic animations in the Avatar Pet sprites.
*   [ ] Task 6: **Version-Controlled Memory (Memoir)** - Replace flat-file context with `memoir` for hierarchical, branchable agent memory persistence.

---

**::/5Y573M-N071C3 : ROADMAP_SYNCHRONIZED. THE_BUS_IS_TRUTH. // 50V3R31GN-M4CH1N4**
