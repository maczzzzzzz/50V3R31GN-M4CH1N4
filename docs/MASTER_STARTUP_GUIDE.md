# MASTER_STARTUP_GUIDE (v0.9.0)
**Date:** Wednesday, April 1, 2026
**Target:** 100% Local Multi-Node TRPG Orchestration

This guide provides the authoritative sequence to initialize the ASP.GM-Agent from a "Cold Start" to full operational readiness. Adhere to these steps to ensure sub-10ms latency and 100% narrative grounding.

## 1. Prerequisites (Global Dependencies)

### 1.1 Development Environment
- **Node.js:** v22.12.0+ (LTS)
- **Go:** v1.22.0+ (Required for Charmbracelet Crush)
- **Rust:** 1.80.0+ (Required for Node A ZeroClaw)
- **Git:** Latest

### 1.2 Hardware & Infrastructure
- **Node A (Acer Nitro 5):** Headless Ubuntu Server 24.04 (IP: `192.168.0.50`).
- **Node B (Main Rig):** Windows 11 with AMD Radeon RX 9060 XT (16GB VRAM).
- **Network:** Gig-E LAN (Wi-Fi 6 fallback) for sub-1ms internal ping.

---

## 2. Infrastructure Setup (Node B - Orchestrator)

### 2.1 GPU Acceleration (AMD/Vulkan)
On Windows, Ollama requires explicit environment overrides to bypass driver timeouts on newer AMD cards.

**PowerShell (Admin):**
```powershell
# Set persistent GPU overrides for AMD RDNA 4
[System.Environment]::SetEnvironmentVariable("OLLAMA_VULKAN", "1", "User")
[System.Environment]::SetEnvironmentVariable("OLLAMA_LLM_LIBRARY", "vulkan", "User")
[System.Environment]::SetEnvironmentVariable("OLLAMA_FLASH_ATTENTION", "1", "User")
[System.Environment]::SetEnvironmentVariable("OLLAMA_KV_CACHE_TYPE", "fp8", "User")
[System.Environment]::SetEnvironmentVariable("GGML_VK_VISIBLE_DEVICES", "0", "User")

# Unset legacy variables that cause hangs
[System.Environment]::SetEnvironmentVariable("HSA_OVERRIDE_GFX_VERSION", $null, "User")
[System.Environment]::SetEnvironmentVariable("HIP_VISIBLE_DEVICES", $null, "User")
```

### 2.2 Ollama Installation
1. Download Ollama for Windows from `ollama.com`.
2. Quit the Ollama tray app after installation.
3. Start the server with the new environment variables:
   ```powershell
   ollama serve
   ```
4. Pull the mandatory models:
   ```bash
   ollama pull mistral-nemo:12b-instruct-v1-q4_K_M
   ollama pull llava:7b
   ollama pull nomic-embed-text
   ```

### 2.3 Discord Chronicler (Screamsheets)
1. Create a Discord server for your campaign.
2. Go to `Server Settings > Integrations > Webhooks`.
3. Create a new webhook and copy the URL.
4. Add this to your `.env` as `DISCORD_SCREAMSHEET_WEBHOOK`.

---

## 3. Terminal Interface (Crush CLI)

ASP.GM-Agent utilizes **Charmbracelet Crush** for the immersive terminal experience (Fixer Interviews, AR HUD).

### 3.1 Installation
```bash
go install github.com/charmbracelet/crush@latest
```

### 3.2 System Integration
1. The project includes a `.crush.json` configuration file in the root.
2. Verify the configuration points to the correct Node B local endpoints.
3. To start the immersive session:
   ```bash
   crush run .
   ```

---

## 4. Node A Setup (Rules Authority)

### 4.1 ZeroClaw Installation
1. SSH into Node A: `ssh maczz@192.168.0.50`.
2. Clone the repository and navigate to `zeroclaw/`.
3. Build the native binary:
   ```bash
   cargo build --release
   ```
4. Start the ZeroClaw service (Port 7878):
   ```bash
   ./target/release/zeroclaw --host 0.0.0.0 --port 7878
   ```

---

## 5. Orchestrator Initialization

### 5.1 Environment Configuration
Copy `.env.example` to `.env` and ensure the following are set:
- `OLLAMA_BASE_URL=http://localhost:11434`
- `NODE_A_HOST=192.168.0.50`
- `DISCORD_SCREAMSHEET_WEBHOOK=your_webhook_url`

### 5.2 Boot Sequence
1. Install Node dependencies:
   ```bash
   npm install
   ```
2. Run the full test suite to verify hardware handshakes:
   ```bash
   npm test
   ```
3. Start the orchestrator:
   ```bash
   npm start
   ```

---

## 6. Foundry VTT Bridge

1. Open Foundry VTT v12.
2. Install the `foundry-api-bridge-module` (located in `foundry-module/`).
3. Enable the module in your Cyberpunk RED world.
4. The module will automatically handshake with Node B on Port 3010.
5. Check the console for: `✅ Foundry Linked.`

---

## 7. Troubleshooting

- **Ollama Timeout:** Ensure `OLLAMA_LLM_LIBRARY=vulkan` is set. RDNA 4 cards hang during ROCm discovery.
- **Node A Offline:** Verify the SSH key path in `.env`.
- **Ghost Data:** If Foundry edits aren't saving, check the `UnifiedOracleClient` logs in `data/logs/`.

**Status:** ALL SYSTEMS GO. 🟢
