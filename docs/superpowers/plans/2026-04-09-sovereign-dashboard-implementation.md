# 5H4D0W_D45HB04RD [50V3R31GN_MN7R] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-speed real-time monitoring dashboard for the 50V3R31GN-M4CH1N4 system, bridging binary VSB telemetry to a Next.js UI reflected inside Foundry VTT.

**Architecture:**
1.  **VSB Mesh (Go):** A new component in `crush` that listens to UDP Port 7878 and broadcasts decoded JSON telemetry via WebSocket on Port 9090.
2.  **Shadow Dashboard (Next.js):** A standalone React application (Node B) that renders 60fps system metrics (GPU, VRAM, Audit logs) using L337_5P34K styling.
3.  **Foundry Mesh (TS):** A custom `ApplicationV2` window in the Foundry module that iframes the dashboard and enables the `GH057_B007` trigger.

**Tech Stack:** Go (WebSockets), Next.js 15, Tailwind CSS, VT323 Font, Foundry VTT API v12.

---

### Task 1: VSB-to-WebSocket Mesh (Go)

**Files:**
- Modify: `crush/config.go`
- Create: `crush/dashboard_bridge.go`
- Modify: `crush/main.go`

- [ ] **Step 1: Add DashboardPort to config**
Modify `crush/config.go` to include `DashboardPort` (default 9090).

```go
type Config struct {
    // ... existing
    DashboardPort string // DASHBOARD_PORT — WebSocket port for telemetry
}

func loadConfig() Config {
    return Config{
        // ... existing
        DashboardPort: getEnv("DASHBOARD_PORT", "9090"),
    }
}
```

- [ ] **Step 2: Implement the WebSocket Mesh**
Create `crush/dashboard_bridge.go`. This should listen on UDP 7878, decode the binary packets (matching `SovereignHeader` size 302), and broadcast via `gorilla/websocket`.

- [ ] **Step 3: Register subcommand in main**
Modify `crush/main.go` to add the `dashboard-bridge` subcommand.

- [ ] **Step 4: Verify with a mock UDP packet**
Run the bridge and send a dummy UDP packet to 7878; verify JSON is broadcast on WS 9090.

- [ ] **Step 5: Commit**
```bash
git add crush/
git commit -m "feat(crush): Implement VSB-to-WebSocket Telemetry Mesh"
```

---

### Task 2: Shadow Dashboard Scaffold (Next.js)

**Files:**
- Create: `dashboard/` (Directory)
- Create: `dashboard/tailwind.config.ts`
- Create: `dashboard/app/layout.tsx`

- [ ] **Step 1: Scaffold Next.js App**
Run `npx create-next-app@latest dashboard --typescript --tailwind --eslint --app` inside the project root. (Use defaults, but ensure it's in the `dashboard` folder).

- [ ] **Step 2: Configure Total Red Shift Theme**
Update `dashboard/tailwind.config.ts` with the Cyberpunk Red palette and VT323 font.

```typescript
// Colors: primary: #ff003c, background: #0a0a0a
// Font: VT323
```

- [ ] **Step 3: Global Styles (Scanlines & Glitch)**
Add the 5% scanline overlay and VT323 font import to `dashboard/app/globals.css`.

- [ ] **Step 4: Commit**
```bash
git add dashboard/
git commit -m "chore(dashboard): Scaffold Shadow Dashboard with Total Red theme"
```

---

### Task 3: Real-time UI Components (React)

**Files:**
- Create: `dashboard/hooks/useSovereignTelemetry.ts`
- Create: `dashboard/components/KernelMonitor.tsx`
- Create: `dashboard/components/DirectorPulse.tsx`
- Create: `dashboard/components/VsbWaveform.tsx`

- [ ] **Step 1: Implement WebSocket Hook**
Create a custom hook `useSovereignTelemetry` that connects to `ws://localhost:9090` and provides a reactive state object.

- [ ] **Step 2: Build K3RN3L_MN7R Component**
Implement the Node A monitor with pulsing progress bars for `PR0C3550R_57R41N` and the scrolling `4UD17_L0G`.

- [ ] **Step 3: Build D1R3C70R_PUL53 Component**
Implement the Node B monitor showing `1NF3R3NC3_L473NCY` and the `V15U4L_M3M0RY` breakdown.

- [ ] **Step 4: Build V5B_H1GHW4Y Waveform**
Create an SVG-based line chart that updates in real-time based on packet frequency.

- [ ] **Step 5: Build GH057_B007 Trigger**
Create the shielded red button that sends a `postMessage` to the parent window (Foundry).

- [ ] **Step 6: Commit**
```bash
git add dashboard/
git commit -m "feat(dashboard): Implement real-time L337_5P34K monitoring components"
```

---

### Task 4: Foundry VTT Integration (TS)

**Files:**
- Create: `foundry-module/scripts/sovereign-dashboard.js`
- Modify: `foundry-module/module.json`

- [ ] **Step 1: Create SovereignDashboard class**
Implement a class extending `foundry.applications.api.ApplicationV2` that renders an `iframe` pointing to `http://localhost:3000`.

- [ ] **Step 2: Handle Ghost Boot Message**
Add a window listener in the script to catch the `GH057_B007` message from the iframe and trigger the existing `easy-phasey` boot sequence.

- [ ] **Step 3: Register Module Script**
Add `scripts/sovereign-dashboard.js` to the `esmodules` array in `module.json`.

- [ ] **Step 4: Verify iframe rendering**
Launch Foundry and open the dashboard window; verify the Next.js app is visible and styled correctly.

- [ ] **Step 5: Commit**
```bash
git add foundry-module/
git commit -m "feat(foundry): Integrate Sovereign Dashboard via ApplicationV2 iframe"
```

---

### Task 5: Supervision & Ignition (Go)

**Files:**
- Modify: `deck-igniter/main.go`
- Modify: `deck-igniter/launcher.go`

- [ ] **Step 1: Add Dashboard Components to Igniter**
Add `dashboard-bridge` (WS Mesh) and `shadow-dashboard` (Next.js dev server) to the supervised components list.

- [ ] **Step 2: Implement Launch Logic**
Update `launcher.go` to handle `npm run dev` for the dashboard and `./crush dashboard-bridge` for the telemetry artery.

- [ ] **Step 3: Final System Integration Test**
Run `ctrl+i` in `deck-igniter`. Verify:
1. VSB Mesh is running.
2. Next.js Dashboard is live.
3. Foundry window shows real-time Node A/B telemetry.
4. `GH057_B007` button forces a system-wide glitch.

- [ ] **Step 4: Commit**
```bash
git add deck-igniter/
git commit -m "feat(igniter): Orchestrate Dashboard lifecycle and VSB telemetry"
```
