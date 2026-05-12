---
name: qa-workspace
description: >
  QA tests for the Hermes Workspace web app (dashboard/hermes-workspace). Tests login,
  chat, model selection, terminal, file browser, settings, and plugin integrations
  via agent-browser.
---

# QA Tests: Hermes Workspace

**Testing Target:** The Hermes Workspace is a Vite/React/Electron app at `dashboard/hermes-workspace/`. In production it runs on Node B (100.66.173.31:3002) over the Tailscale mesh.

## Getting the URL

1. Check `.factory/skills/qa/config.yaml` for the `default_target`
2. For Tailscale mesh: use `http://100.66.173.31:3002`
3. For local dev: start the dev server with `cd dashboard/hermes-workspace && pnpm dev`, then use `http://localhost:3002`
4. Verify the URL responds with HTTP 200 before proceeding

## Authentication

The workspace uses password-based session authentication:
- Password is set via `HERMES_PASSWORD` environment variable
- If HERMES_PASSWORD is set, the app shows a login page
- If not set, the app trusts local/Tailscale IPs automatically
- Session cookie name: `claude-auth`
- In CI: the password is provided via the `HERMES_PASSWORD` secret

## Test Flow Menu

### F1: Workspace Login
**When to run:** Any change to `src/server/auth-middleware.ts`, `src/routes/`, or `src/components/` related to auth.
**Steps:**
1. Navigate to the workspace URL
2. If login page appears, check for password input field
3. If HERMES_PASSWORD is available, enter it and submit
4. Verify redirect to main workspace (chat screen or dashboard)
5. Verify session cookie is set

### F2: Chat with Agent
**When to run:** Changes to `src/screens/chat/`, `src/stores/chat-store.ts`, `src/routes/api/send*`, message streaming logic.
**Steps:**
1. Ensure logged in
2. Find the chat input (contenteditable div or textarea)
3. Type a test message: "Hello, this is a QA test"
4. Send the message
5. Verify the message appears in the chat history
6. If agent is connected, verify a response is received (may take time)

### F3: Model Selection
**When to run:** Changes to `src/lib/model-info.ts`, `src/stores/session-model-store.ts`, model picker UI.
**Steps:**
1. Open the model selector/dropdown
2. Verify at least one model is listed
3. Select a different model
4. Verify the active model changes in the UI

### F4: Terminal Panel
**When to run:** Changes to `src/stores/terminal-panel-store.ts`, xterm integration.
**Steps:**
1. Open the terminal panel/tab
2. Verify xterm terminal renders
3. Type a basic command like `echo "qa test"`
4. Verify output appears

### F5: File Browser
**When to run:** Changes to `src/screens/files/`, file API routes.
**Steps:**
1. Navigate to the files section
2. Verify the file tree renders
3. Click on a directory to expand it
4. Verify files are listed

### F6: Settings
**When to run:** Changes to `src/screens/settings/`, configuration persistence.
**Steps:**
1. Navigate to settings
2. Verify settings page renders with expected sections
3. Change a non-destructive setting
4. Verify the change persists after page reload

### F7: Plugin Integrations (Phase 5)
**When to run:** Changes to `plugins/general/telegram-artery/`, `plugins/general/n8n-mcp/`, `plugins/general/mirage-vfs/`, or `cli-config.yaml`.
**Steps:**
1. Via agent API (curl to agent_api), verify plugin tools are registered:
   ```bash
   curl -s http://100.66.173.31:8642/tools | grep -c 'n8n_\|mirage_\|telegram_'
   ```
2. For n8n: verify health check tool responds
3. For Mirage VFS: verify mount status tool responds
4. For Telegram: verify bot coordinator is initialized

### F8: MCP Hub
**When to run:** Changes to `src/screens/mcp/`, MCP routes, MCP bridge code.
**Steps:**
1. Navigate to the MCP section
2. Verify MCP server list renders
3. Verify at least one MCP source is shown

### F9: Agent/Swarm Management
**When to run:** Changes to `src/screens/agents/`, `src/screens/swarm/`, `src/screens/swarm2/`.
**Steps:**
1. Navigate to agents or swarm screen
2. Verify agent list renders
3. Verify swarm roster is displayed

### F10: Visual/3D Playground
**When to run:** Changes to `src/screens/playground/`, Three.js/R3F code, Pretext HUD.
**Steps:**
1. Navigate to playground screen
2. Verify 3D canvas renders without errors
3. Check browser console for WebGL errors

## Known Failure Modes

1. **Tailscale mesh unreachable.** Node B may be offline or Tailscale not connected. Verify with `curl -s -o /dev/null -w "%{http_code}" http://100.66.173.31:3002/ --max-time 5`. If unreachable, fall back to local dev.
2. **Agent API not running.** The agent gateway (port 8642) requires `API_SERVER_ENABLED=true` in `~/.hermes/.env`. Without it, agent-related tests will fail.
3. **No password configured.** If HERMES_PASSWORD is empty, the workspace auto-authenticates local/Tailscale IPs. This is expected for mesh deployments.
4. **Chat response timeout.** Agent responses depend on model availability. If no model is configured, chat tests will show no response. This is expected in test environments.
5. **Workspace dev server startup.** The Vite dev server can take 10-30 seconds to be ready. Poll the URL before testing.
