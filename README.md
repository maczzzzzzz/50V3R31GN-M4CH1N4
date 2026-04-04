# ASP.GM-Agent (v1.7.0)
### The Neural Hive

ASP.GM-Agent is a production-grade, air-gapped platform designed for the deterministic orchestration of living tabletop environments. Utilizing a dual-node hardware stack and a native Neural Uplink, it provides sub-500ms narrative synthesis grounded in hard-coded physics, raw pixel perception, and the immutable Akashik Record.

```text
   ▄▀█ █▀ █▀█   █▀▀ █▀▄▀█   ▄▀█ █▀▀ █▀▀ █▄ █ ▀█▀
   █▀█ ▄█ █▀▀   █▄█ █ ▀ █   █▀█ █▄█ ██▄ █ ▀█  █ 
   ────────────────── v1.7.0 // THE NEURAL HIVE ──────────────────

   [ DIRECTOR: NODE B ] ═══════ [ CLAWLINK ] ═══════ [ VAULT: NODE A ]
    AMD RDNA 4 (16GB)            BINARY BUS           NVIDIA (4GB)
    Node.js Orchestrator         TCP/IP SYNC          Rust Rules Vault

   > SENSORY : Visual Perception, OCR, and LOS Filtering
   > LORE    : Immutable Akashik Record & Local-First RAG
   > ACTION  : Reactive Swarm Intelligence & Turn Daemon
```

## 🛠️ Technical Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Orchestrator (Node B)** | Node.js v22, Mistral-Nemo | Narrative synthesis and multi-node task routing. |
| **Rules Engine (Node A)** | Rust (ZeroClaw), Llama 3.2 | Mathematical authority and geometric CV pass. |
| **Layout Engine** | **Pretext (chenglou)** | Zero-reflow narrative overlays rendering at 60fps. |
| **Data Caching** | **ST3GG & Roots (Elder Plinius)** | Immersive steganography and local-first lore grounding. |
| **Linguistic Engine** | **Skillstone & Glossopetrae** | Procedural dialects and secure Hive coordination channels. |
| **Perception** | CDP (Neural Uplink) | Raw GPU rendering buffer capture and CSS injection. |
| **Data Plane** | SQLite (WAL), Shared Memory | Immutable Akashik Record and sub-ms radar telemetry. |
| **Bridge** | ClawLink (TCP Binary) | High-speed state synchronization between Node A and B. |

## 🧠 Standout Features

### 🎨 Pretext Integration (Layout Sovereignty)
Leveraging the **Pretext** engine by **chenglou**, the agent side-steps the DOM entirely. It renders narrative text and UI overlays directly to a detached PIXI.js canvas, achieving 60fps performance without triggering browser reflows, ensuring high-fidelity atmospheric glitches and screamsheets.

### 🗣️ Linguistic Sovereignty (Dialects & Secret Channels)
The system integrates **Skillstones** and the **Glossopetrae** pattern for deep NPC identity.
- **Skillstones:** Compact conlang specifications injected into LLM contexts to allow NPCs to speak unique, procedurally generated dialects fluent to their faction or district.
- **Linguistic Steganography:** Hides Hive coordination data (e.g., "Flank Left", "Stand Down") directly inside conlang text using 9 covert channels (Synonyms, Word Order, Register Toggles).

### 📼 Immersive Caching (ST3GG & Roots)
The system adapts **ST3GG** (LSB Steganography) and **Roots** (Local-first grounding) patterns from **Elder Plinius**. 
- **ST3GG:** Encodes dynamically generated lore and secrets into standard PNG assets ("Self-Describing Maps") for players to decrypt in-character.
- **Roots:** Provides a resilient, local-first knowledge graph that ensures NPC memories and district lore remain grounded and accessible during air-gapped operations.

### 👁️ Neural Uplink (Hardware Perception)
Bypasses the Foundry VTT API sandbox via the **Chrome DevTools Protocol (CDP)**. The agent has "physical eyes" on the game, capturing raw GPU buffers for 1:1 pixel parity with the GM's screen and injecting narrative glitches via real-time CSS patchers.

### 🚦 TaskRouterProxy (CLIProxyAPI Pattern)
Intelligent hardware management for strict VRAM constraints. It intercepts and queues "Light" tasks (Math, OCR, Stego) when Node A is busy swapping high-parameter vision models.

## 🚀 Upcoming: Phase 21 (Total Autonomy)
Phase 21 finalizes the Neural Hive with self-directed NPC agents:
- **Autonomous Turn Daemon:** 4-stage agentic loop (Reason -> Intent -> Action -> Validate).
- **Tactical Swarm Simulation:** Concurrent combat resolution on Node A to prevent narrative drift.
- **Life-Path Persistence:** Long-term memory and historical grounding for behavioral consistency.

---
*Cyberpunk RED is a trademark of R. Talsorian Games. This project is an independent architectural toolset.*
