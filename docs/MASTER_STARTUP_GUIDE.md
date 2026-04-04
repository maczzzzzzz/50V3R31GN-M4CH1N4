# Master Startup Guide: ASP.GM-Agent (v1.8.0)
### Sovereign Highway & Procedural OS Initialization

This document provides the operational sequence for igniting the **Split-Node v1.8.0** "Sovereign Highway."

---

## 🏗️ Hardware Check
- **Node A (The Physical Kernel):** Ubuntu 24.04 (NVIDIA 1050 Ti). Resident **Falcon (0.3B)** + **Llama-1B-Instruct**.
- **Node B (The Director):** Windows (AMD 5950X / RX 9060 XT). Resident **Mistral-Nemo (12B)**.
- **Bus:** Verify low-latency LAN connectivity for the UDP binary state-mirror.

## 🚀 Step 1: Initialize Node A (The Kernel)
1. **Ignite Kernel:** `ssh maczz@192.168.0.50 'sudo systemctl start zeroclaw'`.
2. **Verify Residence:** Ensure the 4GB card holds the 1B Judge and Falcon concurrently.
3. **Verify VSB:** Check Node A logs for `📡 VSB UDP Stream ACTIVE on: 192.168.0.51:7878`.

## 🚀 Step 2: Initialize Node B (The Director)
1. **Ignite Foundry:** Launch Foundry Electron app with Port 9222.
2. **Ignite Orchestrator:** `npm start`.
   - *Verify: `✅ VSB Heartbeat: Synchronized with Node A.`*
   - *Verify: `✅ L1-Registry: SQLite Mirror Mapped to Bus.`*

## 🚀 Step 3: Initialize Sidecars
1. **Strategic Atlas:** `cd sidecar-atlas && cargo run --release`.
2. **Crush CLI:** `cd crush && ./crush.exe run`.
3. **Neural Compositor:** Auto-launches with Orchestrator (Node B).

## 🚀 Step 4: Final Handshake
1. **Calibration:** Run `/audit` in the Crush CLI to verify sub-1ms VSB transaction times.
2. **Grounding:** Run `/scan` to verify resident Falcon perception speed.

## ⚠️ Troubleshooting
- **Bus Lag:** Check LAN jitter if `/audit` reports >5ms transaction latency.
- **Judge Drift:** If Node A reports VRAM thrashing, verify Llama-1B-Instruct is the active model.
- **Compositor Lag:** Check Node B CPU usage; ensure "High-Priority" threads are available for VSB.

---
*Verified by Gemini CLI v1.8.0 Strategist.*
