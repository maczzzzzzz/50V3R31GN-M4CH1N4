# ◈ Claw3D Architectural Dissection: Deep Dive Report
**Date:** 2026-04-26
**Subject:** Advanced 3D Visualization and Agentic Orchestration Patterns
**Status:** COMPLETE // AUDIT_VERIFIED

## 1. EXECUTIVE SUMMARY
Claw3D is a high-performance, event-driven 3D visualization layer designed to spatialize the abstract processes of AI agents. It serves as a "Virtual Office" for agentic frameworks (specifically OpenClaw/Hermes), transforming logs and streams into tangible physical entities and interactive environments.

## 2. THE CORE ENGINE
### 3D Tech Stack
- **Library:** Three.js with **React Three Fiber (R3F)** for declarative scene management.
- **Performance:** 
    - **InstancedMesh:** Used extensively for static geometry (walls, furniture) to minimize draw calls.
    - **Adaptive DPR:** A custom `AdaptiveDprController` dynamically scales resolution based on frame delta and visibility state.
    - **Pure Refs:** Frame-by-frame updates (`useFrame`) are managed via mutable refs to avoid React re-render overhead.
- **2D/3D Hybrid:** **Phaser** is utilized for high-density 2D interactions like the Office Builder and specialized HUD surfaces.

### Rendering Patterns
- **Geometry Logic:** Grid-based snapping and bounds calculation for furniture and navigation blockers.
- **Atmospheric Systems:** Dynamic lighting and camera presets that transition based on agent status (e.g., "Dim" for idle, "Focused" for active work).

## 3. AGENTIC INTEGRATION: THE "SPATIAL BRAIN"
Claw3D does not "remote control" agents; it **derives** spatial intent from the agentic stream.

### Interaction Model: Latches & Holds
- **Latches (Transient):** Short-lived timers (e.g., 5s) triggered by activity frames (reasoning, thinking, delta streams). These keep the agent in a "working" animation state visually.
- **Holds (Durable):** Persistent states triggered by parsed user commands or agent status (e.g., `focused`, `waiting`).
- **Intent Parsing:** The system parses natural language from the chat stream to identify **Spatial Directives** (e.g., "go to the gym", "reset session" -> triggers Janitor sweep).

### Spatial Cues
- **Janitor System:** A specific actor-type used for context clearing. When a session is reset, a "Janitor" actor is materialized to visually "sweep" the office, providing a physical metaphor for API context management.
- **Desk Progression:** Agents are assigned specific desks; their movement to these desks signals they are the "owner" of a specific context or task.

## 4. NAVIGATION & SPATIAL LOGIC
- **Pathfinding:** A* algorithm implemented on a 2D nav-grid derived from furniture footprints.
- **Collision Handling:** "Agent Bumps" — when actors collide, they trigger a "freeze" and a "talk" state before being assigned new roam targets to clear the path.
- **Room-Specific Workflows:**
    - **Gym:** Agents "train" (running/lifting) during background tasks or skill-building.
    - **QA Lab:** Agents move to specialized terminals during testing phases.
    - **Phone Booth:** Privacy-enforced spatial zones for voice/text communication.

## 5. HARDWARE REQUIREMENTS
- **GPU Overhead:** Moderate. The use of GLB models and instancing makes it viable on mid-range consumer GPUs.
- **VRAM:** ~500MB - 1GB depending on texture density and the number of active furniture GLBs.
- **CPU:** Significant during initial A* grid construction and heavy multi-agent pathing.

## 6. VISUALIZATION UPGRADES (PORTING CANDIDATES)

| Pattern | Source | Pretext HUD / Neural Promenade Application |
| :--- | :--- | :--- |
| **Heatmap System** | `HeatmapSystem.tsx` | Visualize "cognitive load" or "data density" across the Promenade. |
| **Trail System** | `TrailSystem.tsx` | Path-trace agent reasoning steps in the 3D graph. |
| **Immersive Overlays** | `MonitorImmersiveContent.tsx` | Map 2D terminal data (diffs, logs) directly onto 3D Promenade surfaces. |
| **Operational State Model** | `agent-state-model-spec.md` | Implement `focused`, `overloaded`, and `degraded` statuses for Sovereign Trinity agents. |
| **Billboard Nameplates** | `visualSystems.tsx` | Dynamic, non-occluded ID tags for Promenade entities. |

## 7. CRITICAL ARCHITECTURAL INSIGHT
The most advanced pattern in Claw3D is the **Studio WebSocket Proxy**. It terminates the browser connection and opens a server-side upstream connection to the gateway. This keeps credentials secure while allowing the browser to act as a "dumb terminal" for the 3D world, receiving processed spatial events rather than raw, noisy logs.

**::/5Y573M-N071C3 : AUDIT_COMPLETE. DATA_RETAINED. // 50V3R31GN-M4CH1N4**
