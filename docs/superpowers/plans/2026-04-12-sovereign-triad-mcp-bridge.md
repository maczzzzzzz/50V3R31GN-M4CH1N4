# Sovereign Triad MCP Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a shared "Codebase Brain" for Gemini CLI and Droid CLI using a background MCP daemon.

**Architecture:** A lightweight Node.js daemon running standard `@modelcontextprotocol` servers (filesystem, git) over a Unix Domain Socket, managed by a Nix `shellHook`.

**Tech Stack:** Node.js, TypeScript, Model Context Protocol (MCP), Nix (Impure/Unfree).

---

### Task 1: Scaffolding the MCP Daemon

**Files:**
- Create: `scripts/dev/mcp-daemon.ts`
- Create: `scripts/dev/mcp-daemon.js` (Compiled entry point)

- [ ] **Step 1: Write the daemon source**

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FileSystemServer } from "@modelcontextprotocol/server-filesystem";
import { GitServer } from "@modelcontextprotocol/server-git";
import fs from "fs";
import path from "fs";

// Configuration from environment/CLI
const socketPath = process.argv.includes("--socket") 
  ? process.argv[process.argv.indexOf("--socket") + 1] 
  : "./.gemini/tmp/sovereign-mcp.sock";

const logPath = "data/logs/mcp-bridge.log";

// Ensure log directory exists
if (!fs.existsSync("data/logs")) fs.mkdirSync("data/logs", { recursive: true });

const log = (msg: string) => {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logPath, entry);
};

async function main() {
  const server = new Server({
    name: "sovereign-triad-bridge",
    version: "1.0.0",
  }, {
    capabilities: {
      resources: {},
      tools: {},
      logging: {}
    }
  });

  // Attach standard servers as toolsets
  // Note: In a real implementation, we'd compose these or proxy them.
  // For this plan, we'll assume standard SDK composition.
  
  log("INITIALIZING_IMPURE_BRAIN...");
  
  // Cleanup old socket
  if (fs.existsSync(socketPath)) fs.unlinkSync(socketPath);

  // Start logic...
  log("ONLINE");
}

main().catch(e => {
  fs.appendFileSync(logPath, `[FATAL] ${e.stack}\n`);
  process.exit(1);
});
```

- [ ] **Step 2: Compile to JS**
Run: `npx tsc scripts/dev/mcp-daemon.ts --outDir scripts/dev/ --esModuleInterop --target esnext`

- [ ] **Step 3: Commit**
```bash
git add scripts/dev/mcp-daemon.ts
git commit -m "feat: scaffold MCP bridge daemon"
```

---

### Task 2: Nix Integration (The Impure Sidecar)

**Files:**
- Modify: `flake.nix`

- [ ] **Step 1: Update shellHook**
Add the following to the `devShell` `shellHook`:

```bash
export NIXPKGS_ALLOW_UNFREE=1
SOCKET_PATH=".gemini/tmp/sovereign-mcp.sock"
PID_PATH=".gemini/tmp/mcp-bridge.pid"

if [ ! -S "$SOCKET_PATH" ]; then
    echo "[Sovereign-Bridge]: STARTING_IMPURE_BRAIN..."
    node scripts/dev/mcp-daemon.js --socket "$SOCKET_PATH" > /dev/null 2>&1 &
    echo $! > "$PID_PATH"
    disown
fi
```

- [ ] **Step 2: Verify environment**
Run: `nix develop --impure`
Expected: See `[Sovereign-Bridge]: STARTING_IMPURE_BRAIN...`

- [ ] **Step 3: Commit**
```bash
git add flake.nix
git commit -m "chore: integrate MCP bridge into nix shellHook"
```

---

### Task 3: Droid Configuration

**Files:**
- Modify: `.factory/mcp.json`

- [ ] **Step 1: Link Droid to Socket**
Add the socket configuration to the Droid's MCP manifest.

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

- [ ] **Step 2: Verify Droid connection**
Run: `droid mcp list`
Expected: `sovereign-bridge` appears in the list.

- [ ] **Step 3: Commit**
```bash
git add .factory/mcp.json
git commit -m "config: link Droid to Sovereign MCP socket"
```

---

### Task 4: Final Validation

**Files:**
- Create: `scripts/dev/test-mcp-connection.ts`

- [ ] **Step 1: Write validation script**
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// Simple test to list tools from the bridge
```

- [ ] **Step 2: Run validation**
Run: `nix develop --impure --command tsx scripts/dev/test-mcp-connection.ts`
Expected: List of standard filesystem/git tools returned.

- [ ] **Step 3: Final Commit**
```bash
git commit -m "test: verify Sovereign Triad Bridge connectivity"
```
