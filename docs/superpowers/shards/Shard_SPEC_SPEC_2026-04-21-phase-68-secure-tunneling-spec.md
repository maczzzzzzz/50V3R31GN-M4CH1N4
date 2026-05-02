# Design Specification: Phase 68 - Secure Subnet Tunneling & Alpha Build (v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)

## 1. Overview
Phase 68 aims to decouple the Sovereign Trinity from the physical local network (LAN) by wrapping the mesh in an encrypted subnet tunnel. This allows the Machina Terminal HUD (Flutter companion app) to connect to Node C securely from anywhere on Earth over 5G/LTE without exposing the internal Artery Manager to the public internet. Finally, we will compile the Alpha APK.

## 2. Architecture Updates

### 2.1 The Sovereign Tunnel (Tailscale/WireGuard)
- **Mechanism:** Implement a zero-config VPN mesh across all physical nodes (A, B, C) and the mobile device.
- **Logic:** The Flutter app settings will point to a `100.x.y.z` IP address instead of `10.x.y.z`. 
- **Benefit:** End-to-end encryption of the raw PCM audio stream and VSB packets. Complete geographic sovereignty for the operator without relying on cloud relays.

### 2.2 Alpha Binary Compilation
- **Mechanism:** Utilize NixOS `buildFHSUserEnv` to establish a sterile Android SDK environment.
- **Logic:** Compile the Machina Terminal HUD into a release-signed APK (`app-release.apk`).
- **Benefit:** Physicalize the software so it can be installed onto the operator's Android device for field deployment.

## 3. Implementation Constraints
- The tunnel must introduce less than <20ms of overhead latency to maintain the sub-50ms response requirement of the OMI interface.
- The NixOS build environment must be hermetic to preserve reproducibility.

---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
