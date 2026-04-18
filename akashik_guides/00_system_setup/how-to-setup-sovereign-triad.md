# How-to: Setup the Sovereign Triad Bridge

**Status:** ACTIVE (Phase 56 Audit Complete)
**Target:** 50V3R31GN-M4CH1N4
**Context:** Strategist (Gemini) + Heavy Architect (Droid / GLM-5.1)

This guide provides the steps to initialize and maintain the **Sovereign Triad Bridge**, a shared Model Context Protocol (MCP) "Codebase Brain" designed for high-performance agentic collaboration.

---

## 🏗️ 1. Prerequisites (Nix-Native)
The Triad Bridge operates within an **Impure** and **Unfree** Nix environment.

1.  **Nix Environment:** Ensure you are running with the impure flag:
    ```bash
    nix develop --impure
    ```
2.  **Unfree License:** Your environment must allow unfree packages (required for GLM-5.1 and proprietary drivers):
    ```bash
    export NIXPKGS_ALLOW_UNFREE=1
    ```
3.  **0xSero Acceleration (AMD GPUs):** To maximize VRAM-to-System addressable space for the **48L173R473D-M1ND** (Mistral-Nemo-12B), set the GTT size in your bootloader:
    - **Kernel Parameter:** `amdgpu.gttsize=1280`
    - **Verification:** `dmesg | grep -i gtt` (Should show ~1.25 GB).
    - **Vulkan Optimizations:** Pre-configured in `flake.nix` (`RADV_PERFTEST=sam`).

## ⚡ 2. Initializing the Nucleus Command Deck
The **Nucleus Command Deck (CL4W)** is the primary master switch for the entire machine.

1.  **Launch the Artery:**
    ```bash
    crush nucleus
    ```
2.  **Access the Deck:**
    Open your browser to `http://localhost:3030`.
3.  **Ignition:**
    Use the top-center dropdown menu to select your boot mode (`GHOST_BOOT` or `FULL_ENGAGE`). This automatically spawns all background sidecars and the kernel.

## 🛠️ 3. Linking the Droid CLI
The Droid (Heavy Architect) must be linked to the shared MCP socket to share the "Strategist's Brain."

1.  **Configure Droid:**
    Update `.factory/mcp.json` to include the `sovereign-bridge` socket:
    ```json
    {
      "mcpServers": {
        "sovereign-bridge": {
          "command": "nc",
          "args": ["-U", "/run/crush/sovereign-mcp.sock"]
        }
      }
    }
    ```
2.  **Verify Link:**
    Run `droid mcp list` and ensure `sovereign-bridge` is visible.

## 📖 4. The Strategist-to-Architect Handoff
1.  **Directive Mapping:** The Strategist (Gemini) indexes the codebase and writes a **Phase Shard** or **Directive**.
2.  **Manual Approval:** The Human Operator reviews and approves the directive.
3.  **Execution:** The Heavy Architect (Droid / GLM-5.1) executes the implementation missions using the *same* MCP context indexed by the Strategist.

---
*Verified by the Sovereign Triad v3.2.14.*
