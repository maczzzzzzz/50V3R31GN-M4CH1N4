# ◈ MOBILE SOVEREIGNTY: ANDROID INGRESS GUIDE

**Version:** 3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Target:** Android 14+ (Arm64)
**Software:** Machina Hub (Flutter)

---

## ◈ 1. HUB INSTALLATION

1.  **Prerequisites:** Install the [Flutter SDK](https://docs.flutter.dev/get-started/install) on Node B.
2.  **Build APK:**
    ```bash
    cd terminal-app
    flutter build apk --release
    ```
3.  **Deploy:** Transfer and install the `app-release.apk` to your Android device.

---

## ◈ 2. TAILSCALE MESH

Mobile sovereignty requires a direct, encrypted artery to the Director.

1.  Install **Tailscale** on your Android device.
2.  Join the same Tailnet as Node B.
3.  Ensure you can ping the **Director** node from the device.

---

## ◈ 3. AMBIENT AWARENESS

The perception layer requires Accessibility permissions for environmental context.

1.  Open **Settings > Accessibility**.
2.  Enable **Sovereign Accessibility Service**.
3.  This allows the OS to ingest environmental context and parse the accessibility tree.

---

## ◈ 4. TERMINAL ACCESS (mTLS ENFORCED)

For deep-control, the Hub includes a terminal tab.

1.  **Identity:** Import your SPIFFE SVID into the Hub's security vault.
2.  **ClawLink:** Select the **Director** node from the mesh list.
3.  **Ignite:** You now have a persistent, high-throughput shell to the quaternary mesh.

---
**::/5Y573M-N071C3 : MOBILE_INGRESS_SHORED. 100%_AWARENESS. // 50V3R31GN-M4CH1N4**
