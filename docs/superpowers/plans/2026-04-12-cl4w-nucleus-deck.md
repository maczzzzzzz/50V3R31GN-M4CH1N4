# 50V3R31GN-CL4W: Nucleus Command Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a singular, high-fidelity WebGL command deck that absorbs all legacy TUIs/EGUIs and serves as the primary system ignition point.

**Architecture:** Headless Rust daemons feed a Go-based Protobuf-WebSocket bridge, which is consumed by a React 19 + PIXI.js v8 + Pretext frontend.

**Tech Stack:** Go, Rust, TypeScript, React 19, PIXI.js v8, Pretext Engine, Protobuf.

---

### Task 1: Headless Rust Transition

**Files:**
- Modify: `sidecar-atlas/src/main.rs`
- Modify: `sidecar-cyberdeck/src/main.rs`
- Modify: `Cargo.toml` (for both)

- [ ] **Step 1: Implement --headless flag logic in sidecars**

```rust
// sidecar-atlas/src/main.rs
fn main() -> Result<(), eframe::Error> {
    let args: Vec<String> = std::env::args().collect();
    let headless = args.contains(&"--headless".to_string());

    if headless {
        println!("[CL4W]: Starting Headless Atlas Daemon...");
        // Run update loop without spawning eframe window
        let mut app = AtlasApp::default();
        loop {
            app.update_vsb_state(); // Logic to read VSB and update Mmap/UDP
            std::thread::sleep(std::time::Duration::from_millis(16));
        }
    } else {
        // Existing eframe boot logic
    }
}
```

- [ ] **Step 2: Commit**
```bash
git add sidecar-atlas/src/main.rs sidecar-cyberdeck/src/main.rs
git commit -m "feat: implement headless mode for Rust sidecars"
```

---

### Task 2: The Go Nucleus Artery

**Files:**
- Create: `crush/nucleus.go`
- Modify: `crush/main.go`

- [ ] **Step 1: Implement Protobuf WebSocket Server**

```go
// crush/nucleus.go
package main

import (
    "github.com/gorilla/websocket"
    "net/http"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

func startNucleusServer() {
    http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        conn, _ := upgrader.Upgrade(w, r, nil)
        defer conn.Close()
        // Loop: Read VSB Mmap -> Encode Protobuf -> Write Message
    })
    http.ListenAndServe(":3030", nil)
}
```

- [ ] **Step 2: Commit**
```bash
git add crush/nucleus.go
git commit -m "feat: scaffold Go Nucleus Artery (Protobuf Bridge)"
```

---

### Task 3: Web-Nucleus Scaffold (React 19)

**Files:**
- Create: `dashboard/cl4w-nucleus/` (Directory structure)

- [ ] **Step 1: Scaffold Vite project with PIXI.js**
Run: `npx create-vite dashboard/cl4w-nucleus --template react-ts`
Run: `npm install pixi.js @pixi/react pretext-engine protobufjs`

- [ ] **Step 2: Implement Root Pretext Surface**

```typescript
// dashboard/cl4w-nucleus/src/components/CommandDeck.tsx
import { Stage, Container } from '@pixi/react';
import { PretextOverlay } from './PretextOverlay';

export const CommandDeck = () => (
  <Stage width={window.innerWidth} height={window.innerHeight} options={{ backgroundColor: 0x080810 }}>
    <Container name="SovereignShroud">
       {/* Pretext Panels go here */}
    </Container>
  </Stage>
);
```

- [ ] **Step 3: Commit**
```bash
git add dashboard/cl4w-nucleus/
git commit -m "feat: scaffold CL4W Nucleus frontend with PIXI.js"
```

---

### Task 4: Governance & Dial-Up Trigger

**Files:**
- Create: `dashboard/cl4w-nucleus/src/hooks/useFlushGate.ts`
- Create: `dashboard/cl4w-nucleus/public/audio/dialup.mp3`

- [ ] **Step 1: Implement Dial-Up Audio Trigger**

```typescript
// useFlushGate.ts
export const useFlushGate = () => {
  const audio = new Audio('/audio/dialup.mp3');
  audio.loop = true;

  const onProposal = () => {
    audio.play();
    // Trigger Pretext Glitch Impulse
  };

  const onVerdict = () => {
    audio.pause();
    audio.currentTime = 0;
  };
};
```

- [ ] **Step 2: Commit**
```bash
git add dashboard/cl4w-nucleus/src/hooks/useFlushGate.ts
git commit -m "feat: implement dial-up audio trigger for VSB governance"
```

---

### Task 5: The UI Purge (Foundry Cleanup)

**Files:**
- Modify: `50v3r31gn-bridge/module.json`
- Modify: `50v3r31gn-bridge/50v3r31gn-bridge.js`

- [ ] **Step 1: Remove Dashboard UI from Foundry**
Remove the `Sovereign Dashboard` button registration from the Escape menu hook and comment out the `ShadowDashboard` ApplicationV2 registration.

- [ ] **Step 2: Final Verification**
Launch Nucleus Deck -> Click [GHOST_BOOT] -> Verify Foundry launches headless and VSB state streams to the Web Deck.

- [ ] **Step 3: Final Commit**
```bash
git commit -m "chore: purge intrusive Foundry UI and finalize Nucleus Deck"
```
