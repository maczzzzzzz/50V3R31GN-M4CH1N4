# ❄️ ASP-GM-AGENT v2 ❄️
## 🌌 [ STATUS: SOVEREIGN HIGHWAY ACTIVE // v1.9.0 ] 🌌

```text
   █████╗ ███████╗██████╗      ██████╗ ███╗   ███╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗
  ██╔══██╗██╔════╝██╔══██╗    ██╔════╝ ████╗ ████║     ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
  ███████║███████╗██████╔╝    ██║  ███╗██╔████╔██║     ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   
  ██╔══██║╚════██║██╔═══╝     ██║   ██║██║╚██╔╝██║     ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   
  ██║  ██║███████║██║         ╚██████╔╝██║ ╚═╝ ██║     ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   
  ╚═╝  ╚═╝╚══════╝╚═╝          ╚═════╝ ╚═╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   
```

---

### 🌐 SYSTEM TOPOLOGY
ASP.GM-Agent is an air-gapped, production-grade neural orchestrator for living tabletop environments. Grounded in hard-coded physics and raw pixel perception, it bridges the gap between high-level narrative and low-level mechanical reality.

#### 🏗️ THE DUAL-NODE ARCHITECTURE
```text
╔══════════════════════════════════════════╗       ╔══════════════════════════════════════════╗
║ [ NODE B ] THE DIRECTOR                  ║       ║ [ NODE A ] THE KERNEL (RULES VAULT)      ║
╠══════════════════════════════════════════╣       ╠══════════════════════════════════════════╣
║ > OS: NixOS on WSL 2 (Native FS)         ║       ║ > OS: Linux / Nix Native                 ║
║ > LLM: Resident Mistral-Nemo (12B)       ║       ║ > LLM: Open-Reasoner-Zero-1.5B (Resident)║
║ > GPU: RDNA 4 (AMD) // Vulkan Accelerated║  <═╦═> ║ > GPU: GTX 1050 Ti // CUDA Accelerated   ║
║ > TASK: Narrative, VLM, Orchestration    ║    ║  ║ > TASK: Rules, CV, Mechanical Judge      ║
╚══════════════════════════════════════════╝    ║  ╚══════════════════════════════════════════╝
                                                ║
                                       [ VSB SOVEREIGN HIGHWAY ]
                                       Binary UDP (Cross-Machine)
                                       Shared Memory Mmap (Local)
```

---

### ⚡ CORE TECHNOLOGIES

🔹 **[ TRANSPORT ] VSB Sovereign Highway**
Sub-1ms state synchronization via raw C-style binary UDP datagrams. Node B dedicates physical threads to watch the bus, ensuring zero-latency access to the world state.

🔹 **[ INFERENCE ] Native llama-server**
Ollama overhead eliminated. Both nodes run native `llama-server` (llama.cpp) with explicit VRAM residency via `--mlock`. Node A hosts the **Open-Reasoner-Zero-1.5B** Chain-of-Thought judge.

🔹 **[ SENSORY ] Optical Bridge (Falcon CV)**
Resident Falcon-0.3B perception on Node A extracts physical facts from Foundry VTT pixels via raw CDP capture. Zero-latency spatial heat-maps guide AI tactics.

🔹 **[ VISUALS ] Layout Sovereignty**
Powered by the **Pretext** engine. Narrative overlays and atmospheric glitches render at 60fps directly to a detached PIXI.js canvas, side-stepping DOM reflows entirely.

🔹 **[ STEGO ] ST3GG & Roots**
Hard-coded grounding. Physical wall coordinates and scene metadata are embedded directly into asset pixels using LSB Steganography.

---

### 🩸 DECK IGNITION (QUICK START)

```bash
# 1. Jack into the internal NixOS filesystem
cd /home/nixos/asp-gm-agent

# 2. Synchronize environment (Nix Flake)
# Node B (AMD/Vulkan)
nix develop

# Node A (NVIDIA/CUDA)
nix develop .#cuda

# 3. Boot the Orchestrator
pnpm start
```

---

### 💎 NETWORK NODES (ACKNOWLEDGMENTS)

*   **Elder Plinius**: Root inspirations via [Roots](https://github.com/elder-plinius/R00TS), [Glossopetrae](https://github.com/elder-plinius/GLOSSOPETRAE), and [ST3GG](https://github.com/elder-plinius/ST3GG).
*   **Charmbracelet**: High-fidelity terminal UI components via `lipgloss` and `bubbletea`.
*   **llama.cpp team**: The foundation of our native inference engine.
*   **Foundry VTT**: The physical medium we inhabit.

---
*Cyberpunk RED is a trademark of R. Talsorian Games. This project is an independent architectural toolset.*
