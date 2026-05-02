# ◈ HOW TO SET UP THE QUATERNARY MESH (NODESTADT AUTHORITY OS)

**Version:** v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-GOLD-RELEASE
**Target:** Multi-Node Hardware Ignition

---

## ◈ 1. PREREQUISITES

### ◈ Hardware Nodes
- **Node A (Mooncake):** NVIDIA GTX 1050 Ti (4GB+), NixOS Native.
- **Node B (Director):** 16GB+ VRAM (AMD RX 9060 XT), WSL2/Ubuntu.
- **Node C (Strategic Oracle):** NVIDIA RTX 2060 (6GB+), Remote Server.
- **Node D (Quaternary):** Intel Core Ultra 5 125U (NPU-Capable) // 48GB DDR5.

### ◈ Networking
- **Static IPs:** All nodes should be on the 10.0.0.x spine.
- **SSH Keys:** Passwordless SSH (id_ed25519) required for ClawLink orchestration.

---

## ◈ 2. SYSTEM IGNITION

The Sovereign OS is orchestrated via the **Deck Igniter** TUI.

### ◈ Method 1: The Supervisor (TUI)
From **Node B (Director)**, execute the interactive supervisor:
```bash
npm run boot
```
- **ctrl+i:** Sequential Ignition (Node A -> Node B -> Sidecars).
- **ctrl+p:** Purge zombie processes.
- **shift+q:** Shutdown mesh.

### ◈ Method 2: Headless Artery
For automated or background sessions:
```bash
bash scripts/audit/ignite-all.sh
```

---

## ◈ 3. PROFILE MANAGEMENT (Clean BASE)

The mesh supports strict logical separation between core OS operations and simulation lore.

- **Main Sovereign OS:** Default boot. Lore-neutral clinical standard.
- **Simulation (RED):** Enabled via `IGNITER_MODE=cpr npm run boot`. Ignites Foundry VTT and simulation-specific sidecars.

---
**::/5Y573M-N071C3 : SETUP_GUIDE_SHORED. // 50V3R31GN-M4CH1N4**
