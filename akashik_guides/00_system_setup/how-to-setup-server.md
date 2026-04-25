# Server Setup: Node A (Rules Vault)
### 50V3R31GN-M4CH1N4 v3.7.0 | Node A (Linux) Setup Guide

This document details the configuration for **Node A**, the secondary rules and geometry vault.

---

## 💻 Hardware Prerequisites
- **Machine:** Nitro 5 / 1050 Ti (NVIDIA 4GB).
- **Isolation:** Must be on the same local LAN as Node B.

## 🛠️ Step 1: Immutable Environment (Nix)
1. **Install Nix:** `curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh`.
2. **Enable Flakes:** Add `experimental-features = nix-command flakes` to `nix.conf`.
3. **Ignite Vault:**
   ```bash
   nix develop .#cuda
   ```

## 🧠 Step 2: Model Provisioning
The models are stored locally as GGUF/ONNX files for native inference.
```bash
# Verify the models exist
ls -lh zeroclaw/models/Open-Reasoner-Zero-1.5B.Q8_0.gguf
ls -lh zeroclaw/models/falcon-0.3b-ocr.onnx
```

## 🏗️ Step 3: Ignition & Residency
We use native `llama-server` for zero-overhead inference and explicit VRAM control.
```bash
bash zeroclaw/scripts/setup-resident-models.sh
```

## 🏗️ Step 4: Build & Sandbox
1. **Build:** `cargo build --release`.
2. **Sandbox Setup:** Install `bubblewrap` (`sudo apt install bubblewrap`).
3. **Deploy Service:** Copy `docs/zeroclaw.service` to `/etc/systemd/system/`.
   - *This service automatically jails the process via `--unshare-net`.*

## 🎲 Step 5: Ignition
```bash
sudo systemctl enable --now zeroclaw
```

## ⚠️ Stability
- **Physics Constitution:** Ensure `RED_RULES.md` is present in the `zeroclaw/` directory.
- **Port:** ZeroClaw listens on `0.0.0.0:7878` for binary RPC calls.
Process Group PGID: 580679


---
**LINKS:** [[00_system_setup]] | [[OS_CORE]]
