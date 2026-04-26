# :/U53R-6U1D3 : M0B1L3-V4UL7-5YNC // 7H3-50V3R316N-L1NK
**Subject:** Mobile Obsidian Setup & Tailscale Auto-Sync Artery
**Version:** 3.8.7

---

## 1. OVERVIEW
The **Sovereign Link** enables 100% parity between your workstation and mobile device. Using Tailscale as the encrypted spine, the Machina Terminal HUD bidirectional syncs the **Lore RKG** and **Technical OS** vaults directly to the Android filesystem.

---

## 2. 📂 MOBILE SETUP PROTOCOL

### 2.1 Tailscale Ignition
1.  Ensure **Tailscale** is active on your Android device and authenticated to the Sovereign Tailnet.
2.  Note the Tailscale IP of **Node B** (The Director).

### 2.2 Terminal HUD Configuration
1.  Open the Machina Terminal app -> **Settings**.
2.  Set **NODE B IP ADDRESS** to Node B's Tailscale IP.
3.  Set **OBSIDIAN VAULT PATH** to the local Android directory where you want the vault materialized (e.g., `/Documents/Sovereign_OS`).
4.  Toggle **VAULT AUTO-SYNC** to `ON`.

---

## 3. ⚡ THE SYNC ARTERY (LOGIC)

### 3.1 ObsidianSyncService.dart
The HUD utilizes the native `ObsidianSyncService` to bridge the physical boundary:
- **Protocol:** High-throughput incremental sync over Port `3014`.
- **Mechanism:** Monitors Node B for file changes in `data/vault/Sovereign_OS/` and pushes delta-updates to mobile every 5 minutes (or on manual trigger).

### 3.2 Mobile Obsidian Configuration
1.  Open the **Obsidian Mobile App**.
2.  Select "Open folder as vault".
3.  Navigate to the directory specified in Section 2.2.
4.  The vault will materialize automatically as the Artery synchronizes.

---

## 4. 🛡️ PHYSICAL SOVEREIGNTY
- **Zero Cloud:** No third-party sync services (iCloud, Google Drive) are required or permitted.
- **Fail-Closed:** If Tailscale disconnects, the sync artery freezes to prevent data corruption.
- **Audit Trail:** Every sync event is logged to the `decision_audit` on Node B with the `MOBILE_SYNC` prefix.

---
**::/5Y573M-N071C3 : MOBILE_LINK_DOCUMENTED. THE_VAULT_IS_EVERYWHERE. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[07_obsidian_vault]] | [[00_system_setup]] | [[PHASE_91_MOBILE_INGRESS]]
