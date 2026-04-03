# Master Startup Guide: ASP.GM-Agent (v1.1.2)
### Hardened Split-Node & Neural Uplink Initialization

This document provides the high-fidelity operational sequence for igniting the **Split-Node v1.1.2** world engine and its hardware perception loop.

---

## 🏗️ Hardware Check
- **Node A (Rules Vault):** Ubuntu 24.04 (NVIDIA 1050 Ti). Sandboxed via Nix/Bubblewrap.
- **Node B (Director):** Windows (AMD RX 9060 XT 16GB). Managing Neural Uplink & Akashic Record.

## 🚀 Step 1: Initialize Node A (The Rules Vault)
1. **Ignite:** `ssh maczz@192.168.0.50 'sudo systemctl start zeroclaw'`.
2. **Jail:** The service automatically enters the **Bubblewrap sandbox** upon ignition.
3. **Verify:** Check logs for `📡 ZeroClaw ACTIVE and listening on: 0.0.0.0:7878`.

## 🚀 Step 2: Initialize Node B (The Director)
1. **CDP Port:** Ensure Foundry VTT is CLOSED.
2. **Ignite Foundry:** Launch the Foundry Electron app with the debugging flag:
   ```powershell
   & "C:\Program Files\Foundry VTT\Foundry VTT.exe" --remote-debugging-port=9222
   ```
3. **Ignite Orchestrator:** `npm start`.
   - *Verify: `✅ Neural Uplink: Native CDP Engine Active.` in stdout.*

## 🚀 Step 3: Initialize Sidecars
1. **Strategic Atlas:** `cd sidecar-atlas && cargo run --release`.
2. **Crush CLI:** `cd crush && ./crush.exe run`.

## 🚀 Step 4: Final Handshake
1. **Connect:** Verify the binary bridge establishment in both terminals.
2. **Grounding:** Run `/scan` in the Crush CLI to verify GPU-level vision capture.

## ⚠️ Troubleshooting
- **Uplink Failure:** Ensure no other browser tab is using Port 9222.
- **Akashic Error:** Check `data/logs/db.log` if `Akashik.db` fails to flush.
- **Timeout:** The Throttling Queue handles 1050 Ti latency; do not spam commands during concurrent Swarm tasks.
