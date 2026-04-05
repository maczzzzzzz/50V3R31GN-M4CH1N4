# ASP.GM-Agent (v1.8.0)
### The Sovereign Highway

ASP.GM-Agent is a production-grade, air-gapped platform designed for the deterministic orchestration of living tabletop environments. Utilizing a dual-node hardware stack and a native Neural Uplink, it provides sub-1ms narrative synthesis grounded in hard-coded physics, raw pixel perception, and the immutable Akashik Record.

```text
   ▄▀█ █▀ █▀█   █▀▀ █▀▄▀█   ▄▀█ █▀▀ █▀▀ █▄ █ ▀█▀
   █▀█ ▄█ █▀▀   █▄█ █ ▀ █   █▀█ █▄█ ██▄ █ ▀█  █ 
   ──────────────── v1.8.0 // THE SOVEREIGN HIGHWAY ───────────────

   [ DIRECTOR: NODE B ] ═══════ [ VSB BUS ] ═══════ [ VAULT: NODE A ]
    Ryzen 5950X (16C)            BINARY UDP           NVIDIA (4GB)
    NixOS on WSL 2               MMAP MIRROR          Rust + 1B Judge

   > SENSORY : Resident Falcon Perception & ST3GG Grounding
   > LORE    : Immutable Akashik Record & L1-Registry Mmap Cache
   > ACTION  : Autonomous Turn Daemon & Neural-Compositor Sync
```

## 🏗️ Architecture (v1.8.0)
- **Node A (The Rules Vault):** NVIDIA GTX 1050 Ti. Resident **Open-Reasoner-Zero-1.5B** + **Falcon CV**. (OS: Linux/Nix).
- **Node B (The Director):** Ryzen 5950X. Resident **12B Mistral-Nemo**. (**OS: NixOS on WSL 2**).
- **VSB (Virtual System Bus):** Sub-1ms state sync via **Binary UDP** (Cross-Node) and **Mmap** (Local Sidecars).

## 🚀 Quick Start (Node B - WSL)
```bash
# Enter the native Linux filesystem
cd /home/nixos/asp-gm-agent

# Activate the reproducible environment
nix-shell

# Install dependencies and build
pnpm install
pnpm build
```

## 🛠️ Components
- **`zeroclaw`**: Rust-native mechanical authority (Node A).
- **`director-rs`**: Distributed narrative orchestrator (Node B).
- **`crush`**: Charmbracelet CLI master terminal (Node B).
- **`sidecar-atlas`**: Egui strategic radar HUD (Node B).

## 🧠 Standout Features

### 🚦 Virtual System Bus (VSB)
Phase 22 introduces a hardware-level **Sovereign Highway**. By utilizing binary UDP mirroring and local memory mapping, Node A and Node B achieve sub-1ms state synchronization. Node B's 16-core CPU dedicates physical threads to "watch" the network bus, ensuring zero-latency access to the world state.

### ⚖️ The Mini-Vault (Resident 1B Judge)
By pivoting to a resident **Open-Reasoner-Zero-1.5B** model on Node A, the system eliminates the 8s model-swapping delay. The 1B model acts as a deterministic "Mechanical Judge," air-gapped from the narrative engine to prevent contextual drift and ensure 100% rules adherence.

### 🎨 Pretext Integration (Layout Sovereignty)
Leveraging the **Pretext** engine, the agent side-steps the DOM entirely. It renders narrative text and UI overlays directly to a detached PIXI.js canvas, achieving 60fps performance without triggering browser reflows, ensuring high-fidelity atmospheric glitches and screamsheets.

### 📼 Immersive Caching (ST3GG & Roots)
The system adapts **ST3GG** (LSB Steganography) and **Roots** patterns for deep NPC identity and covert coordination. 
- **ST3GG & Self-Describing Maps:** Encodes physical wall coordinates, collision JSON, and scene metadata directly into the Least Significant Bits (LSB) of standard PNG map assets. 
- **Roots:** Provides a resilient, local-first knowledge graph that ensures NPC memories and district lore remain grounded and accessible during air-gapped operations.

## 🚀 Upcoming: Phase 22.5 (Cross-Node Stabilization)
Phase 22.5 finalizes the distributed Procedural OS architecture:
- **VSB Handshake:** Binary UDP schema for Node A/B sub-1ms sync.
- **Model Residency:** Lock-in of 1B and Falcon models on physical hardware.
- **Agentic Physicality:** Launch of the Phase 23 Neural World Engine.

---
*Cyberpunk RED is a trademark of R. Talsorian Games. This project is an independent architectural toolset.*
