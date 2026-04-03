# Master Startup Guide: ASP.GM-Agent (v1.1.0)
### Hardened Split-Node & Unified UI Initialization

This document provides the high-fidelity operational sequence for igniting the **Split-Node v1.1.0** world engine and its integrated UI suite.

---

## 🏗️ Hardware Check
- **Node A (Rules Authority):** Ubuntu 24.04 (NVIDIA 1050 Ti). Dedicated Rules & Geometry.
- **Node B (Orchestrator):** Windows (AMD RX 9060 XT 16GB). Dedicated Narrative & UI.

## 🚀 Step 1: Initialize Node A (The Rules Vault)
1. **Ignite:** `ssh maczz@192.168.0.50 'sudo systemctl start zeroclaw'`.
2. **Verify:** `systemctl status zeroclaw` should show `active (running)`.
3. **Sandbox:** Ensure **Nix DevShell** is active if running manual math checks.

## 🚀 Step 2: Initialize Node B (The Director)
1. **Environment:** Ensure Node.js 22.0+ and Go 1.22+ are installed.
2. **Ignite Orchestrator:** `npm start`.
   - *This creates the `black_ice_state.mem` shared memory segment.*
3. **Ignite Strategic Atlas:** `cd sidecar-atlas && cargo run --release`.
   - *The "Night City Radar" window will materialize.*

## 🚀 Step 3: Initialize Crush CLI (Control Plane)
1. **Build:** `cd crush && go build -o crush.exe`.
2. **Ignite:** `./crush.exe run`.
   - *The Lipgloss-refit terminal will establish the hardware handshake.*

## 🚀 Step 4: Bridge Foundry VTT (Project Eyes-On)
1. **Verify Link:** check Foundry chat for the v1.1.0 established message.
2. **Sidebar:** Switch to the `Night City Dashboard` tab (Terminal Icon) to see live faction/actor stats.

## ⚠️ Troubleshooting
- **Atlas Static:** Ensure Node B Orchestrator is running FIRST to initialize the shared memory segment.
- **Lipgloss Glitch:** If ASCII bars are mangled, ensure your terminal supports UTF-8 and TrueColor.
- **Auth Pause:** If the system "Hangs," check the Crush CLI for an `AUTHORIZATION REQUIRED` prompt.
