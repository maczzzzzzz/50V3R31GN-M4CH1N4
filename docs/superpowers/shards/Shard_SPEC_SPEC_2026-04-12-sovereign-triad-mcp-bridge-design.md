# Sovereign Trinity MCP Mesh: Design Specification

**Status:** DRAFT (Awaiting User Review)
**Date:** 2026-04-12
**Author:** Gemini CLI (Strategist) & Droid CLI (Heavy Architect)
**Context:** 50V3R31GN-M4CH1N4 / Phase 45+

## 1. Vision & Purpose
The **Sovereign Trinity MCP Mesh** provides a "Shared Brain" between the Strategist (Gemini CLI) and the Heavy Architect (Droid CLI / GLM-5). It ensures both agents possess a synchronized, real-time map of the codebase while operating within a **Nix-Native, Impure, and Unfree** development environment.

## 2. Core Architecture: The Impure Sidecar
The bridge is a lightweight background service implemented using standard Model Context Protocol (MCP) servers.

### 2.1 Component Stack
- **Protocol:** Model Context Protocol (MCP) v1.0.
- **Servers:** 
  - `@modelcontextprotocol/server-filesystem` (Local file access)
  - `@modelcontextprotocol/server-git` (Repository state awareness)
- **Runtime:** Node.js (spawned within `nix develop --impure`).
- **Communication:** Unix Domain Socket (`.gemini/tmp/sovereign-mcp.sock`).

### 2.2 Lifecycle Management
- **Activation:** Managed by `flake.nix` `shellHook`.
- **Triggers:** Automatically starts upon entering the `nix develop` environment.
- **Termination:** SIGTERM issued on shell exit; PID tracked in `.gemini/tmp/mcp-bridge.pid`.

## 3. Environment Mandates
The bridge strictly adheres to the project's **Sovereignty Rules**:
1. **NIXPKGS_ALLOW_UNFREE=1:** Explicitly exported to support GLM-5 and proprietary drivers.
2. **Impure Mode:** The daemon inherits the impure environment to access local configuration, keys, and the global `/tmp` directory.
3. **Low Overhead:** The service is scoped to DevOps tasks and is never bundled with production runtime components.

## 4. Operational Synergy
### 4.1 The Strategist (Gemini CLI)
- **Role:** Maps architectural dependencies and generates high-level "Ability Shard" specifications.
- **Connection:** Client connection to the shared MCP socket for indexing and retrieval.

### 4.2 The Heavy Architect (Droid CLI / GLM-5)
- **Role:** Executes long-horizon implementation missions based on approved Strategist Directives.
- **Connection:** Leverages the *same* MCP socket to ensure perfect context alignment with the Strategist's plan.
- **Approval Gate:** Droid operates with `auto_run: false`, requiring physical user confirmation for every execution phase.

## 5. Observability & Security
- **Logging:** "Critical-Only" filtering. No startup logs or heartbeat pings. Only `ERROR` or `FATAL` events logged to `data/logs/mcp-bridge.log`.
- **Security:** Access is restricted to the local Unix Domain Socket; no network ports are exposed.
- **Visual:** Single terminal notification on shell entry: `[Sovereign-Mesh]: IMPURE_UNFREE_ACTIVE`.

## 6. Testing & Validation
- **Connectivity:** `scripts/dev/test-mcp-connection.ts` will verify socket availability.
- **Tool Integrity:** Automated check of `read_file` and `git status` via the MCP bridge before the first mission start.

---
*Verified by the Sovereign Trinity v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
