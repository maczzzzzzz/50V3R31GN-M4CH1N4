# CRT Artery Brand Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the high-fidelity visual identity for Sovereign Machina, replacing stock UI with CRT-style artifacts, kinetic interactions, and a desaturated 4-bit palette across the Workspace and Flutter app, while stabilizing the backend.

**Architecture:** 
- **React Workspace:** Persistent scanline overlays and text glows via CSS; promotion of standard triggers to canvas-based Kinetic typography; backend dependency and auth remediation.
- **Flutter App:** Custom painters for CRT artifacts and Washed Protocol palette injection via ThemeData extensions.

**Tech Stack:** React, Tailwind CSS, Vite, Node.js, Rust (Pretext Core), WASM, Flutter/Dart.

---

### Task 1: Backend Stabilization & Dependency Remediation

**Files:**
- Modify: `dashboard/hermes-workspace/src/server/terminal-sessions.ts`
- Modify: `dashboard/hermes-workspace/src/server/gateway-capabilities.ts`

- [ ] **Step 1: Fix missing fs import in terminal-sessions.ts**
```typescript
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs' // Added
import path from 'node:path'
```

- [ ] **Step 2: Revert hardcoded API URL but ensure it falls back correctly to 127.0.0.1**
Modify `dashboard/hermes-workspace/src/server/gateway-capabilities.ts`:
```typescript
export let CLAUDE_API = normalizeUrl(
  _initialOverrides.claudeApiUrl ||
    process.env.HERMES_API_URL ||
    process.env.CLAUDE_API_URL ||
    'http://127.0.0.1:8642',
)
```

- [ ] **Step 3: Verify Gateway connection**
Run: `curl -s http://localhost:8642/health`
Expected: `{"status": "ok", "platform": "hermes-agent"}`

- [ ] **Step 4: Commit**
```bash
git add dashboard/hermes-workspace/src/server/
git commit -m "fix(backend): remediate fs dependency and stabilize gateway routing"
```

### Task 2: CRT Artery CSS Surface Injection

**Files:**
- Modify: `dashboard/hermes-workspace/src/scifi-theme.css`
- Modify: `dashboard/hermes-workspace/src/styles.css`

- [ ] **Step 1: Implement Scanline Overlay and Glow Variables**
Update `dashboard/hermes-workspace/src/scifi-theme.css`:
```css
:root {
  --glow-color: rgba(55, 99, 116, 0.4);
  --scanline-opacity: 0.05;
}

.root::after {
  content: " ";
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  z-index: 100;
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
  opacity: var(--scanline-opacity);
}

.crt-glow {
  text-shadow: 0 0 5px var(--glow-color);
}

/* Forced Brutalism */
* {
  border-radius: 0px !important;
}
```

- [ ] **Step 2: Apply glow to all technical text**
Update `dashboard/hermes-workspace/src/styles.css` to add `.crt-glow` to primary labels.

- [ ] **Step 3: Commit**
```bash
git add dashboard/hermes-workspace/src/scifi-theme.css
git commit -m "feat(visual): inject CRT scanlines and glow protocol"
```

### Task 3: Kinetic Interaction Promotion

**Files:**
- Modify: `dashboard/hermes-workspace/src/components/workspace-shell.tsx`
- Modify: `dashboard/hermes-workspace/src/screens/chat/components/chat-sidebar.tsx`

- [ ] **Step 1: Replace "New Chat" button with Kinetic Interaction**
In `chat-sidebar.tsx`, replace the standard `Button` with a wrapper around `KineticThoughtStream` that triggers `onCreateSession` on click.

- [ ] **Step 2: Materialize persistent Pretext Flow in Shell**
Update `WorkspaceShell.tsx` to include a `KineticThoughtStream` that renders random architectural "whispers" in the background at 10% opacity.

- [ ] **Step 3: Commit**
```bash
git commit -m "feat(visual): promote standard triggers to kinetic interactions"
```

### Task 4: Flutter App Identity Unification

**Files:**
- Modify: `sidecars/omi-monorepo-fork/app/lib/utils/ui_guidelines.dart`
- Modify: `sidecars/omi-monorepo-fork/app/lib/widgets/crt_overlay.dart` (Create)

- [ ] **Step 1: Update AppStyles to Washed Protocol Palette**
```dart
static final Color backgroundPrimary = const Color(0xFF1A282F);
static final Color backgroundSecondary = const Color(0xFF27353B);
static const Color accent = const Color(0xFF376374);
```

- [ ] **Step 2: Implement CRTScanlinePainter**
Create `sidecars/omi-monorepo-fork/app/lib/widgets/crt_overlay.dart` with a `CustomPainter` that draws horizontal lines every 4 pixels with 0.1 opacity.

- [ ] **Step 3: Commit**
```bash
git add sidecars/omi-monorepo-fork/app/lib/
git commit -m "feat(mobile): unify Flutter app with CRT Artery identity"
```

### Task 5: Final Verification & Tearing Down Mock Logic

- [ ] **Step 1: Revert LiteLLM local routing to Node D**
Update `nix/hosts/node-b/litellm-mesh.yaml` to use `100.120.225.12:8080`.

- [ ] **Step 2: Kill Mock LLM and Restart Mesh**
```bash
pkill -f mock_llm
bash scripts/ignite.sh
```

- [ ] **Step 3: Run full UI smoke test**
Expected: Dashboard connected, Pretext HUD visible, CRT artifacts visible, and real Node D responses flowing.

- [ ] **Step 4: Commit**
```bash
git commit -m "chore: final mesh calibration and cleanup"
```
