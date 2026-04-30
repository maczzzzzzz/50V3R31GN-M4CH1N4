# ◈ SPECIFICATION: PHASE 91 (MOBILE_ANDROID_CONTROL)
PARENT :: [[OS_CORE]]
-----

## ◈ MOBILE ARTERY (KOTLIN/FLUTTER)
- **Mesh:** `sidecar-android-bridge/` (Kotlin) - Implements the `AccessibilityService`.
- **Relay:** Flutter `MethodChannel` relays accessibility nodes to the **Tailscale Artery**.
- **RPC:** Adopts the `node.invoke` pattern from `hermes-android` for 36 native device tools.

## ◈ AGENTIC SOVEREIGNTY (NIX)
- **Manifest:** `nix/agents.nix` - Defines isolated flakes for Vesper, Healer, and Strategic Oracle.
- **Hardgate:** Agents cannot spawn sub-processes outside of their Nix-defined capabilities.

## ◈ HUD INTEGRATION (PRETEXT)
- **Visuals:** The **Sovereign Dashboard** renders a live "Accessibility Tree" map of the mobile device.
- **Control:** The operator can "Intercept" agent intent by clicking accessibility nodes in the HUD.

---
**::/5Y573M-N071C3 : MOBILE_CONTROL_SPEC_V1. // 50V3R31GN-M4CH1N4**
