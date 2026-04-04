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
| **Orchestrator (Node B)** | Node.js v22, Mistral-Nemo (12B) | Narrative synthesis and 16-core task orchestration. |
| **Rules Engine (Node A)** | Rust (ZeroClaw), Llama 3.2 (1B) | Mathematical authority and resident 1B Rules Judge. |
| **System Bus (VSB)** | Shared Memory (Mmap) + UDP | Dual-bus lock-free state synchronization (sub-1ms). |
| **Layout Engine** | **Pretext (chenglou)** | Zero-reflow narrative overlays rendering at 60fps. |
| **Data Caching** | **ST3GG & L1-Registry** | Immersive steganography and memory-mapped DB mirrors. |
| **Linguistic Engine** | **Skillstone & Glossopetrae** | Procedural dialects and secure Hive coordination channels. |
| **Perception** | CDP (Neural Uplink) | Resident Falcon (0.3B) for raw pixel parity and OCR. |
| **Data Plane** | SQLite (WAL), Shared Memory | Immutable Akashik Record and sub-ms radar telemetry. |

## 🧠 Standout Features

### 🚦 Virtual System Bus (VSB)
Phase 22 introduces a hardware-level **Sovereign Highway**. By utilizing dual-bus memory mapping and binary UDP mirroring, Node A and Node B achieve sub-1ms state synchronization. Node B's 16-core CPU dedicates physical threads to "watch" the memory bus, ensuring zero-latency access to the world state.

### ⚖️ The Mini-Vault (Resident 1B Judge)
By pivoting to a resident **Llama-1B-Instruct** model on Node A, the system eliminates the 8s model-swapping delay. The 1B model acts as a deterministic "Mechanical Judge," air-gapped from the narrative engine to prevent contextual drift and ensure 100% rules adherence.

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
