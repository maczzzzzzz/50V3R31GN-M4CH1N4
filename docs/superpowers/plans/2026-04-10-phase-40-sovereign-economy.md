# Phase 40: 50V3R31GN-3C0N0MY Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Red Trade and Night Market systems into the dual-node hardware bus, with tactical HUD radar and automated Architect manifestations.

**Architecture:** 
- **VSB Layer:** Binary UDP friction packets.
- **Mmap Layer:** Heat radar memory slots.
- **HUD Layer:** Pulse radar widget in Rust.
- **Architect Layer:** Auto-materialize vendors and mission objects.

**Tech Stack:** Go (Crush), Rust (Cyberdeck sidecar), Node.js (HRC), Binary UDP.

---

### Task 1: Binary Friction & VSB Handshake

**Files:**
- Modify: `src/core/red-trade-service.ts`
- Modify: `src/api/vsb-client.ts`
- Modify: `crush/wsa.go`

- [x] **Step 1: Define Friction Packet**
Add `FRICTION_INTENT` (Type `0x05`) to the Binary UDP schema.

- [x] **Step 2: Update RedTradeService**
Change `calculateFrictionRoll` to dispatch via `VsbClient`.

---

### Task 2: Tactical Heat Radar (Mmap & HUD)

**Files:**
- Modify: `crush/watcher.go`
- Modify: `crush/main.go`
- Modify: `sidecar-cyberdeck/src/main.rs`

- [x] **Step 1: Allocate Radar Slots**
Map offsets 3072-3074 in `black_ice_state.mem`.

- [x] **Step 2: Implement Radar Widget in Rust**
Add a circular pulsing widget to the HUD.

- [x] **Step 3: Add Radar CLI Command**
Implement `crush radar --public [on|off]` to toggle the visibility bit.

---

### Task 3: Architect Mission Loops

**Files:**
- Modify: `src/core/architect-pass-service.ts`
- Modify: `src/core/hybrid-routing-controller.ts`

- [x] **Step 1: Automated Dead Drops**
Update `HRC` to trigger Architect manifestation during `Red Trade` Beat 1.

- [x] **Step 2: Ambush Spawning**
Implement a check in the `TurnDaemon` to trigger hostile manifestation.

---

### Task 4: Smart Night Markets

**Files:**
- Modify: `src/core/night-market-service.ts`
- Modify: `foundry-module/foundry-api-bridge.js`

- [x] **Step 1: Vendor Auto-Forge**
Background-bake inventory data into vendor token portraits.

- [x] **Step 2: Hover Ingestion**
Update the Mesh to support `hoverVendor` events that trigger the HUD shop display.

---

### ◈ Completion Criteria
1. Red Trade friction rolls are processed by Node A via VSB.
2. The Cyberdeck HUD displays a "CAUTION" radar that reveals exact heat when scanned.
3. Architect auto-spawns rival gang tokens during a Red Trade ambush.
4. Hovering over a materialized vendor displays their full inventory in the HUD.
