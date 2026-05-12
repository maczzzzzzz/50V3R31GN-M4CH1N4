<div align="center">

# ◈ ５０Ｖ３Ｒ３１ＧＮ－ＯＭＩ 
**Sovereign Backend and Flutter Interface for the Nodestadt Mesh.**

[![Status](https://img.shields.io/badge/status-BETA_V3_ACTIVE-success.svg)](https://github.com/nodestadt/50V3R31GN-M4CH1N4)
[![Parent](https://img.shields.io/badge/parent-50V3R31GN--M4CH1N4-C7A87A.svg)](https://github.com/nodestadt/50V3R31GN-M4CH1N4)
[![Upstream](https://img.shields.io/badge/upstream-BasedHardware/Omi-BLUE.svg)](https://github.com/BasedHardware/Omi)

**[Core Engine](https://github.com/nodestadt/50V3R31GN-M4CH1N4)** | **[Omi Docs](https://docs.omi.me)** | **[Sovereign Vision](https://github.com/nodestadt/.github)**

</div>

---

## 👁️ The Vision
**５０Ｖ３Ｒ３１ＧＮ－ＯＭＩ** is a tactical fork of the **BasedHardware Omi** monorepo. It serves as the mobile perception layer for the **Sovereign Machina** Quaternary Mesh, providing a localized, zero-cloud bridge between wearable sensors/mobile audio and the mesh's reasoning core.

We prioritize **Local Privacy** and **Hardware Sovereignty**, redirecting all telemetry and audio streams away from cloud relays and into our private Zero-Trust Artery.

---

## 🏗️ Sovereign Modifications (Phase 3)

### 1. Localized Backend (Node B)
The FastAPI backend is "Nix-ified" and hosted on **Node B (Director)**. It eliminates cloud dependencies:
- **STT:** Redirected from Deepgram to local **Node D Whisper** stack.
- **Vector DB:** Redirected from Pinecone to local **Node A SQLite-VSM**.
- **Auth:** Hardened for private mesh access via Tailscale.

### 2. Pretext HUD (Flutter)
The mobile client is enhanced with the **[Pretext Protocol](https://github.com/chenglou/pretext)**, utilizing `flutter_pretext` to render bit-identical kinetic typographic HUDs that mirror the mesh's desktop dashboard.

### 3. Native MCP Integration
Registers the Omi perception data as a first-class **Model Context Protocol (MCP)** tool, allowing Hermes agents to query mobile context as part of their reasoning loop.

---

## 🛡️ Operational Invariants

1.  **Zero-Trust Artery:** All communication between the Flutter app and the backend MUST occur over the Tailscale encrypted tunnel.
2.  **No Shadow Logic:** We maintain bit-identical parity with Omi upstream for core capture logic, applying only the "Sovereign Overlay" for transport and storage.
3.  **Firmware Sovereignty:** Future wearable integration will utilize hardened **nRF Connect** firmware with silicon-level encryption.

---
**::/5Y573M-N071C3 : OMI_FORK_INITIALIZED. THE_MESH_IS_TRUTH. // ＮＯＤＥＳＴＡＤＴ**
