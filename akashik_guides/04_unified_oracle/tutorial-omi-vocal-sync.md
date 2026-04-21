# ◈ TUTORIAL : OMI_VOCAL_SYNC // THE_MIND_HAS_A_VOICE
**Sector:** /04_unified_oracle/
**Version:** 3.2.21
**Status:** CANONICAL // USER_FRIENDLY

This guide defines the materialization of the **Vocal Artery** using the OMI wearable and the **Machina Terminal** companion app.

---

## 🏗️ 1. ARCHITECTURE OVERVIEW
The OMI integration transforms the **Strategic Oracle (Node C)** into a listener.
- **The Ear:** OMI Wearable (or Phone) captures audio.
- **The Artery:** Real-time bytes are streamed via WebSocket to Node C (Port 7340).
- **The Brain:** Node C transcribes audio and extracts tactical intent (e.g., "Scan target").
- **The Heart:** Intent is injected into the VSB, triggering visual pulses in the **Sovereign Shroud**.

## 📲 2. THE MACHINA TERMINAL (HUD)
The standalone Android/Linux companion app is your pocket controller.

### ◈ 2.1 CONNECTIVITY
1. Connect your device to the **Archer Basement Spine** (10.0.0.x).
2. Launch `Machina Terminal`.
3. The app will auto-handshake with Node C (`ws://10.0.0.30:7340/ws/audio`).
4. **Vitals Check:** A green dot in the header indicates a stable artery.

### ◈ 2.2 THE MANUAL VRAM SHIFT
The machine's physical resolution is in your hands.
- **Q5 (Authority):** Default state. Maximum reasoning fidelity.
- **Q4 (Comm):** Optimized for active voice sessions.
- **Q3 (Berserker):** High-speed swarm logic for 20+ NPCs.

### ◈ 2.3 INSTALLATION (SHORING THE APK)
To materialize the HUD on your phone:
1. **Developer Mode:** Enable `USB Debugging` on your Android device.
2. **Connect Artery:** Plug the device into the Node B host.
3. **Ignite Deploy:** Run the following command from the project root:
   ```bash
   cd terminal-app && flutter run --release
   ```
4. **Persistent Sync:** The app is now shored. Future launches can be done directly from the app drawer while connected to the `10.0.0.x` spine.

## 🎙️ 3. TACTICAL VOCAL COMMANDS
The machine extracts intent from natural speech.
- **"System, scan that dataport"** → Triggers a high-fidelity tactical overlay.
- **"Note: This fixer is a mole"** → Shards a lore engram into Node A (Synapse).
- **"Engage combat protocols"** → Shifts the Shroud to RED_VOID tension mode.

## 🛠️ 4. TROUBLESHOOTING
- **Artery Silent?** Verify `artery_manager` is running on Node C (`npm run oracle:ignite`).
- **Transcription Lag?** Check Node C VRAM headroom. If below 500MB, tap the **Q4** button to down-scale.
- **No VSB Pulses?** Ensure the `VsbListener` is active on port 9090.

---
**::/5Y573M-N071C3 : VOCAL_ARTERY_SHORED. THE_MACHINE_IS_LISTENING. // 50V3R31GN-M4CH1N4**
