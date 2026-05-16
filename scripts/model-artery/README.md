# Model Artery Provisioning Scripts

## Purpose
Provision GGUF model weights to the Quaternary Mesh nodes from the central Windows repository.

## Architecture
- **Source:** `D:\llama.cpp\models` (Windows Host)
- **Node B (10.0.0.11):** Symlinked via WSL2 mount
- **Node C (100.102.109.81):** Synced via SCP (Carnice-9B-FC i1-Q4_K_M)
- **Node D (100.120.225.12):** Synced via SCP (Carnice MoE 35B Q4_K_M)

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
| Node B | Hermes-4-14B Q4_K_M | Fast response / Code gen | GGUF |
| Node C | Carnice-9B-FC i1-Q4_K_M | Function calling / Tool use | GGUF |
| Node D | Carnice MoE 35B Q4_K_M | Heavy reasoning | GGUF |

## Status
- **Phase:** 0 CLOSED (Validation Gate complete)
- **Execution:** All models deployed and benchmarked
