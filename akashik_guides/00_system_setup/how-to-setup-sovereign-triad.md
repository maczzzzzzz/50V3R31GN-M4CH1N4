# How-to: Setup the Sovereign Triad Bridge

**Status:** DRAFT (Phase 48 Roadmap)
**Target:** 50V3R31GN-M4CH1N4
**Context:** Strategist (Gemini) + Heavy Architect (Droid / GLM-5)

This guide provides the steps to initialize and maintain the **Sovereign Triad Bridge**, a shared Model Context Protocol (MCP) "Codebase Brain" designed for high-performance agentic collaboration.

---

## 🏗️ 1. Prerequisites (Nix-Native)
The Triad Bridge operates within an **Impure** and **Unfree** Nix environment.

1.  **Nix Environment:** Ensure you are running with the impure flag:
    ```bash
    nix develop --impure
    ```
2.  **Unfree License:** Your environment must allow unfree packages (required for GLM-5 and proprietary drivers):
    ```bash
    export NIXPKGS_ALLOW_UNFREE=1
    ```

## ⚡ 2. Initializing the Bridge Daemon
The bridge daemon starts automatically via the `flake.nix` `shellHook`. If it needs to be manually restarted:

```bash
# Verify if the bridge is already online
ls .gemini/tmp/sovereign-mcp.sock

# Manual restart (if needed)
nix develop --impure --command node scripts/dev/mcp-daemon.js --socket .gemini/tmp/sovereign-mcp.sock
```

## 🛠️ 3. Linking the Droid CLI
The Droid (Heavy Architect) must be linked to the shared MCP socket to share the "Strategist's Brain."

1.  **Configure Droid:**
    Update `.factory/mcp.json` to include the `sovereign-bridge` socket:
    ```json
    {
      "mcpServers": {
        "sovereign-bridge": {
          "command": "nc",
          "args": ["-U", ".gemini/tmp/sovereign-mcp.sock"]
        }
      }
    }
    ```
2.  **Verify Link:**
    Run `droid mcp list` and ensure `sovereign-bridge` is visible.

## 📖 4. The Strategist-to-Architect Handoff
1.  **Directive Mapping:** The Strategist (Gemini) indexes the codebase and writes a **Phase Shard** or **Directive**.
2.  **Manual Approval:** The Human Operator reviews and approves the directive.
3.  **Execution:** The Heavy Architect (Droid) executes the implementation missions using the *same* MCP context indexed by the Strategist.

---
*Verified by the Sovereign Triad v3.2.0.*
