# Local Setup: Node B (NixOS/WSL Orchestrator)
### 50V3R31GN-M4CH1N4 v3.0.0 | The Stabilization Milestone

This document details the configuration for **Node B**, the primary narrative and vision orchestrator, unified on **NixOS (WSL 2)**.

---

## 💻 Hardware Prerequisites
- **CPU:** AMD Ryzen 9 5950X (16 Core) for VSB High-Priority Threads.
- **VRAM:** 16GB+ for Resident 12B Director.
- **FS:** Project MUST be in `/home/nixos/` (ext4), NOT `/mnt/d/` (9p).

## 🛠️ Step 1: NixOS Environment Setup
1. **WSL Import:** Ensure NixOS is imported and operational.
2. **Nix Config:** Enable `nix-command` and `flakes` in `/etc/nix/nix.conf`.
3. **Shell:** Enter the directory and run `nix develop`.

## 🚀 Step 2: Build & Installation
```bash
# Enter the Reproducible Env
cd /home/nixos/50v3r31gn-m4ch1n4
nix develop

# Node.js Stack
pnpm install
pnpm build

# Reconstruct Memory Palace
npm run reconstruct

# Build Binaries
cd crush && go build -o ../crush-cli && cd ..
cd deck-igniter && go build -o ../deck-igniter-cli && cd ..
```

## 🧠 Step 3: Model Provisioning
The system uses native `llama-server` for zero-overhead inference and explicit VRAM control.

### Node B (Intelligence)
1. **Download:** Acquire `mistral-nemo:12b-instruct-fp16` in GGUF format.
2. **Place:** Store in `data/models/mistral-nemo-12b.gguf`.
3. **Ignite:** (Managed by `deck-igniter` during boot).

### Node A (Sovereign Judge)
Run the automated setup on Node A:
```bash
bash scripts/setup-node-a.sh
```

## 🌐 Step 4: System Ignition
Once builders and models are ready, fire the system:
```bash
npm run boot
```
Use the **`ctrl+i`** command inside the TUI to start the distributed sequence.

---
**::/5Y573M-N071C3 : UNAUTHORIZED LOGIC DRIFT WILL RESULT IN IMMEDIATE MMU PURGE // 50V3R31GN-M4CH1N4**
