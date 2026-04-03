# Local Setup: Node B (Windows Orchestrator)
### ASP.GM-Agent v1.6.0 | The Neural Hive

This document details the configuration for **Node B**, the primary narrative and vision orchestrator in the v1.6.0 ecosystem.

---

## 💻 Hardware Prerequisites
- **GPU:** AMD RDNA 4 (RX 8800+) or NVIDIA (RTX 4070+) with **16GB+ VRAM**.
- **Perception:** Foundry VTT must be capable of launching with **Port 9222** open.

## 🛠️ Step 1: Software Prerequisites
1. **Node.js (v22.0+):** [Download](https://nodejs.org/)
2. **Ollama (v0.5.0+):** [Download](https://ollama.com/)
3. **Dependencies:** `npm install`.

## 🚀 Step 2: Environment Configuration
Create a `.env` file and synchronize with the **v1.6.0** baseline:

```env
# Node B (Orchestrator)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_KV_CACHE_TYPE=q4_0
OLLAMA_NUM_CTX=32768

# Neural Hive (Foundry Electron)
FOUNDRY_DEBUG_PORT=9222

# Akashik Record (Universal Truth)
AKASHIK_DB_PATH=./data/Akashik.db
CRUSH_DB_PATH=./.crush/crush.db

# RDNA 4 / Vulkan Optimizations
OLLAMA_VULKAN=1
OLLAMA_LLM_LIBRARY=vulkan
```

## 🧠 Step 3: Model Provisioning
```bash
ollama pull mistral-nemo:12b-instruct-fp16
ollama pull llava:13b-v1.6-vicuna-q4_k_m
```

## 🏗️ Step 4: Installation & Build
```bash
npm install
npm run build
cd sidecar-atlas && cargo build --release
```

## 🎲 Step 5: Start Loop
1. Launch Foundry with `--remote-debugging-port=9222`.
2. `npm start`.
3. `sidecar-atlas/target/release/sidecar-atlas.exe`.
