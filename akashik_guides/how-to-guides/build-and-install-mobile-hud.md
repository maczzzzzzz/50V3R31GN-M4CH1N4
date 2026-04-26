# :/H0W-70 : BU1LD-4ND-1N574LL-M0B1L3-HUD
**Subject:** Manual Materialization of the Android APK
**Version:** 3.8.7

---

## 1. PREREQUISITES
To build the **Sovereign HUD**, you must be within the NixOS development shell of the Sovereign root.

```bash
nix develop
```

---

## 2. NIXOS DYNAMIC LINKER PATCH
NixOS cannot execute the standard Android SDK binaries (like `aapt2`) due to library path mismatches. You MUST patch the build tools before initiating the Flutter build.

```bash
# Locate and patch the AAPT2 binary
patchelf --set-interpreter $(cat $NIX_CC/nix-support/dynamic-linker) \
$(find ~/.gradle/caches -name aapt2 | head -n 1)
```

---

## 3. BUILDING THE APK
Once patched, navigate to the `terminal-app` directory and execute the release build.

```bash
cd terminal-app
flutter build apk --release
```

### ◈ Build Artifact Location
The materialized APK will be shored at:
`terminal-app/build/app/outputs/flutter-apk/app-release.apk`

---

## 4. INSTALLATION (SIDE-LOADING)

### 4.1 USB Transfer
1.  Connect your Android device to the workstation via USB.
2.  Mirror the `app-release.apk` to the device's `/Download` folder.

### 4.2 ADB Installation (Recommended)
If you have `adb` enabled on your device:

```bash
adb install terminal-app/build/app/outputs/flutter-apk/app-release.apk
```

---

## 5. POST-INSTALL CONFIGURATION
1.  Open **Sovereign HUD** on your device.
2.  Navigate to **Settings**.
3.  Set the **Node B IP Address** to the Tailscale IP of your Director node.
4.  Verify the **Circular Context Rings** pulse to confirm the Artery connection.

**::/5Y573M-N071C3 : BUILD_GUIDE_SHORED. THE_HUD_IS_YOURS. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[how-to-guides]] | [[onboarding]] | [[OS_CORE]]
