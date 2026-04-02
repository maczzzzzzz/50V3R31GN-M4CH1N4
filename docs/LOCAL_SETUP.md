# Local Setup: Node B (Windows Orchestrator)
### ASP.GM-Agent v0.9.2 | Node B Setup Guide

This document details the configuration for **Node B**, the primary Windows-based narrative and vision orchestrator.

---

## 💻 Hardware Prerequisites
- **OS:** Windows 10/11 Pro (64-bit).
- **CPU:** High-performance multicore (AMD Ryzen 7+ or Intel i7+ recommended).
- **GPU:** NVIDIA (RTX 3080+) or AMD (RX 6800+) with **12GB+ VRAM**.
- **Memory:** 32GB+ System RAM.
- **Storage:** NVMe SSD for fast RKG/Crush database I/O.

## 🛠️ Step 1: Software Prerequisites
1. **Node.js (v22.0+):** [Download](https://nodejs.org/)
2. **Git:** [Download](https://git-scm.com/)
3. **Ollama:** [Download](https://ollama.com/)
4. **Build Tools:** Install `npm install --global windows-build-tools` (for `better-sqlite3` native bindings).

## 🚀 Step 2: Environment Configuration
Create a `.env` file in the root directory and synchronize it with the following high-performance parameters:

```env
# Node B (Orchestrator - This Rig)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_KV_CACHE_TYPE=q4_0
OLLAMA_FLASH_ATTENTION=true
OLLAMA_NUM_CTX=32768

# AMD RDNA 4 (RX 9060 XT) Optimizations
OLLAMA_VULKAN=1
OLLAMA_LLM_LIBRARY=vulkan
GGML_VK_VISIBLE_DEVICES=0

# Database Persistence (WAL Mode)
WORLD_DB_PATH=./world.db
CRUSH_DB_PATH=./.crush/crush.db
```

## 🧠 Step 3: Model Provisioning
Run the following commands to provision the narrative and vision models:

```bash
ollama pull mistral-nemo:12b-instruct-fp16  # High-fidelity narrative
ollama pull llava:7b                       # Tactical Vision (Project Eyes-On)
ollama pull nomic-embed-text               # RKG Vector Embeddings
```

## 🏗️ Step 4: Installation & Build
```bash
git clone https://github.com/maczzzzzzz/-asp-gm-agent.git
cd -asp-gm-agent
npm install
npm run build
```

## 🎲 Step 5: Start Orchestrator
```bash
npm start
```
Node B will now attempt to connect to the **Node A Rules Authority** (ZeroClaw) and the **Foundry VTT Bridge**. Verify the console output for **"Link Established"** logs.

## ⚠️ Performance Tuning
- **Latency Check:** Ensure sub-500ms narrative generation. If slow, verify Vulkan acceleration is active via `ollama ps`.
- **VRAM Monitor:** If OOM occurs, reduce `OLLAMA_NUM_CTX` to `16384`.
