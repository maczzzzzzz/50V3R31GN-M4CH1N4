# Model Artery Provisioning Scripts

## Purpose
Provision GGUF model weights to the Quaternary Mesh nodes from the central Windows repository.

## Architecture
- **Source:** `D:\llama.cpp\models` (Windows Host)
- **Node B (10.0.0.11):** Symlinked via WSL2 mount
- **Node C (10.0.0.12):** Synced via SCP (Carnice-9B)
- **Node D (10.0.0.13):** Synced via SCP (Qwen2.5-Coder-14B)

## Execution Order

### 1. Node B Setup (Run locally on Node B)
```bash
chmod +x scripts/model-artery/node-b-setup.sh
sudo ./scripts/model-artery/node-b-setup.sh
```

### 2. Sync to Node C (Run from Node B)
```bash
chmod +x scripts/model-artery/sync-to-node-c.sh
./scripts/model-artery/sync-to-node-c.sh
```

### 3. Sync to Node D (Run from Node B)
```bash
chmod +x scripts/model-artery/sync-to-node-d.sh
./scripts/model-artery/sync-to-node-d.sh
```

## Verification
All scripts perform SHA-256 integrity checks after transfer.

## Model Mapping

| Node | Model | Purpose | Format |
|------|-------|---------|-------------|
| Node C | Qwen3.5-0.8B | Perceptual Triage | GGUF (Q8_0) |
| Node C | VoxCPM2-Indic-Q4 | Text-to-Speech | Directory (Safetensors) |
| Node D | Qwen2.5-Coder-14B | Heavy Reasoning | GGUF (Q6_K_M) |
| Node D | Qwen2.5-Coder-14B | Structural Logic | GGUF (Q6_K) |

## Status
- **Phase:** 1 (Hermes-First Core Foundation)
- **Execution:** Pending (requires Gemini CLI to move Windows models first)
