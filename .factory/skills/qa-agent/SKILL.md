---
name: qa-agent
description: >
  QA tests for the Hermes Agent system (sidecars/hermes-agent-nous). Tests plugin
  registration, API endpoints, Telegram bot integration, n8n workflow execution,
  and VFS operations via curl and shell commands.
---

# QA Tests: Hermes Agent

**Testing Target:** The Hermes Agent is a Python-based agent framework at `sidecars/hermes-agent-nous/`. It runs on Node B with its API gateway on port 8642.

## Getting the Agent API URL

1. Check `.factory/skills/qa/config.yaml` for the agent API URL
2. Default Tailscale: `http://100.66.173.31:8642`
3. Local: `http://localhost:8642`
4. Verify with: `curl -s $AGENT_API/health`

## Authentication

The agent API uses `API_SERVER_KEY` for authentication when exposed on non-loopback interfaces. If configured, pass the key as a header:
```bash
curl -H "Authorization: Bearer $HERMES_API_TOKEN" $AGENT_API/...
```

## Test Flow Menu

### F1: Agent Health Check
**When to run:** Any change to the agent codebase.
**Steps:**
1. `curl -s $AGENT_API/health` or `curl -s $AGENT_API/` -- verify HTTP 200
2. Verify the agent process is running: `ps aux | grep hermes`

### F2: Plugin Registration
**When to run:** Changes to `plugins/`, `cli-config.yaml`, plugin registration code.
**Steps:**
1. List registered tools: `curl -s $AGENT_API/tools`
2. Verify Phase 5 plugins are present:
   - `n8n_health_check`, `n8n_list_workflows`, `n8n_execute_workflow`, `n8n_get_execution`
   - `mirage_health_check`, `mirage_read_file`, `mirage_list_dir`, `mirage_write_file`
   - Telegram artery hooks registered
3. Count total tools and report

### F3: n8n-mcp Integration
**When to run:** Changes to `plugins/general/n8n-mcp/`, deployment scripts.
**Steps:**
1. Check n8n service status: `curl -s http://100.66.173.31:5678/healthz`
2. If n8n is running, test health check tool via agent API
3. List workflows via agent tool
4. If n8n is NOT running, report as BLOCKED with note: "n8n not deployed yet -- run scripts/deploy-n8n.sh on Node B"

### F4: Mirage VFS Integration
**When to run:** Changes to `plugins/general/mirage-vfs/`, `crates/modules/mirage-vfs/`.
**Steps:**
1. Check Mirage mount status: `ls /mnt/mirage 2>&1`
2. If mounted, verify VFS health check via agent API
3. Test file listing via agent tool
4. If NOT mounted, report as BLOCKED with note: "Mirage VFS not deployed yet -- run scripts/deploy-mirage.sh on Node D"

### F5: Telegram Bot Coordinator
**When to run:** Changes to `plugins/general/telegram-artery/`.
**Steps:**
1. Verify bot token is configured: check if `TELEGRAM_ARTERY_BOT_TOKEN` env var exists
2. If token present: `curl -s https://api.telegram.org/bot$TOKEN/getMe` -- verify 200
3. Check plugin initialization in agent logs
4. If no token, report as BLOCKED with note: "Telegram bot token not configured"

### F6: Agent Plugin Lifecycle
**When to run:** Changes to `plugins/general/`, `__init__.py` files, hook registration.
**Steps:**
1. Check agent logs for plugin loading errors
2. Verify all Phase 5 plugins loaded successfully
3. Test session start/end hooks are firing

### F7: MCP Server
**When to run:** Changes to `mcp_serve.py`, MCP bridge code.
**Steps:**
1. Check MCP server status via agent API
2. List available MCP tools
3. Verify tool schemas are valid JSON

## Known Failure Modes

1. **Agent API not started.** The gateway requires `API_SERVER_ENABLED=true` in `~/.hermes/.env` and `API_SERVER_HOST=0.0.0.0` for remote access.
2. **n8n not deployed.** The n8n bridge plugin exists but n8n itself must be deployed via `scripts/deploy-n8n.sh`. Health check at 100.66.173.31:5678 will fail until deployed.
3. **Mirage not mounted.** The VFS plugin exists but Mirage must be deployed via `scripts/deploy-mirage.sh` on Node D. `/mnt/mirage` will be empty.
4. **Telegram bot token missing.** The plugin operates in degraded mode without a bot token. Set `TELEGRAM_ARTERY_BOT_TOKEN` in `.env` to enable full functionality.
5. **Plugin import errors.** Hyphenated directory names (n8n-mcp, mirage-vfs) can cause import issues. The plugins use `__init__.py` entry points to avoid this.
