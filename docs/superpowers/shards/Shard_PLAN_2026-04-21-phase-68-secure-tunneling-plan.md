# IMPLEMENTATION PLAN: Phase 68 - Secure Subnet Tunneling & Alpha Build

## 🎯 Objective
Establish an encrypted geographic perimeter around the Sovereign Trinity and compile the Machina Terminal HUD into an installable Alpha APK.

## 📋 Step-by-Step Execution

### Task 1: NixOS Android SDK Scaffolding
1.  Create a `shell.nix` inside `terminal-app/` utilizing `buildFHSUserEnv` and `androidenv`.
2.  Ensure `jdk17`, `flutter`, and `androidsdk` are present and mapped to `ANDROID_HOME`.

### Task 2: Alpha Binary Compilation
1.  Execute the Nix shell environment.
2.  Run `flutter build apk --release`.
3.  Extract `app-release.apk` to the project root for deployment.

### Task 3: Secure Tunnel Strategy (Tailscale/WireGuard)
1.  Document the installation process for adding the mobile device to the Tailnet.
2.  Ensure the Flutter app settings default to the Subnet tunnel when the "Secure Tunnel" toggle is active.

## 🛡️ Verification
- Successful generation of `app-release.apk`.
- App installs on Android hardware and correctly renders the CRT Scanline UI.

---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
