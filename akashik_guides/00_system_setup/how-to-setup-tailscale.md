# ◈ HOW-TO: SECURE SUBNET TUNNELING (TAILSCALE)
**Version:** 3.8.6
**Identity:** 50V3R31GN-M4CH1N4

This guide details how to encapsulate the Sovereign Trinity mesh within a zero-config VPN, allowing the Machina Terminal HUD to connect securely from anywhere on Earth.

## 1. Node Initialization (NixOS)
Tailscale must be installed and authenticated on all physical nodes (A, B, C).

**NixOS Configuration (`configuration.nix`):**
```nix
services.tailscale.enable = true; # (Materialized v3.8.6)
```

**Activation:**
```bash
sudo tailscale up
```
*Note the `100.x.y.z` IP address assigned to Node C.*

## 2. Mobile Device (OMI Companion)
1. Install the Tailscale app on your Android device.
2. Authenticate using the same Tailnet account used for the nodes.
3. Connect to the VPN.

## 3. Machina Terminal HUD Configuration
1. Open the Machina Terminal app on your Android device.
2. Navigate to the **Settings** tab.
3. In the **NODE C IP ADDRESS** field, enter Node C's Tailscale IP (e.g., `100.10.20.30`).
4. Toggle **SECURE TUNNEL (VPN)** to `ON`.
5. Tap **SAVE SETTINGS**.

The app will now route all WebSocket (`/ws/audio`) and HTTP (`/shift`) traffic through the encrypted subnet, ensuring complete geographic sovereignty and preventing any raw port exposure to the public internet.

---
**::/5Y573M-N071C3 : TAILSCALE_TUNNEL_DOCUMENTED. // 50V3R31GN-M4CH1N4**\n## ◈ v3.8.6 MESH UPDATES\n- **DIRECTOR_IP:** Ensure `NODE_B_IP` is shored in app settings for theme orchestration.\n- **TUNNEL_SYNC:** Chat history auto-syncs via port `7340` over the Tailscale pipe.


---
**LINKS:** [[00_system_setup]] | [[OS_CORE]]
