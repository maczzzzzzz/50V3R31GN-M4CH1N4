# ◈ How-to: Setup the Sovereign Trinity Mesh // THE_B007_L0G
**Status:** ARCH1V3_LOCK (Phase 62 Ignition)
**Topology:** Strategist (Gemini) // Director (Node B) // Synapse (Node A) // Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle (Node C)

This manifest codifies the steps to initialize the **Sovereign Trinity Mesh**. This is the bit-identical cognitive bridge designed for high-performance agentic collaboration across the localized basement spine.

---

## 🏗️ 1. PREREQUISITES (NIX-HERMETIC)
The Trinity Mesh operates within an **Impure** and **Unfree** Nix environment. We sacrifice pure functional purity for physical GPU performance.

1.  **Nix Artery:** Ignite the development shell with the impure flag:
    ```bash
    nix develop --impure
    ```
2.  **Proprietary Drivers:** Environment MUST export the unfree bypass:
    ```bash
    export NIXPKGS_ALLOW_UNFREE=1
    ```
3.  **0xSero Acceleration (AMD/NVIDIA):** 
    - **Node B (AMD):** GTT size locked at `1280`. RADV Vulkan surface active.
    - **Node C (NVIDIA):** CUDA 12.9 kernel merge verified. SGLang RadixAttention active.

## ⚡ 2. IGNITING THE NUCLEUS (CL4W)
The **Nucleus Command Deck (CL4W)** is the master switch. There is no fallback.

1.  **Open the Artery:**
    ```bash
    crush nucleus
    ```
2.  **Jack In:**
    Navigate to `http://localhost:3030`. 
3.  **Mesh Engagement:**
    Select `FULL_ENGAGE` mode. This spawns the disaggregated memory workers (Mooncake) and links the 3-node localized fabric.

## 🛠️ 3. LINKING THE ARCHITECT (DROID)
The Droid (Heavy Architect) must be jacked into the shared MCP socket. Logic parity is mandatory.

1.  **Terminal Link:**
    Update `.factory/mcp.json` to bridge the `sovereign-bridge` socket:
    ```json
    {
      "mcpServers": {
        "sovereign-bridge": {
          "command": "nc",
          "args": ["-U", "/run/crush/sovereign-mcp.sock"]
        }
    ```
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
*Verified by the Sovereign Trinity v3.2.19.*
