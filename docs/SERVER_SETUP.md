# Server Setup: Node A (Rules Authority)
### ASP.GM-Agent v0.9.2 | Node A (Linux) Setup Guide

This document details the configuration for **Node A**, the secondary Linux-based rules and geometry authority.

---

## 💻 Hardware Prerequisites
- **Machine:** Nitro 5 / 1050 Ti (Target hardware).
- **OS:** Ubuntu 24.04 LTS (recommended).
- **VRAM:** 4GB+ (GDDR5+).
- **Storage:** 20GB+ for model weights.

## 🛠️ Step 1: Software Prerequisites
1. **Rust (v1.94+):**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **Ollama (v0.19.0+):**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
3. **Build Tools:**
   ```bash
   sudo apt update && sudo apt install build-essential libssl-dev pkg-config -y
   ```

## 🧠 Step 2: Model Provisioning
Install the rules authority model:
```bash
ollama pull llama3.2:3b
```
*Note: This model provides the optimal balance of intelligence and performance for the 4GB 1050 Ti.*

## 🏗️ Step 3: Deploy ZeroClaw (Rust)
1. **Clone & Navigate:**
   ```bash
   git clone https://github.com/maczzzzzzz/-asp-gm-agent.git
   cd -asp-gm-agent/zeroclaw
   ```
2. **Configure Host:** Ensure `src/main.rs` is listening on `0.0.0.0:7878` for cross-node binary communication.
3. **Build (Optimized):**
   ```bash
   cargo build --release
   ```

## 🎲 Step 4: Ignition
```bash
nohup ./target/release/zeroclaw > zeroclaw.log 2>&1 &
```
Verify the server is active:
```bash
tail -f zeroclaw.log
```
Expected output: `Listening on 0.0.0.0:7878`.

## ⚠️ Stability & Performance
- **Transport:** ClawLink uses newline-delimited JSON framing over raw TCP. Use `ufw allow 7878/tcp` if the connection from Node B is refused.
- **Inference:** If math checks are slow, verify Ollama is not offloading to CPU. The 1-bit Bonsai model should fit entirely in the 4GB 1050 Ti buffer.
