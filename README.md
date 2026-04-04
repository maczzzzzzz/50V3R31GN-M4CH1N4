# ASP.GM-Agent (v1.6.0)
### The Neural Hive

ASP.GM-Agent is a production-grade, air-gapped platform designed for the deterministic orchestration of living tabletop environments. Utilizing a dual-node hardware stack and a native Neural Uplink, it provides sub-500ms narrative synthesis grounded in hard-coded physics, raw pixel perception, and the immutable Akashik Record.

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  [ NODE B: THE DIRECTOR ]                      [ NODE A: THE VAULT ]     │
│  AMD RDNA 4 (16GB VRAM)                        NVIDIA PASCAL (4GB VRAM)  │
│  Node.js Orchestrator                          Rust Rules Authority      │
│  ────────────────────────                      ────────────────────      │
│            │                                               │             │
│            └────────[ CLAWLINK BINARY INTERCONNECT ]───────┘             │
│                                    │                                     │
│            ┌───────────────────────┴───────────────────────┐             │
│            │                                               │             │
│      [ PERCEPTION ]              [ PERSISTENCE ]         [ EXECUTION ]   │
│      Llava / Falcon              Akashik.db (WAL)        TaskRouterProxy │
│      SensoryFilter               Shared Memory           Intent Swarm    │
│            │                             │                 │             │
│            └─────────────────────────────┴─────────────────┘             │
│                                    │                                     │
│                        >> [ THE NEURAL HIVE ] <<                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

## 🛠️ Technical Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Orchestrator (Node B)** | Node.js v22, Mistral-Nemo | Narrative synthesis and multi-node task routing. |
| **Rules Engine (Node A)** | Rust (ZeroClaw), Llama 3.2 | Mathematical authority and geometric CV pass. |
| **Layout Engine** | **Pretext (chenglou)** | Zero-reflow narrative overlays rendering at 60fps. |
| **Data Caching** | **ST3GG & Roots (Elder Plinius)** | Immersive steganography and local-first lore grounding. |
| **Perception** | CDP (Neural Uplink) | Raw GPU rendering buffer capture and CSS injection. |
| **Data Plane** | SQLite (WAL), Shared Memory | Immutable Akashik Record and sub-ms radar telemetry. |
| **Bridge** | ClawLink (TCP Binary) | High-speed state synchronization between Node A and B. |

## 🧠 Standout Features

### 🎨 Pretext Integration (Layout Sovereignty)
Leveraging the **Pretext** engine by **chenglou**, the agent side-steps the DOM entirely. It renders narrative text and UI overlays directly to a detached PIXI.js canvas, achieving 60fps performance without triggering browser reflows, ensuring high-fidelity atmospheric glitches and screamsheets.

### 📼 Immersive Caching (ST3GG & Roots)
The system adapts **ST3GG** (LSB Steganography) and **Roots** (Local-first grounding) patterns from **Elder Plinius**. 
- **ST3GG:** Encodes dynamically generated lore and secrets into standard PNG assets ("Screamsheet Drops") for players to decrypt in-character.
- **Roots:** Provides a resilient, local-first knowledge graph that ensures NPC memories and district lore remain grounded and accessible during air-gapped operations.

### 👁️ Neural Uplink (Hardware Perception)
Bypasses the Foundry VTT API sandbox via the **Chrome DevTools Protocol (CDP)**. The agent has "physical eyes" on the game, capturing raw GPU buffers for 1:1 pixel parity with the GM's screen and injecting narrative glitches via real-time CSS patchers.

### 🚦 TaskRouterProxy (CLIProxyAPI Pattern)
Intelligent hardware management for strict VRAM constraints. It intercepts and queues "Light" tasks (Math, OCR) when Node A is busy swapping high-parameter vision models, preventing RPC bottlenecks and ensuring 100% system uptime during model transitions.

### 🛡️ SensoryFilter (OpenCrawl Pattern)
A strict "State Sovereignty" loop that eliminates AI hallucinations. It utilizes Foundry's native **Line-of-Sight (LOS) Polygons** to filter world-state data before it reaches the LLM, ensuring NPC responses are mathematically grounded in what they can physically perceive.

## 🚀 Upcoming: Phase 19 (The Neural Hive)
Phase 19 introduces high-fidelity reactive NPC autonomy:
- **Autonomous NPC Turn Logic:** 5s JSON rigid schemas for near-instant tactical response.
- **Tactical Swarm Simulation:** Concurrent combat synthesis on Node A to prevent stat-drift.
- **Narrative Hive Mind:** Context-aware behavioral mapping grounded in the district-aware world state.

---
*Cyberpunk RED is a trademark of R. Talsorian Games. This project is an independent architectural toolset.*
