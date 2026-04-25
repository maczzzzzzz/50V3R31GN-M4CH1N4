# Unified Cyberdeck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate tactical and netrunning sidecars into a single "Cyberdeck" HUD with AI-audited world-manipulation powers.

**Architecture:** A monolithic Rust/Egui sidecar reads a unified `black_ice_state.mem` Mmap. Commands flow from `crush` CLI (Go) to Node B (TS), are audited by Node A (Reasoner), and executed via Foundry `runScript`.

**Tech Stack:** Rust (Egui/Mmap), TypeScript (Node.js/WebSocket), Go (CLI/Orchestration).

---

### Task 1: Initialize `sidecar-cyberdeck` Crate

**Files:**
- Create: `sidecar-cyberdeck/Cargo.toml`
- Create: `sidecar-cyberdeck/src/main.rs`

- [ ] **Step 1: Create `Cargo.toml` with dependencies**

```toml
[package]
name = "sidecar-cyberdeck"
version = "1.10.0"
edition = "2021"

[dependencies]
eframe = "0.31"
egui = "0.31"
memmap2 = "0.9"
rand = "0.8"
```

- [ ] **Step 2: Scaffold `main.rs` with tab state**

```rust
use eframe::egui;
use egui::{CentralPanel, Color32};

#[derive(PartialEq)]
enum Tab { Atlas, Netrun, Hacks }

struct CyberdeckApp {
    active_tab: Tab,
    intrusion_level: f32,
}

impl eframe::App for CyberdeckApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        CentralPanel::default().show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.selectable_value(&mut self.active_tab, Tab::Atlas, "ATLAS");
                ui.selectable_value(&mut self.active_tab, Tab::Netrun, "NETRUN");
                ui.selectable_value(&mut self.active_tab, Tab::Hacks, "HACKS");
            });
            match self.active_tab {
                Tab::Atlas => { ui.label("Atlas Content"); }
                Tab::Netrun => { ui.label("Netrun Content"); }
                Tab::Hacks => { ui.label("Hacks Content"); }
            }
        });
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions::default();
    eframe::run_native("CYBERDECK HUD", options, Box::new(|_cc| Ok(Box::new(CyberdeckApp { 
        active_tab: Tab::Atlas,
        intrusion_level: 0.0 
    }))))
}
```

- [ ] **Step 3: Verify build**

Run: `cargo build -p sidecar-cyberdeck`
Expected: Successful compilation.

- [ ] **Step 4: Commit**

```bash
git add sidecar-cyberdeck/
git commit -m "feat: initialize sidecar-cyberdeck crate"
```

---

### Task 2: Port Atlas & Netrun Logic (Consolidation)

**Files:**
- Modify: `sidecar-cyberdeck/src/main.rs`

- [ ] **Step 1: Port Mmap and Radar/Ghost parsing from `sidecar-atlas`**
- [ ] **Step 2: Port Grid rendering from `sidecar-netrunning`**
- [ ] **Step 3: Verify consolidated rendering**

Run: `cargo test -p sidecar-cyberdeck` (Note: Add unit tests for parser logic ported from atlas/netrunning).

- [ ] **Step 4: Commit**

```bash
git add sidecar-cyberdeck/src/main.rs
git commit -m "feat: port atlas and netrun logic to unified cyberdeck"
```

---

### Task 3: Implement the [SCAN] Interaction & Hack-List

**Files:**
- Modify: `sidecar-cyberdeck/src/main.rs`

- [ ] **Step 1: Add `scanned_items` state to `CyberdeckApp`**
- [ ] **Step 2: Implement `render_hacks_tab` with `[SCAN]` button**

```rust
fn render_hacks_tab(&mut self, ui: &mut egui::Ui) {
    if ui.button("REVEAL PORTS [SCAN]").clicked() {
        // Trigger visual FX in Foundry via Node B later
        // self.perform_scan();
    }
    // Render list of items from Mmap blips
}
```

- [ ] **Step 3: Commit**

```bash
git add sidecar-cyberdeck/src/main.rs
git commit -m "feat: implement hack-list and scan trigger in HUD"
```

---

### Task 4: Implement Egui Glitch Engine

**Files:**
- Create: `sidecar-cyberdeck/src/glitch.rs`
- Modify: `sidecar-cyberdeck/src/main.rs`

- [ ] **Step 1: Write `GlitchEffect` shader or Egui paint callback**
- [ ] **Step 2: Bind glitch intensity to `intrusion_level` from Mmap**
- [ ] **Step 3: Commit**

```bash
git add sidecar-cyberdeck/src/
git commit -m "feat: add glitch engine to cyberdeck HUD"
```

---

### Task 5: Expand `crush` CLI for WSA Commands

**Files:**
- Modify: `crush/main.go`

- [ ] **Step 1: Add `hack` and `scan` subcommands**

```go
// Example go code addition
// flag.StringVar(&target, "target", "", "The port ID to target")
// flag.StringVar(&action, "action", "", "Action: unlock|dim|shutdown")
```

- [ ] **Step 2: Wire commands to send JSON intents to Node B**
- [ ] **Step 3: Commit**

```bash
git add crush/main.go
git commit -m "feat: expand crush CLI with hack and scan commands"
```

---

### Task 6: Final Verification & Clean-up

- [ ] **Step 1: Run full system boot via `deck-igniter`**
- [ ] **Step 2: Verify [SCAN] revelation in HUD**
- [ ] **Step 3: Verify Node A security audit on a `crush hack` command**
- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: finalize v3.4.2 unified cyberdeck integration"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
