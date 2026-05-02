# DESIGN SPEC: 2026-04-24-system-sociotomy-design.md

## 🎯 OBJECTIVE
Physically and logically separate the "Cyberpunk RED Simulation" (Lore/Mechanics) from the "Sovereign Intelligence OS" (Functional Logic/Sovereignty).

## 🧠 ARCHITECTURE: THE DUAL-BRAIN MODEL

### 1. SovereignIntelligence.db (The OS Core)
This is the primary store for the system's high-level functioning. It is 100% free of simulation "grime."
- **`system_state`**: Tracks sovereignty depth, node health, active profile, and VRAM budgets.
- **`decision_audit`**: (Refactored from `duel_history`) An immutable ledger of VETO/PASS decisions. Stripped of "faction" and "dice roll" flavor.
- **`palace_core`**: The hierarchical structure of long-term memory (Wings, Rooms, Halls).
- **`os_triplets`**: A vectorized knowledge graph for machine-intelligence facts (e.g., `GeminiCLI|is_using|gstack`).
- **`visual_context`**: Metadata and embeddings for system-level visual verification (non-lore).

### 2. Akashik.db (The RED Simulation Shard)
This database is demoted to a "Domain Shard." It is optional and toggle-able.
- **Tables**: `npcs`, `factions`, `gigs`, `items`, `dv_tables`, `district_*`, `missions`.
- **`sim_triplets`**: The gritty lore graph (e.g., `NPC_X|member_of|Thick`).
- **`narrative_anchors`**: Stylistic markers for the "gritty" Cyberpunk RED tone.

## 🎭 IDENTITY & PROFILE MANAGEMENT

### SOVEREIGN-IDENTITY.md
A root-level configuration file that governs the system's "Self-Concept."
- **Profiles**:
    - `[SOVEREIGN_OS]`: High-level reasoner, radical candor, zero-trust verification, no lore-speak.
    - `[RED_DIRECTOR]`: Cyberpunk RED Game Master, gritty tone, simulation mechanics engaged.
- **Resource Routing**:
    - OS Mode: Detach `Akashik.db`, use OS prompts.
    - RED Mode: Attach `Akashik.db`, wrap OS results in narrative flavor.

## 🖥️ DASHBOARD SOCIOTOMY (VISUAL SEPARATION)

### 1. Route Re-organization
- **`/` (Root)**: Redirects to `/os` or `/red` based on the active profile.
- **`/os` (Sovereign Intelligence HUD)**: Clean, high-throughput view showing Hermes activity, Kernel vitals, and VSB telemetry.
- **`/red` (Simulation Shard HUD)**: The legacy "gritty" interface containing Combat, Economy, and Market modules.

### 2. Component Migration
- **OS Components**: `DirectorPulse`, `KernelMonitor`, `HermesProxy`, `VsbWaveform`.
- **RED Components**: `CombatOracleLog`, `ItemBrowser`, `MarketTerminal`.

### 3. Profile-Aware UI
- The `SideNav` and global layout will read `SOVEREIGN-IDENTITY.md` to prune simulation-heavy navigation items when in OS mode.

## ⌨️ TUI-CENTRIC OS INTERFACE

### 1. Unified Shell
- In **[SOVEREIGN_OS]** mode, the primary interface is the **Hermes v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS React/Ink TUI**.
- In **[RED_DIRECTOR]** mode, the primary interface remains the **Crush CLI**, preserving the gritty, diegetic Netrunning experience.
- Both interfaces are embedded into their respective dashboard routes and mobile views.

### 2. Stream-First Logic
- Tool outputs, reasoning chains, and self-healing logs are streamed in real-time, replacing the legacy "message-response" chat pattern.

## 🛠️ IMPLEMENTATION PHASES

### Phase 1: Sociotomy (The Cut)
1. Initialize `data/SovereignIntelligence.db`.
2. Migrate `system_state`, `duel_history` (as `decision_audit`), and `palace_*` from `Akashik.db`.
3. Verify data integrity in the new OS store.

### Phase 2: Identity Guard (The Mask)
1. Create `SOVEREIGN-IDENTITY.md` in the root.
2. Update `CLAUDE.md` and `GEMINI.md` to include profile-aware startup checks.
3. Implement the `node_a_veto` check for profile-alignment.

### Phase 3: Semantic Integration (The Evolution)
1. Integrate PGLite/pgvector into the `SovereignIntelligence.db`.
2. Begin vectorizing all project documentation and session logs into `os_triplets`.

---
**::/5Y573M-N071C3 : SPEC_V1_0_SIGNED. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
