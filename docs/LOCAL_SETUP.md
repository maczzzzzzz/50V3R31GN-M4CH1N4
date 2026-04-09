# Local Setup: Node B (NixOS/WSL Orchestrator)
### 50V3R31GN-M4CH1N4 v1.9.0 | The Sovereign Highway Stabilization

This document details the configuration for **Node B**, the primary narrative and vision orchestrator, now unified on **NixOS (WSL 2)**.

---

## 💻 Hardware Prerequisites
- **CPU:** AMD Ryzen 9 5950X (16 Core) for VSB High-Priority Threads.
- **VRAM:** 16GB+ for Resident 12B Director.
- **FS:** Project MUST be in `/home/nixos/` (ext4), NOT `/mnt/d/` (9p).

## 🛠️ Step 1: NixOS Environment Setup
1. **WSL Import:** Ensure NixOS is imported and operational.
2. **Nix Config:** Enable `nix-command` and `flakes` in `/etc/nix/nix.conf`.
3. **Shell:** Enter the directory and run `nix-shell`.

## 🚀 Step 2: Build & Installation
```bash
# Enter the Reproducible Env
cd /home/nixos/50v3r31gn-m4ch1n4
nix-shell

# Node.js Stack
pnpm install
pnpm approve-builds better-sqlite3 esbuild
pnpm build

# Rust Sidecars
cd sidecar-atlas && cargo build --release
cd ../zeroclaw && cargo build --release

# Go CLI
cd ../crush && go build -o crush
```

## 🧠 Step 3: Model Provisioning
The system now uses native `llama-server` for zero-overhead inference and explicit VRAM control.

### Node B (Intelligence)
1. **Download:** Acquire `mistral-nemo:12b-instruct-fp16` in GGUF format.
2. **Place:** Store in `data/models/mistral-nemo-12b.gguf`.
3. **Ignite:**
```bash
llama-server -m data/models/mistral-nemo-12b.gguf -c 8192 --port 8080 --mlock
```

### Node A (Sovereign Judge)
Run the automated script on Node A:
```bash
bash zeroclaw/scripts/setup-resident-models.sh
```

## 🌐 Step 4: Network Verification
Ensure Node B can reach Node A (192.168.0.50) via UDP Port 7878.
```bash
ping 192.168.0.50
```
