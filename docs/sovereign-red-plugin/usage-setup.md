# ◈ SOVEREIGN RED PLUGIN: USAGE & SETUP

**Version:** 3.8.24-SYNTHESIS
**Mode:** [RED_DIRECTOR]

---

## ◈ 1. SETUP: FOUNDRY VTT INTEGRATION

The Red Plugin enables the **Cyberpunk RED** simulation layer.

### ◈ Prerequisites
1.  **Foundry VTT:** Installed on Node B (Windows host).
2.  **50v3r31gn-bridge:** This module must be enabled within your Foundry World.
3.  **win-proxy:** Ensure the Go-native Windows proxy is running (`crush proxy`).

### ◈ Installation
1.  Navigate to `docs/sovereign-red-plugin/`.
2.  Run the initializer: `npm run plugin:setup`.
3.  This will unify `Akashik.db` and create the local simulation cache.

---

## ◈ 2. USAGE: THE DIRECTOR'S HUD

Switch the dashboard to **RED Mode** via the profile selector or `crush profile RED_DIRECTOR`.

### ◈ Tactical Commands
- `crush hack unlock door-42`: Directly manipulate Foundry scene objects.
- `crush scan hazards`: Use Node B vision to identify traps/hazards in the VTT map.
- `/roll 1d10 + 7`: Execute simulation dice logic via the Hermes shell.

### ◈ Netrunning Shrouds
The Netrunning sidecar provides a dedicated UI for matrix-style infiltration.
1.  Open the **Netrunning HUD** from the dashboard side-rail.
2.  Agents will visualize the network topology as a 3D wireframe.
3.  Use the `crush sy573m-5h0ck` command for direct simulation interference.

---

## ◈ 3. ASSET FORGING

Materialize NPCs and items directly into Foundry:
```bash
crush forge run --ingestion-dir data/ingestion/cpr
```
Smart PNGs created via **ST3GG steganography** will be automatically indexed and ready for use as Foundry tokens.

---
**::/5Y573M-N071C3 : RED_PLUGIN_GUIDE_LOCKED. THE_STREET_IS_LIVE. // 50V3R31GN-M4CH1N4**
