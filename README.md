# ASP.GM-Agent (v1.8.0)
### The Sovereign Highway

ASP.GM-Agent is a production-grade, air-gapped platform designed for the deterministic orchestration of living tabletop environments. Utilizing a dual-node hardware stack and a native Neural Uplink, it provides sub-500ms narrative synthesis grounded in hard-coded physics, raw pixel perception, and the immutable Akashik Record.

```text
   ▄▀█ █▀ █▀█   █▀▀ █▀▄▀█   ▄▀█ █▀▀ █▀▀ █▄ █ ▀█▀
   █▀█ ▄█ █▀▀   █▄█ █ ▀ █   █▀█ █▄█ ██▄ █ ▀█  █ 
   ──────────────── v1.8.0 // THE SOVEREIGN HIGHWAY ───────────────

   [ DIRECTOR: NODE B ] ═══════ [ VSB BUS ] ═══════ [ VAULT: NODE A ]
    AMD R9 5950X (16C)           BINARY MMAP          NVIDIA (4GB)
    16GB RX 9060 XT              UDP MIRROR           Rust + 1B Judge

   > SENSORY : Resident Falcon Perception & Tactical Heat-Maps
   > LORE    : Immutable Akashik Record & L1-Registry Mmap Cache
   > ACTION  : Autonomous Turn Daemon & Neural-Compositor Sync
```

## 🛠️ Technical Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Orchestrator (Node B)** | **director-rs** (Claw-Code fork) + Node.js | Narrative Engine & 16-core task orchestration. |
| **Rules Engine (Node A)** | **zeroclaw** (Claw-Code fork) | Mechanical Engine & resident 1B Rules Judge. |
| **System Bus (VSB)** | Shared Memory (Mmap) + UDP | Dual-bus lock-free state synchronization (sub-1ms). |
| **Layout Engine** | **Pretext (chenglou)** | Zero-reflow narrative overlays rendering at 60fps. |
| **Data Caching** | **ST3GG & L1-Registry** | Immersive steganography and memory-mapped DB mirrors. |
| **Linguistic Engine** | **Skillstone & Glossopetrae (Plinius)** | Procedural dialects and secure Hive coordination channels. |
| **Perception** | CDP (Neural Uplink) | Resident Falcon (0.3B) for raw pixel parity and OCR. |
| **Data Plane** | SQLite (WAL), Shared Memory | Immutable Akashik Record and sub-ms radar telemetry. |

## 🧠 Standout Features

### 🚦 Virtual System Bus (VSB)
Phase 22 introduces a hardware-level **Sovereign Highway**. By utilizing dual-bus memory mapping and binary UDP mirroring, Node A and Node B achieve sub-1ms state synchronization. Node B's 16-core CPU dedicates physical threads to "watch" the memory bus, ensuring zero-latency access to the world state.

### ⚖️ The Mini-Vault (Resident 1B Judge)
By pivoting to a resident **Llama-1B-Instruct** model on Node A, the system eliminates the 8s model-swapping delay. The 1B model acts as a deterministic "Mechanical Judge," air-gapped from the narrative engine to prevent contextual drift and ensure 100% rules adherence.

### 🎨 Pretext Integration (Layout Sovereignty)
Leveraging the **Pretext** engine by **chenglou**, the agent side-steps the DOM entirely. It renders narrative text and UI overlays directly to a detached PIXI.js canvas, achieving 60fps performance without triggering browser reflows, ensuring high-fidelity atmospheric glitches and screamsheets.

### 🗣️ Linguistic Sovereignty (Glossopetrae & Parseltongue)
The system integrates the **Glossopetrae** and **Parseltongue** patterns by **Elder Plinius** for deep NPC identity and covert coordination.
- **Skillstones:** Compact conlang specifications injected into LLM contexts to allow NPCs to speak unique, procedurally generated dialects.
- **Linguistic Steganography (Glossopetrae):** Hides Hive coordination data (e.g., "Flank Left", "Stand Down") directly inside conlang text using 9 covert channels (Synonyms, Word Order, Register Toggles).
- **Parseltongue:** Uses invisible Unicode Tag blocks (U+E0000) to tunnel raw system commands through narrative text.

### 📼 Immersive Caching (ST3GG & Roots)
The system adapts **ST3GG** (LSB Steganography) and **Roots** (Local-first grounding) patterns from **Elder Plinius**. 
- **ST3GG & Self-Describing Maps:** Encodes physical wall coordinates, collision JSON, and scene metadata directly into the Least Significant Bits (LSB) of standard PNG map assets. This ensures map assets are "Self-Describing" and mathematically bound to their mechanical rules, independent of the database.
- **Roots:** Provides a resilient, local-first knowledge graph that ensures NPC memories and district lore remain grounded and accessible during air-gapped operations.

### 🗺️ Tactical-MMU (Spatial Acceleration)
A specialized Rust sidecar on Node A that pre-calculates tactical heat-maps (cover, LOS, movement) directly from the visual buffer. It offloads all spatial "math" from the LLMs, allowing the AI to make O(1) complexity tactical decisions.

### 🎨 Neural-Compositor (Aesthetic Sync)
Leverages Node B's 16-core parallelism to monitor system heartbeat. It automatically injects narrative-aligned visual glitches into the Foundry renderer during hardware latency spikes, masking the "seams" of the distributed system with immersive atmosphere.

## 🚀 Upcoming: Phase 22 (The Sovereign Highway)
Phase 22 finalizes the Procedural OS architecture:
- **VSB Handshake:** Dual-bus binary schema for Node A/B lock-free sync.
- **Sidecar Implementation:** Deployment of Tactical-MMU and L1-Registry drivers.
- **Latency Masking:** 16-core aesthetic synchronization for 100% continuity.

---
*Cyberpunk RED is a trademark of R. Talsorian Games. This project is an independent architectural toolset.*
