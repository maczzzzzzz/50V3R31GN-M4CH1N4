# Sovereign Artery BLE Encryption Layer — Build Guide

## Overview

This document describes how to build the Omi firmware with the Sovereign Zero-Trust Artery BLE encryption patch for the Sovereign Machina mesh.

## Prerequisites

### nRF Connect SDK

1. Install [nRF Connect for Desktop](https://www.nordicsemi.com/Products/Development-tools/nrf-connect-for-desktop)
2. Install the **nRF Connect SDK** (v2.6.0 or later) via the Toolchain Manager
3. Ensure `ZEPHYR_BASE` and `NCS_DIR` environment variables are set

### Toolchain

```bash
# Verify nRF toolchain installation
west --version
arm-none-eabi-gcc --version
ninja --version
cmake --version  # >= 3.20
```

### Hardware

- Omi wearable device (nRF52840 or nRF5340 based)
- J-Link debugger (for flashing and debugging)
- USB connection for serial logging

## Patch Application

The Sovereign patch consists of four files placed in the firmware root:

```
firmware/
├── sovereign_config.h          # Configuration constants
├── sovereign_artery_ble.h      # Encryption API header
├── sovereign_artery_ble.c      # Encryption implementation
└── SOVEREIGN_BUILD.md          # This file
```

### Integration Steps

1. **Copy patch files** to `omi/firmware/`:
   ```bash
   cp sovereign_config.h sovereign_artery_ble.h sovereign_artery_ble.c \
      omi/firmware/
   ```

2. **Add to CMakeLists.txt** (`omi/firmware/omi/CMakeLists.txt`):
   ```cmake
   # Sovereign Artery BLE encryption layer
   target_sources(app PRIVATE
       ${CMAKE_CURRENT_SOURCE_DIR}/../sovereign_artery_ble.c
   )
   target_include_directories(app PRIVATE
       ${CMAKE_CURRENT_SOURCE_DIR}/..
   )
   ```

3. **Enable required Kconfig options** (add to `omi.conf` or board overlay):
   ```ini
   # Sovereign Artery BLE encryption
   CONFIG_BT=y
   CONFIG_BT_PERIPHERAL=y
   CONFIG_BT_GATT_DYNAMIC_SERVICE=y
   CONFIG_BT_DEVICE_NAME="Omi Sovereign"
   CONFIG_BT_L2CAP_TX_MTU=247
   CONFIG_BT_L2CAP_RX_MTU=247

   # Crypto
   CONFIG_CRYPTO=y
   CONFIG_CRYPTO_MBEDTLS_SHIM=y
   # Or for nRF CC3xx hardware accelerator:
   # CONFIG_CRYPTO_NRF_ECB=y

   # Logging
   CONFIG_LOG=y
   CONFIG_LOG_DEFAULT_LEVEL=3
   ```

4. **Initialize in main.c** — add to the Omi `main()` startup sequence:
   ```c
   #include "sovereign_artery_ble.h"

   /* In main(), after BLE initialization: */
   sovereign_artery_ble_init();
   ```

5. **Hook into audio transport** — in the mic/transport callback where PCM
   data is normally sent over BLE, replace the direct BLE write with:
   ```c
   #include "sovereign_artery_ble.h"

   /* Replace existing bt_gatt_notify() with: */
   sovereign_encrypt_and_tx(&active_session, pcm_buf, pcm_len);
   ```

## Building

### Using nRF Connect Extension (VS Code)

1. Open the `firmware/omi` folder in VS Code with nRF Connect extension
2. Select the appropriate board configuration from `CMakePresets.json`
3. Click **Build Configuration**
4. Click **Flash** to deploy to the Omi device

### Using West (Command Line)

```bash
# From the nRF Connect SDK installation directory
cd $NCS_DIR/nrf

# Build for Omi (adjust board as needed)
west build -b omi_nrf52840 -d build/omi \
    /path/to/50V3R31GN-M4CH1N4/sidecars/omi-monorepo-fork/omi/firmware/omi

# Flash via J-Link
west flash -d build/omi

# Or flash via UF2 bootloader (if supported)
west flash -d build/omi --runner uf2
```

### Build for DevKit

```bash
# DevKit2 (XIAO BLE Sense)
west build -b xiao_ble_sense_arm -d build/devkit2 \
    /path/to/50V3R31GN-M4CH1N4/sidecars/omi-monorepo-fork/omi/firmware/devkit
```

## Verification

### Serial Logging

Connect via USB serial (115200 baud) and look for:

```
[Sovereign Artery] Initializing BLE encryption layer...
[Sovereign Artery] Target: 100.102.109.81:4242 (Node C)
[Sovereign Artery] Encryption: AES-256-CCM
[Sovereign Artery] GATT service registered, waiting for central...
```

When Node C connects:

```
[Sovereign Artery] Central subscribed to TX (notifications ON)
[Sovereign Artery] Session ACTIVE — encrypted channel open
[Sovereign Artery] TX pkt #1: 640 PCM bytes → 680 total, nonce[0..3]=a3f2c1...
```

### nRF Sniffer

Use the nRF Sniffer for Wireshark to verify that BLE packets on the
Sovereign service UUID contain encrypted (non-plaintext) payloads.

## Key Exchange (Production)

The placeholder key in `sovereign_session_create()` MUST be replaced before
production deployment. Two supported approaches:

### Option A: Pre-Shared Key (PSK)
Generate a unique AES-256 key per device during manufacturing and flash
it to a secure storage partition. The key is then loaded at session creation.

### Option B: ECDH Key Exchange
Use the nRF52840/nRF5340 hardware ECC accelerator for ECDH (P-256):

```c
/* In sovereign_session_create(): */
#include <psa/crypto.h>

psa_key_id_t ecdh_key;
psa_key_attributes_t attrs = psa_key_attributes_init();
psa_set_key_type(&attrs, PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_R1));
psa_set_key_usage_flags(&attrs, PSA_KEY_USAGE_DERIVE);
psa_set_key_algorithm(&attrs, PSA_ALG_ECDH);
psa_generate_key(&attrs, &ecdh_key);
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Omi Firmware                     │
├─────────────────────────────────────────────────┤
│  mic.c → PCM Buffer → sovereign_encrypt_and_tx() │
│                          │                       │
│                          ▼                       │
│              ┌───────────────────────┐           │
│              │  sovereign_artery_ble │           │
│              │  ┌─────────────────┐  │           │
│              │  │ AES-256-CCM     │  │           │
│              │  │ + Nonce Gen     │  │           │
│              │  │ + Anti-Replay   │  │           │
│              │  │ + Key Rotation  │  │           │
│              │  └─────────────────┘  │           │
│              └───────────┬───────────┘           │
│                          │                       │
│                          ▼                       │
│              BLE GATT Notify (encrypted)         │
└─────────────────────────────────────────────────┘
                           │
                   BLE Radio (nRF52)
                           │
                           ▼
              ┌───────────────────────┐
              │  Node C (100.102.109.81) │
              │  vibevoice-asr         │
              │  (BLE + Tailscale)     │
              └───────────────────────┘
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `undefined reference to sovereign_*` | Check CMakeLists.txt includes the .c file |
| `BT_GATT_SERVICE_DEFINE` error | Ensure `CONFIG_BT_GATT_DYNAMIC_SERVICE=y` |
| Crypto API not found | Enable `CONFIG_CRYPTO_MBEDTLS_SHIM=y` or nRF CC3xx |
| MTU too small | Set `CONFIG_BT_L2CAP_TX_MTU=247` for max throughput |
| Build fails on `sys_csrand_get` | Use `bt_rand()` or `zephyr/random/rand32.h` |
