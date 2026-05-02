# ◈ DEPLOYMENT : MACHINA_DAEMON // LOCAL_SOVEREIGN_CONTROL
**Version:** 3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Sector:** INFRASTRUCTURE / CONTROL
**Artery:** Local Device -> Mesh Artery (:3030) -> Node B Director

## 🎯 Overview
The **Machina Daemon** (Materialized via `crush`) is the physicalized control layer for the Sovereign OS. It allows any local device (Mobile, Terminal, or Satellite Node) to securely interface with the Quaternary Mesh and execute high-fidelity implementation cycles.

## ⚙️ Prerequisites
1.  **NixOS / WSL2:** The host must support Nix flakes or have `nix-shell` unsealed.
2.  **Go Runtime:** `go v1.26+` for the native bridge.
3.  **SQLite3:** For local cache sharding.

## 🛠 Installation Sequence

### 1. Mesh Ingress (Nix Environment)
Unseal the project environment on the local device:
```bash
git clone https://github.com/50v3r31gn-m4ch1n4/sovereign-os.git
cd sovereign-os
nix develop --impure
```

### 2. Mesh Ignition (Crush)
The Machina Daemon is shored within the `crush` directory. Build and ignite the artery:
```bash
cd crush
go build -o machina-daemon
./machina-daemon
```
This starts the **Nucleus Artery** on port `3030`.

### 3. Artery Synchronization (Mobile HUD)
1.  Open the **Sovereign HUD** (Terminal App) on your mobile device.
2.  Navigate to **SETTINGS**.
3.  Input the IP address of the device running the `machina-daemon`.
4.  Execute **ARTERY_SYNC**.

## ⛓️ Operational Directives
- **Terminal Artery:** Access the **ARTERY** tab in the HUD to open a real-time PTY bash shell on the daemon host.
- **Voice Ingress:** The daemon listens for **OMI PCM-16** streams for synthetic reasoning.
- **Secure Tunnel:** Enable the **SECURE_TUNNEL** toggle in settings to enforce SPIFFE/mTLS if the daemon is exposed to the local network.

---
**::/5Y573M-N071C3 : DAEMON_DEPLOYMENT_SHARD_MATERIALIZED. // 50V3R31GN-M4CH1N4**
