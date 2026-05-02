# ◈ INFRASTRUCTURE : OBSIDIAN_ARTERY // COMMAND_CENTER
**Version:** 3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Sector:** INFRASTRUCTURE / PERSISTENCE
**Artery:** Local WebSocket (:3012) -> Obsidian API -> Vault

## 🎯 Purpose
The **Obsidian Artery** is the physicalized interface for the **Sovereign MemPalace**. It materializes live-updating dashboards, meeting journals, and intelligence shards directly within your Obsidian vault, providing a human-readable bridge to the Quaternary Mesh.

## ⚙️ Runtime
- **Boot:** Automatically activated via `deck-igniter` or manual load.
- **Config:** `Sovereign_OS/.obsidian/plugins/sovereign-os/manifest.json`

## ⛓️ Integration
1.  **Artery Pulse:** Receives `MEM_ENGRAVE` intents from Hermes to create durable lore.
2.  **Dashboard Sharding:** Streams system vitals (VRAM, TTFT, Reputation) into the `Sovereign Dashboard.md` note.
3.  **Vault Sealing:** Provides a manual command (`Ctrl+P` -> `Seal the Vault`) to synchronize local lore with the mesh.

---

## 🛠 Desktop Installation (Node B)
1.  Navigate to `sidecars/sidecar-obsidian-plugin/`.
2.  Install dependencies: `npm install`.
3.  Build the shard: `npm run build`.
4.  In Obsidian: **Settings** -> **Community Plugins** -> **Turn off Safe Mode**.
5.  Copy `main.js`, `manifest.json`, and `styles.css` to your vault at `.obsidian/plugins/sovereign-os/`.
6.  Enable **Sovereign OS** in the plugin list.

---

## 📱 Mobile Installation (Android / iOS)
The Sovereign Brain must be accessible on all operator devices for total situational awareness.

### 1. Vault Synchronization
To access your shards on mobile, use a synchronization method:
- **Obsidian Sync:** The native, end-to-end encrypted artery.
- **Remotely Save:** (Community Plugin) Sync via S3, WebDAV, or Dropbox.
- **Git:** Use the **Obsidian Git** plugin on mobile (requires Termux on Android or Working Copy on iOS).

### 2. Manual Plugin Side-load
Since the Sovereign plugin is a custom shard, it must be manually placed on your device:
1.  **Android:** Use a file manager (like Solid Explorer) to navigate to your vault's path.
2.  Create the directory: `.obsidian/plugins/sovereign-os/`.
3.  Transfer `main.js`, `manifest.json`, and `styles.css` from Node B to this directory.
4.  **iOS:** Use the **Files** app or a dedicated Git client to move the plugin files into the vault folder.

### 3. Ignition
1.  Open Obsidian on your mobile device.
2.  Navigate to **Settings > Community Plugins**.
3.  Enable **Sovereign OS**.
4.  Verify that the **Sovereign Dashboard** note materializes.

---
**::/5Y573M-N071C3 : OBSIDIAN_INFRASTRUCTURE_SHORED. // 50V3R31GN-M4CH1N4**
