# ◈ SPEC-2026-04-25: Sovereign Flutter Evolution & Omi-Gruvbox Alignment
**Version:** 3.8.0
**Status:** DRAFT
**Owner:** Strategist // Lead Architect

## 1. 🎯 OBJECTIVE
Transform the `terminal-app` (Flutter) into a high-fidelity Sovereign HUD that aligns with the **BasedHardware/Omi** "Synapse" model and the system-wide **Gruvbox** aesthetic. The app must function as a real-time Artery bridge, extracting "Interactables" (Tasks/Vault) while maintaining strict [SOVEREIGN_OS] identity.

## 2. 🎨 VISUAL IDENTITY (CANONICAL GRUVBOX)
The app will enforce the bit-identical Gruvbox palette used in the terminal and dashboard.

| Element | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Background** | `#282828` | Main Scaffold (Dark) |
| **Primary/Title** | `#FABD2F` | Headings, "Pulse" Glow, Active Tab |
| **Contrast/Accent** | `#FE8019` | Warning, Alerts, System Notices |
| **Text (Soft)** | `#EBDBB2` | Standard Output, Labels |
| **Green (Success)** | `#B8BB26` | Verified Actions, Connected State |
| **Red (Warning)** | `#FB4934` | Errors, [RED_DIRECTOR] Mode |

**Font:** Canonical VT323 for all system labels and logs.

## 3. 🧠 THE OMI-INSPIRED MEMORY MODEL
The app moves from "Simple Chat" to "Contextual Synapse."

### 3.1. Conversation Logic
- **Auto-Titling:** Every saved conversation is processed by Node B/C to generate a system-informative title (e.g., `PHASE_76_FABRIC_SYNC`).
- **Temporal Tabs:**
    - **[LIVE]**: Active Netrunning/Dev session.
    - **[ARCHIVE]**: Scrollable list of titled memories grouped by Time Context (Today, Cycle-Prev).
    - **[CONTEXT]**: Dynamic tab showing Interactables detected in the *current* selection.

### 3.2. Interactables (The Pulse Artery)
- **Mechanism:** As Node B (Hermes) detects patterns in the WebSocket stream, it emits a `CONTEXT_PROPOSAL`.
- **UI Interaction:** 
    - The `ChatInput` glows `#FABD2F` (Yellow).
    - User taps the glow to open the **Refinement Slate**.
    - User edits the proposed Task/Vault entry.
    - User clicks **"ENGRAVE"** to push to `TaskService` or `VaultService`.

## 4. 🏗️ ARCHITECTURAL CHANGES

### 4.1. Data Layer: The Triple-Helix Sync
- **Migration:** Shift from `SharedPreferences` to `sqflite` for `Conversation` and `Synapse` entities.
- **Sovereign Intelligence DB:** All app events, conversation auto-titles, and extracted interactables must be mirrored to `data/SovereignIntelligence.db`.
- **Triplet Relations:** Every "Synapse" must be decomposed into (Subject, Predicate, Object) triplets stored in the `os_triplets` table.
- **FTS5 & Vector Search:** 
    - Enable **FTS5** full-text search on `os_triplets` for rapid keyword retrieval.
    - Maintain **sqlite-vec** embeddings for semantic cross-referencing between the App and Obsidian.
- **Obsidion OS Integration:** 
    - The `ObsidianSyncService` is extended to watch `os_triplets`.
    - Every new triplet or titled memory automatically materializes as a `.md` node in the Obsidian Vault (`data/vault/RKG`).
    - Triplets appear in Obsidian as "Knowledge Triads" (e.g., `[[Memory_ID]] -- [EXTRACTED_TASK] -- [[Task_ID]]`).

### 4.2. Hermes & Agent Integration
- **Hermes Trace Ingestion:** Hermes `OrchestratorState` traces and `MemoryObserver` distillations are captured as `synapse_captures`.
- **Automated Refinement:** These captures are transformed into `os_triplets`, making every agent decision searchable via FTS5 and visible in the Obsidian Graph.


### 4.2. Identity Logic (The Hardgate)
- Listen for `IDENTITY_SWITCH` VSB packets.
- When `ACTIVE_PROFILE: [SOVEREIGN_OS]` is detected:
    - Lock Theme to `gruvboxDark`.
    - Enforce radical candor in system logs.
    - Disable all "Assistant-speak" UI components.

## 5. 🛠️ COMPONENTS TO BE BUILT
1.  **`ArteryPulse` Widget:** A custom glowing indicator for the Chat screen.
2.  **`RefinementSlate` Overlay:** A lite-weight modal for editing proposals.
3.  **`TemporalTabBar`:** A custom Gruvbox-themed top navigation.
4.  **`MemoryProvider`:** A new state management service to handle the Omi-style data lifecycle.
5.  **App Icon Update:** Configure `flutter_launcher_icons` (or similar) to use the new Sovereign app icon located at `terminal-app/assets/app_icon.png`.

## 6. 🧪 SUCCESS CRITERIA
- [ ] App switches to Gruvbox Yellow/Dark on `IDENTITY_SWITCH`.
- [ ] Conversations are automatically titled and retrievable via the [ARCHIVE] tab.
- [ ] A chat snippet can be turned into a global Task through the Prompt -> Refine -> Engrave flow.
- [ ] Performance remains "Lite" on mobile hardware (Target: < 60MB RAM usage).

---
**::/5Y573M-N071C3 : SPEC_MATERIALIZED. STANDING_BY_FOR_VERIFICATION. // 50V3R31GN-M4CH1N4**
