# Phase 39: 534ML355-1NF1L7R4710N Design Spec

**Goal:** Transform the machine from a passive observer into an active, high-fidelity infiltration engine. This phase enables transient biometric scanning, integrated netrunning hacks, and automated smart-asset ingestion during scene materialization.

**Architecture:** 
- **Transient Synapse:** Shared memory slots in `black_ice_state.mem` for real-time hover/selection data.
- **Rules Overrides:** A "Sovereign Mode" bit in Mmap to bypass Judge validation for GM actions.
- **Auto-Forge:** Hooking the Architect's materialization loop to background-encrypt assets via ST3GG.

---

## 1. Biometric Hover Protocol (Transient Grounding)

### 1.1 Mesh Layer (Foundry)
- **Hooks:** Add `hoverToken`, `hoverDrawing`, and `hoverNote`.
- **Payload:** Emit `{ id, type, imgPath, x, y }` to Node B.
- **Cleanup:** Clear data on `hoverOut`.

### 1.2 Orchestrator Layer (Node B)
- **Action:** If `imgPath` is a Smart Asset, execute internal `ST3GG` extraction.
- **Mmap Sync:** Write extracted biometrics/facts to the `HOVERED_UNIT` slot in `black_ice_state.mem`.

---

## 2. Quick Hack Console (Netrunning)

### 2.1 Cyberdeck HUD (Rust)
- **Visuals:** A new glitchy window in the `DECK` tab that populates ONLY when a valid target is hovered.
- **Actions (GM Sovereign Suite):**
  - `SY573M-5H0CK`: Deals Electrical DMG.
  - `OP71C5-D15RUP7`: Applies Blinded status.
  - `5YNP471C-OV3RLOAD`: Deals Humanity DMG.
  - `BR41N-W1P3`: Resets NPC initiative and intent.

### 2.2 Judge Layer (Node A)
- **Standard Mode:** Performs 1d10 + Stat vs DV (grounded from biometrics).
- **Sovereign Mode:** If Mmap bit `0x01` is high, bypass rolls and force CRITICAL SUCCESS.

---

## 3. Automated Smart Ingestion (Auto-Forge)

### 3.1 Architect Hook
- **Modification:** `ArchitectPassService.materializeTokens` will now trigger a `forge_and_ground` RPC.
- **Logic:** For each token being placed, Node B will:
  1. Bake its biometric data into its portrait PNG via ST3GG.
  2. Overwrite the Foundry server's asset with the Smart version.
  3. Ground the fact in `Akashik.db`.

---

## 4. Startup Modality (Settings)

### 4.1 Crush Start
- `crush start --lite`: Boots only backend (Director, Kernel, Sidecars). Suppresses Foundry/Obsidian.
- `crush start --full`: Standard boot (all components).
- `crush sovereign-mode [on|off]`: Toggles the Mmap bit for "God Mode" rules overrides.

---

## 5. Components & Data Flow

1. **Foundry (Mesh)** -> `perception_hover` -> **Node B (Director)**
2. **Node B** -> `ST3GG Extract` -> **Mmap (Shared Synapse)**
3. **Mmap** -> Reactive Detect -> **Sidecar HUD (Rust)**
4. **Sidecar HUD** -> Click Hack -> **Crush CLI**
5. **Crush CLI** -> `audit_intent` -> **Node A (Kernel Judge)**
6. **Node A** -> Success/Failure -> **Foundry Chat**

---
*Status: Approved for Phase 39 Implementation.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
