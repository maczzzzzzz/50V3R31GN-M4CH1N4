# LOCAL_SETUP (v0.9.0) - Node B (Main Rig)
**Date:** Wednesday, April 1, 2026

This guide covers the specialized setup for the **Node B Orchestrator** running on Windows 11 with AMD hardware.

## 1. Environment Overrides (AMD/Vulkan)
Because of ROCm discovery timeouts on RDNA 4 cards (RX 7000/8000/9000), we force the **Vulkan** path.

### 1.1 Persistent Setup
Run these in a **PowerShell (Admin)** window:
```powershell
[System.Environment]::SetEnvironmentVariable("OLLAMA_VULKAN", "1", "User")
[System.Environment]::SetEnvironmentVariable("OLLAMA_LLM_LIBRARY", "vulkan", "User")
[System.Environment]::SetEnvironmentVariable("OLLAMA_FLASH_ATTENTION", "1", "User")
[System.Environment]::SetEnvironmentVariable("OLLAMA_KV_CACHE_TYPE", "fp8", "User")
[System.Environment]::SetEnvironmentVariable("GGML_VK_VISIBLE_DEVICES", "0", "User")
```

### 1.2 Unset Legacy Overrides
If you previously used `HSA_OVERRIDE_GFX_VERSION` for RDNA 3, unset it to avoid driver hangs:
```powershell
[System.Environment]::SetEnvironmentVariable("HSA_OVERRIDE_GFX_VERSION", $null, "User")
[System.Environment]::SetEnvironmentVariable("HIP_VISIBLE_DEVICES", $null, "User")
```

---

## 2. Global Tooling
Ensure you have the following installed globally:

### 2.1 Node.js (v22+)
Download from `nodejs.org`. Verify with:
```bash
node -v  # Should be v22.12.0 or higher
```

### 2.2 Go (v1.22+)
Required for **Charmbracelet Crush**. Download from `go.dev`. Verify with:
```bash
go version
```

### 2.3 Crush CLI
```bash
go install github.com/charmbracelet/crush@latest
```

---

## 3. Ollama Configuration
1. Install Ollama from `ollama.com`.
2. Ensure the tray app is **QUIT** before starting the server from the terminal to ensure environment variables are picked up.
3. Start the server:
   ```powershell
   ollama serve
   ```
4. Verify GPU discovery:
   ```bash
   ollama ps
   ```
   *Look for `100% GPU` and `library=Vulkan`.*

---

## 4. Local Repository Initialization
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the `.env` file (see `.env.example`).
4. Boot the system:
   ```bash
   npm start
   ```

**Status:** READY. 🟢
