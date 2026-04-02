# ASP.GM-Agent (v0.9.2)
### The Split-Node TRPG Orchestrator & Living City Engine

ASP.GM-Agent is a next-generation, local-first AI Game Master platform designed for ultra-immersive tabletop orchestration. While originally conceived for **Cyberpunk RED**, it has evolved into a robust, air-gapped tech stack for any d10-based rules system requiring high-fidelity spatial awareness and deterministic world simulation.

## 🏗️ The Split-Node Architecture
The system operates across two dedicated hardware nodes to balance cognitive load:

- **Node A (Rules Authority):** A high-performance Rust-native rules engine (**ZeroClaw**) running on Ubuntu (Nitro 5). Uses **Bonsai 8B (1-bit)** for zero-lag mathematical grounding and geometric map parsing.
- **Node B (Narrative Orchestrator):** The primary Windows rig (RDNA 4) running **Mistral-Nemo 12B (FP8)** for high-speed storytelling and **LLava 1.6** for semantic tactical vision.

## ⚡ Key Technologies
- **ClawLink (Binary Transport):** Persistent TCP binary sockets with <10ms transport latency between nodes.
- **Project "Eyes-On" (Computer Vision):** A dual-node pipeline combining Rust-native edge detection (Node A) with semantic region identification (Node B LLava) to give the AI "Eyes" on the battle map.
- **Pulse Engine (Deterministic Simulation):** A world heartbeat powered by recursive SQLite triggers (Chebyshev decay) for faction influence and NPC agenda automation.
- **Dice So Nice (Immersion):** Visual 3D rolls in Foundry VTT synchronized with Node A's deterministic results.

## 📁 Repository Structure
- `/src`: Node B TypeScript Orchestrator (Ollama, SQLite, Foundry Bridge).
- `/zeroclaw`: Node A Rust Rules Engine & CV Pipeline.
- `/foundry-module`: Foundry VTT v12 WebSocket bridge.
- `/docs`: Technical audits, specs, and setup guides.
- `/tests`: 237+ TDD-verified test cases (100% baseline stability).

## 🚀 Quick Start
1. **Provision Node A:** Install Rust 1.94+ and Ollama (Bonsai 8B). Build `/zeroclaw`.
2. **Provision Node B:** Install Node.js 22+, Ollama (Mistral-Nemo & LLava), and SQLite.
3. **Bridge Foundry:** Install the module in `/foundry-module` and configure the Node B URL.
4. **Ignite:** Run `npm start` on Node B and `./target/release/zeroclaw` on Node A.

## ⚖️ License
AIR-GAPPED. LOCAL-FIRST. IMMERSIVE.
*Cyberpunk RED is a trademark of R. Talsorian Games. This project is a third-party architectural tool.*
