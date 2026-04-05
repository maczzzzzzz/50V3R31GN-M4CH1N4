# Master Startup Guide: ASP.GM-Agent (v1.9.0)
### Sovereign Highway & Procedural OS Initialization

This document provides the operational sequence for igniting the **Split-Node v1.9.0** "Sovereign Highway."

---

## Hardware Check
- **Node A (The Physical Kernel):** Nix-Native / Ubuntu (NVIDIA 1050 Ti). Resident **Falcon (0.3B)** + **Open-Reasoner-Zero-1.5B**.
- **Node B (The Director):** NixOS on WSL 2 (AMD 5950X / RX 9060 XT). Resident **Mistral-Nemo (12B)**.
- **Bus:** Verify low-latency LAN connectivity for the Binary UDP state-mirror.

## Step 1: Initialize Node A (The Kernel)
1. **Nix Shell:** `nix develop .#cuda`
2. **Ignite Kernel:** `bash zeroclaw/scripts/setup-resident-models.sh`
   - *This script starts `llama-server` natively and verifies model residency.*
3. **Start ZeroClaw:** `./zeroclaw/target/release/zeroclaw`
4. **Verify VSB:** Check logs for `⚡ VSB Sovereign Highway ONLINE`.

## Step 2: Initialize Node B (The Director)
1. **Nix Shell:** `nix develop`
2. **Ignite Foundry:** Launch Foundry Electron app with Port 9222.
3. **Ignite Orchestrator:** `pnpm start`
   - *Verify: `✅ VSB Heartbeat: Synchronized with Node A.`*
   - *Verify: `✅ L1-Registry: SQLite Mirror Mapped to Bus.`*

## Step 3: Initialize Sidecars
1. **Strategic Atlas:** `cd sidecar-atlas && cargo run --release` (Requires WSLg).
2. **Crush CLI:** `cd crush && go run .`
3. **Neural Compositor:** Auto-launches with Orchestrator (Node B).

## Step 4: Final Handshake
1. **Calibration:** Run `/audit` in the Crush CLI to verify sub-1ms VSB transaction times.
2. **Grounding:** Run `/scan` to verify resident Falcon perception speed.

## Troubleshooting
- **Bus Lag:** Check LAN jitter if `/audit` reports >5ms transaction latency.
- **Judge Drift:** If Node A reports VRAM thrashing, verify Open-Reasoner-Zero-1.5B is the active model.
- **Library Mismatch:** Ensure Node B is running `nix develop` to correctly map Vulkan libraries.

---
*Verified by Gemini CLI v1.9.0 Strategist.*
