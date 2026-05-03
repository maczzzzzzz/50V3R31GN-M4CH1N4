# Hermes-Agent Clinical Fork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork `nousresearch/hermes-agent` and integrate it as the primary operator harness for Sovereign Machina, layering VSB, ST3GG, and Quaternary Mesh primitives on top.

**Architecture:** A "Clinical Fork" model where the Python Hermes core provides the reasoning and interaction layer, while custom Sovereign logic is decoupled into Model Context Protocol (MCP) servers and tool wrappers.

**Tech Stack:** Python 3.12+, TypeScript/Next.js (HUD), Go (VSB/Crush), Model Context Protocol (MCP), Nix.

---

### Task 1: The Sovereign Fork & Repository Cleansing

**Files:**
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `.gitignore`
- Delete: `packages/hermes-core/` (Shadow Logic)

- [ ] **Step 1: Decommission Node.js Shadow Logic**
Remove the brittle TypeScript implementation of the Hermes engine to ensure single-source-of-truth in the Python Shard.
```bash
rm -rf packages/hermes-core
```

- [ ] **Step 2: Re-wire Root Scripts**
Update `package.json` to target the Python Shard for all terminal and TUI operations.
```json
"scripts": {
  "terminal": "cd sidecars/hermes-agent-nous && nix develop --impure --command python3 -m hermes_cli.main chat --tui",
  "dashboard:hermes": "cd sidecars/hermes-agent-nous && nix develop --impure --command python3 -m hermes_cli.main dashboard --port 9119 --host 0.0.0.0 --insecure --tui"
}
```

- [ ] **Step 3: Commit Workspace Cleanup**
```bash
git add .
git commit -m "chore: decommission shadow-logic packages/hermes-core and re-wire python arteries"
```

---

### Task 2: Sovereign-MCP-Bridge (VSB Integration)

**Files:**
- Create: `crates/sovereign-mcp-bridge/Cargo.toml`
- Create: `crates/sovereign-mcp-bridge/src/main.rs`

- [ ] **Step 1: Initialize Rust MCP Bridge**
Create a high-performance Rust bridge that exposes the VSB (Virtual Sovereign Bus) as an MCP Resource.
```rust
// crates/sovereign-mcp-bridge/src/main.rs
// Exposes VSB Port 7878 as MCP resources: /vitals, /memory, /mesh
```

- [ ] **Step 2: Hook VSB Resource Provider**
Implement logic to read VSB binary UDP frames and convert them to JSON for the Hermes Harness.

- [ ] **Step 3: Test MCP Connectivity**
Run: `npx @modelcontextprotocol/inspector ./target/release/sovereign-mcp-bridge`
Expected: PASS - Resources /vitals and /mesh are listed.

---

### Task 3: ST3GG Tool-Guard (Security Layer)

**Files:**
- Modify: `sidecars/hermes-agent-nous/agent/agent.py`
- Modify: `sidecars/hermes-agent-nous/tools/registry.py`

- [ ] **Step 1: Implement Tool-Call Signing**
Inject a mandatory ST3GG signature check into the `call_tool` loop in the Python core.
```python
# Every tool execution must be preceded by a call to crates/sidecar-cyberdeck/st3gg
# logic to verify the operator's visual pulse.
```

- [ ] **Step 2: Add 'clinical_refusal' for unsigned intents**
If ST3GG verification fails, the agent must return a clinical security readout and halt execution.

---

### Task 4: Pretext Dashboard "Authority" Re-Skin

**Files:**
- Modify: `dashboard/app/globals.css`
- Modify: `dashboard/components/HermesInteractiveTUI.tsx`

- [ ] **Step 1: Enforce Orange Rust & Cinzel**
Synchronize the dashboard with the v1.3.0 brand standard.
```css
:root {
  --nodestadt-accent: #E07A5F;
  --nodestadt-font: 'Cinzel', serif;
}
```

- [ ] **Step 2: Embed Hermes Dashboard via iFrame**
Update the clinical HUD to host the native Hermes Dashboard in the `TERMINAL_ARTERY` slot.

---

### Task 5: Mobile Artery Realignment

**Files:**
- Modify: `terminal-app/lib/services/openclaw_bridge.dart`

- [ ] **Step 1: Remap WebSocket Artery**
Update the Flutter app to connect to the Python Gateway (`ws://node-b:8000/ws`) using the upstream JSON-RPC protocol.

- [ ] **Step 2: Test Voice Continuity**
Verify that voice memos recorded on mobile are transcribed and ingested by the Python Shard.
