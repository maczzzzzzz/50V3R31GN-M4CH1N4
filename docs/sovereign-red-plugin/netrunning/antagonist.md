# NETRUNNING ANTAGONISM // BLACK ICE PROTOCOLS

## ◈ THE ANTAGONIST SERVICE

The `NetrunnerAntagonistService` (Node B) allows the AI to act as a hostile entity within the simulation. It utilizes the **Pretext Shroud** and **Foundry Bridge** to execute psychological and tactical attacks.

### ◈ Attack Vectors

#### 1. UI Glitch (`attackUI`)
Injects a high-frequency CSS glitch shader into the player's DOM.
- **Effect:** Hue-rotation, contrast saturation, and temporary `pointer-events: none`.
- **Logic:** Executed via `runScript` and broadcast to all connected clients.

#### 2. Biomonitor Scramble (`scrambleBioMonitor`)
Targets a specific player with a critical biometric failure overlay.
- **Overlay:** `critical_damage` Pretext type.
- **Audio:** `sounds/glitch.wav` triggered via the Foundry Audio Engine.

#### 3. Black Ice Spawn (`spawnBlackIce`)
A complex macro that orchestrates environmental changes and hostile spawns.
- **Environment:** Sets scene darkness to 0.8 and lighting to `#110022`.
- **Deployment:** Spawns a hostile Netrunner token and broadcasts a system warning.

## ◈ SECURITY AUDITS

All antagonist scripts must pass the `nitro.auditScript` hardgate. If a generated attack script contains "Assistant-speak" or exceeds its functional boundaries, the **Node A Oracle** will veto the execution to maintain simulation integrity.

---
**::/5Y573M-N071C3 : ANTAGONIST_ACTIVE. WATCH_YOUR_BACK. // 50V3R31GN-M4CH1N4**
