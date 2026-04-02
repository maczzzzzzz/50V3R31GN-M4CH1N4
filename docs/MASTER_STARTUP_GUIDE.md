# Master Startup Guide: ASP.GM-Agent (v1.0.4)
### Hardened Split-Node Initialization

This document provides the high-fidelity operational sequence for igniting the **Split-Node v1.0.4** TRPG infrastructure.

---

## 🏗️ Hardware Check
- **Node A (Rules Authority):** Ubuntu 24.04 (Nitro 5 / 1050 Ti). Dedicated Rules & Geometry.
- **Node B (Orchestrator):** Windows (AMD RX 9060 XT 16GB). Dedicated Narrative & Vision.

## 🚀 Step 1: Initialize Node A (ZeroClaw)
1. **Connect via SSH:** `ssh <user>@192.168.0.50`
2. **Environment:** Ensure Rust 1.94+ and Ollama 0.19.0 are installed.
3. **Model:** `ollama pull llama3.2:3b` (Optimized for 4GB VRAM).
4. **Build:** `cd zeroclaw && cargo build --release`.
5. **Ignite:** `sudo systemctl start zeroclaw`.
   - *Verify: `systemctl status zeroclaw` should be active (running).*

## 🚀 Step 2: Initialize Node B (The Orchestrator)
1. **Environment:** Ensure Node.js 22.0+ is installed.
2. **Models:**
   - `ollama pull mistral-nemo:12b-instruct-fp16` (Narrative).
   - `ollama pull llava:7b` (Tactical Vision).
3. **Optimization:** Verify `.env` contains `OLLAMA_KV_CACHE_TYPE=q4_0` and `OLLAMA_NUM_CTX=32768`.
4. **Ignite:** `npm start`.
   - *Verify: Node B connects to Node A via the binary ClawLink socket.*

## 🚀 Step 3: Bridge Foundry VTT (Project Eyes-On)
1. **Install Module:** Copy `/foundry-module` to your Foundry data directory.
2. **Configure Settings:** Navigate to Module Settings → Node B WebSocket URL (Default: `ws://localhost:3010`).
3. **Verify Link:** Check Foundry chat for: `🟢 Link Established — ASP.GM-Agent Orchestrator (v1.0.4) is now online.`

## 🎲 Step 4: Quality of Life (Dice So Nice)
1. **Enable DsN:** Ensure the **Dice So Nice** module is active in Foundry.
2. **Synchronize:** All AI-driven rolls from Node B will now trigger visual 3D dice that match Node A's deterministic results.

## ⚠️ Troubleshooting
- **Connection Refused:** Check firewall rules on Node A (Port 7878) and Node B (Port 3010).
- **VRAM OOM:** Reduce `OLLAMA_NUM_CTX` on Node B if loading both Mistral-Nemo and LLava exceeds 16GB.
- **Vulkan Discovery Hang:** Ensure `OLLAMA_LLM_LIBRARY=vulkan` is set in Node B's environment for AMD RDNA 4.
