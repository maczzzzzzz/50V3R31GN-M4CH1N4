# Shard: Phase 48 — MCP Bridge

## Metadata
- **ID:** 48
- **Name:** MCP-Bridge
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Ensures that the Model Context Protocol (MCP) Bridge is active and shared between Gemini (Strategist) and Droid (Architect). This daemon provides a unified "Codebase Brain" for multi-agent collaboration.

## Audit Logic
1. Checks for the MCP daemon source file (`scripts/dev/mcp-daemon.ts`).
2. Probes the MCP WebSocket port (default 3030) on `127.0.0.1`.
3. Verifies that the `.factory/mcp.json` configuration points to the correct socket.
4. Warns if the daemon is not responding or if Droid integration is not detected.

## Manifest Logic
Restarts the MCP daemon using `tsx scripts/dev/mcp-daemon.ts` to re-establish the shared context bridge.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-48.ts`
- **Port:** 3030
- **Pattern:** Shared Agentic Awareness
