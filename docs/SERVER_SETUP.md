# SERVER_SETUP (v0.9.0) - Node A (Nitro 5)
**Date:** Wednesday, April 1, 2026

This guide covers the setup for the **Node A Rules Authority** running on Ubuntu Server 24.04.

## 1. Hardware Architecture
- **CPU:** Intel i5-9300H
- **GPU:** NVIDIA GTX 1050 Ti (4GB VRAM)
- **OS:** Headless Ubuntu 24.04 LTS

## 2. Global Dependencies
Install the standard build tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential pkg-config libssl-dev git curl
```

### 2.1 Rust (v1.80+)
Install the Rust toolchain:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2.2 CUDA & Vulkan
Install the NVIDIA drivers and Vulkan runtime for `llama.cpp` offloading:
```bash
sudo apt install -y nvidia-driver-535 libvulkan1 vulkan-tools
```

---

## 3. ZeroClaw Installation

### 3.1 Build from Source
1. Clone the project and navigate to `zeroclaw/`.
2. Build the high-performance release binary:
   ```bash
   cargo build --release
   ```

### 3.2 Rules Seeding
Initialize the SQLite rules database:
```bash
./target/release/zeroclaw --seed ../docs/raw_data/core_rules/
```

---

## 4. Execution & Bridge
The Rules Authority runs as a native service listening for **ClawLink** requests from Node B.

### 4.1 Manual Boot
```bash
./target/release/zeroclaw --host 0.0.0.0 --port 7878
```

### 4.2 Systemd Persistence (Recommended)
Create `/etc/systemd/system/zeroclaw.service`:
```ini
[Unit]
Description=ZeroClaw Rules Authority
After=network.target

[Service]
Type=simple
User=maczz
WorkingDirectory=/home/maczz/asp-gm-agent/zeroclaw
ExecStart=/home/maczz/asp-gm-agent/zeroclaw/target/release/zeroclaw --host 0.0.0.0 --port 7878
Restart=always

[Install]
WantedBy=multi-user.target
```

**Status:** HARDENED. 🟢
