# Server Setup: Node A (Rules Vault)
### ASP.GM-Agent v1.1.2 | Node A (Linux) Setup Guide

This document details the configuration for **Node A**, the secondary rules and geometry vault.

---

## 💻 Hardware Prerequisites
- **Machine:** Nitro 5 / 1050 Ti (NVIDIA 4GB).
- **Isolation:** Must be on the same local LAN as Node B.

## 🛠️ Step 1: Immutable Environment (Nix)
1. **Install Nix:** `curl -L https://nixos.org/nix/install | sh`.
2. **Enable Flakes:** Add `experimental-features = nix-command flakes` to `nix.conf`.
3. **Ignite Vault:**
   ```bash
   cd zeroclaw
   nix develop
   ```

## 🧠 Step 2: Model Provisioning
```bash
ollama pull llama3.2:3b
```

## 🏗️ Step 3: Build & Sandbox
1. **Build:** `cargo build --release`.
2. **Sandbox Setup:** Install `bubblewrap` (`sudo apt install bubblewrap`).
3. **Deploy Service:** Copy `docs/zeroclaw.service` to `/etc/systemd/system/`.
   - *This service automatically jails the process via `--unshare-net`.*

## 🎲 Step 4: Ignition
```bash
sudo systemctl enable --now zeroclaw
```

## ⚠️ Stability
- **Physics Constitution:** Ensure `RED_RULES.md` is present in the `zeroclaw/` directory.
- **Port:** ZeroClaw listens on `0.0.0.0:7878` for binary RPC calls.
