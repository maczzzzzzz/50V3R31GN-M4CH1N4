# Hermes Relay — Android + Windows Setup Guide

This document covers running Hermes Relay on **Windows laptops** and **Android devices** (phone/tablet) using the custom relay from:

**https://github.com/Codename-11/hermes-relay**

---

## 1. Windows Laptop (NSSM Service)

### Prerequisites
- Python 3.12+
- Git
- Administrator access

### Quick Install

1. Clone the repo:
```powershell
git clone https://github.com/Codename-11/hermes-relay.git C:\Tools\hermes-relay
```

2. Run the NSSM setup script (as Administrator):

```powershell
cd C:\Tools\hermes-relay
.\sidecars\hermes-relay\windows-nssm-setup.ps1
```

Or manually:

```powershell
nssm install HermesRelay "C:\Python312\python.exe" "C:\Tools\hermes-relay\desktop\relay.py"
nssm set HermesRelay AppDirectory "C:\Tools\hermes-relay\desktop"
nssm start HermesRelay
```

### Verification

```powershell
curl http://localhost:8767/health
```

---

## 2. Android Devices (Phone / Tablet)

The `app/` directory in the repo contains a native Android application that acts as a remote control / relay client.

### Features (from repo structure)
- Remote control of Hermes instances
- Media sharing and MMS handoff
- Bridge functionality
- Profile-scoped configuration

### Installation Steps

1. **Build the APK**
   ```bash
   cd hermes-relay/app
   ./gradlew assembleRelease
   ```
   The APK will be at:
   `app/build/outputs/apk/release/`

2. **Install on device**
   - Enable "Install from unknown sources"
   - Transfer the APK via Tailscale, USB, or GitHub Releases
   - Install and open the app

3. **Configuration**
   - Point the app at your relay server (Node A or your Windows laptop)
   - Use the same `.hermes` config profile

### Connection Options

| Device       | Connection Method          | Recommended? |
|--------------|----------------------------|--------------|
| Android Phone| Tailscale + localhost      | Yes          |
| Android Tablet| Direct Tailscale IP       | Yes          |
| Windows Laptop| Localhost (8767)           | Primary      |

---

## Recommended Architecture (Current)

- **Node A** → Native hermes-relay (always on)
- **Windows Laptop** → NSSM service (mobile use)
- **Android Phone/Tablet** → Companion app for remote control

---

**Last Updated:** May 18, 2026