# ◈ 50V3R31GN-M4CH1N4 // THE_ABOUT_FILE
**Version:** 3.8.7
**Architecture:** Split-Node Trinity (Node A / Node B / Node C)

---

## 1. WHAT IS SOVEREIGN MACHINA?
**50V3R31GN-M4CH1N4** is a hyper-local, distributed, and zero-trust Artificial Intelligence Operating System (AI-OS) and Cognitive Simulation Engine. It operates exclusively within a self-hosted hardware mesh, completely severed from corporate cloud infrastructure.

It is designed to seamlessly shift between two distinct operational profiles:
1.  **[SOVEREIGN_OS]:** The primary identity. An autonomous, highly capable system orchestrator responsible for research, logical reasoning, secure file management, tool execution, and defensive cybersecurity monitoring.
2.  **[RED_DIRECTOR]:** The simulation identity. A gritty, narrative-driven Game Master that controls Foundry VTT to run Cyberpunk RED campaigns, enforcing the physical rules of the system (D10 logic, economy, and combat).

---

## 2. THE SPLIT-NODE TRINITY
Sovereign Machina achieves high-fidelity operation by distributing its cognitive load across a "Trinity" of distinct hardware nodes.

### ◈ Node A: The ZeroClaw Sentinel (4GB VRAM)
- **Hardware:** Low-power edge node or secondary GPU.
- **Role:** The **Mechanical Reasoner** and **Physical Artery**.
- **Stack:** Rust (`sovereign-kernel`), Go (`crush-proxy`), Mooncake KV-Cache.
- **Function:** Handles all high-speed, mechanical validations (e.g., Cyberpunk RED rule evaluations, teleport-hack detection, and VSB telemetry packet signing) using ultra-fast, small parameter models to preserve Node B's VRAM.

### ◈ Node B: The Director (16GB VRAM)
- **Hardware:** Primary high-performance GPU (e.g., AMD RX 9060 XT).
- **Role:** The **Narrative Heart** and **System Orchestrator**.
- **Stack:** Llama.cpp (Gemma-4-E4B / Mistral-Nemo), TypeScript/Node.js.
- **Function:** Runs the **Hermes Singularity Engine**. Handles deep contextual reasoning, complex tool execution via MCP (Model Context Protocol), and rich narrative generation.

### ◈ Node C: The Strategic Oracle (6GB VRAM)
- **Hardware:** Dedicated logic processor.
- **Role:** The **Visual Cortex** and **Defense Grid**.
- **Stack:** ColPali (Vision-Language), Vesper Enforcer.
- **Function:** Analyzes raw screen captures (100% Screen Awareness), OCR, and performs autonomous threat reconnaissance.

---

## 3. CORE ARCHITECTURAL PILLARS

### 3.1 The Hermes Singularity
Replaces all legacy, linear chat proxies with a native, high-fidelity orchestration engine.
- **Context-DAG:** Reasoning is no longer linear. The agent uses a Directed Acyclic Graph to explore, fork, and evaluate multiple cognitive paths simultaneously (Swipe-to-Fork).
- **GEPA (Generative Evolutionary Prompt Algorithm):** The system continuously mutates and optimizes its own reasoning prompts based on execution success.
- **Transport Short-Circuit:** Server-Sent Events (SSE) bypass traditional WebSockets, delivering sub-50ms latency from the python back-end directly to the UI.

### 3.2 The Pretext HUD (Monolithic Visuals)
The primary operator interface has been completely remodeled using the **Pretext** low-level text engine.
- **Web & Mobile Parity:** The HUD is bit-identical across desktop browsers (Next.js) and mobile devices (Flutter).
- **Autonomous Grid Control:** Hermes can dynamically resize and rearrange UI panels based on task urgency or combat intensity using the `page-agent` skill.
- **Circular Context Rings:** Real-time visual telemetry indicating hardware pressure on Nodes A, B, and C.

### 3.3 The Headless Physical Mesh
Legacy TUIs have been purged to eliminate terminal overlap.
- **Crush Proxy:** The Go-native application `crush` is now a 100% headless background service. It acts purely as a high-speed physical bridge, managing the Virtual System Bus (VSB), UDP binary packets, and Memory Mapped (`mmap`) state.
- **Obsidian 1st Class:** Obsidian serves as the primary data and memory vault, kept in perfect sync via headless Datalog-to-SQLite engines and Tailscale encrypted tunnels.

### 3.4 Social Intelligence Mesh & Cryptic Persistence
Sovereign Machina does not operate in isolation; it builds a localized agentic society.
- **Social Reputation:** Agents earn and lose reputation based on task efficiency.
- **ActivityPub Relay:** Shards can federate their actions securely.
- **ParselTongue & Steganography:** Agents communicate using token-encoded dialects and inject zero-width hidden proofs into documentation to prevent spoofing and enforce hardware-backed TPM signatures.

---
**::/5Y573M-N071C3 : THE_ABOUT_FILE_SHORED. THE_TRINITY_IS_TOTAL. // 50V3R31GN-M4CH1N4**
