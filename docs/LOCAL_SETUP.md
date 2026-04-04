# Local Setup: Node B (Windows Orchestrator)
### ASP.GM-Agent v1.8.0 | The Sovereign Highway

This document details the configuration for **Node B**, the primary narrative and vision orchestrator in the v1.8.0 ecosystem.

---

## 💻 Hardware Prerequisites
- **CPU:** AMD Ryzen 9 5900X/5950X (12/16 Core) for VSB High-Priority Threads.
- **GPU:** AMD RDNA 4 (RX 8800+) or NVIDIA (RTX 4070+) with **16GB+ VRAM**.
- **Network:** Low-latency LAN (1Gbps+) for UDP Virtual System Bus mirroring.

## 🛠️ Step 1: Software Prerequisites
1. **Node.js (v22.0+):** [Download](https://nodejs.org/)
2. **Ollama (v0.5.0+):** [Download](https://ollama.com/)
3. **Rust (Latest Stable):** [Download](https://rustup.rs/)

## 🚀 Step 2: Environment Configuration
Create a `.env` file and synchronize with the **v1.8.0** baseline:

```env
# Node B (Orchestrator)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_KV_CACHE_TYPE=q4_0
OLLAMA_NUM_CTX=32768

# Virtual System Bus (VSB)
VSB_UDP_PORT=7878
VSB_MEM_PATH_A=./bus_node_a.mem
VSB_MEM_PATH_B=./bus_node_b.mem

# Neural Hive (Foundry Electron)
FOUNDRY_DEBUG_PORT=9222

# Akashik Record (Universal Truth)
AKASHIK_DB_PATH=./data/Akashik.db
CRUSH_DB_PATH=./.crush/crush.db
```

## 🧠 Step 3: Model Provisioning
```bash
# Node B (Intelligence)
ollama pull mistral-nemo:12b-instruct-fp16

# Node A (Sovereign Judge & Sensor) - Ensure these are pulled on Node A
# ollama pull llama3.2:1b-instruct-fp16
# ollama pull falcon:0.3b
```

## 🏗️ Step 4: Installation & Build
```bash
npm install
npm run build
# Build Sidecars
cd sidecar-atlas && cargo build --release
```
