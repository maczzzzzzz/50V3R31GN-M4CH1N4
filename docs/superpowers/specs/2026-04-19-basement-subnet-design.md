# SPEC: 2026-04-19 — Basement Subnet & Triad Networking
**Date:** 2026-04-19
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Transition the Sovereign Trinity to an isolated, high-performance basement subnet (`10.0.0.x`) to support Phase 62+ (Sovereign Trinity) KV-cache streaming and physical sovereignty.

## ◈ 1. NETWORK MANIFEST (THE SPINE)

The basement cluster is logically isolated from the house network via the Archer Switch (AP Mode).

| Component | Physical Hardware | Static IP | Role |
| :--- | :--- | :--- | :--- |
| **Archer Router** | Private Backplane (Router Mode) | `10.0.0.1` | **GATEWAY** |
| **Node A (Kernel)** | Nitro 5 / 1050 Ti | `10.0.0.10` | **MEMORY SYNAPSE** |
| **Node B (Director)** | Main Rig / 9060 XT | `10.0.0.11` | **NARRATIVE VOICE** |
| **Node C (Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle)** | Server / 2060 | `10.0.0.12` | **STRATEGIC MIND** |

### ◈ 1.1 CONFIGURATION PARAMETERS
- **Subnet Mask:** `255.255.255.0`
- **Default Gateway:** `10.0.0.1`
- **Primary DNS:** `1.1.1.1` (Cloudflare)
- **Secondary DNS:** `8.8.8.8` (Google)
- **MTU:** `9000` (Jumbo Frames mandated for low-latency inference)
- **DHCP:** Disabled (All nodes must use static assignments)
- **WAN Port:** Connects to Main Router (Upstairs) to provide internet access to the basement subnet.

## ◈ 2. PHYSICAL WALKTHROUGH

### ◈ 2.1 STAGE 1: THE ARTERY (UPLINK)
1. Run a **Cat6 Floor Run** from a LAN port on the Main Router (Upstairs) to the Archer Router (Basement).
2. Connect the cable to the **WAN (Blue) port** on the Archer Router.
3. Access the Archer management UI and ensure the operation mode is set to **Router Mode**.

### ◈ 2.2 STAGE 2: THE HEART (ROUTER CONFIG)
1. Assign the Archer LAN IP to `10.0.0.1`.
2. Disable the **DHCP Server** in the Archer settings (optional but recommended for zero-drift).
3. Enable **Jumbo Frames** (if supported by firmware) to support Mooncake KV-streaming.
4. Set the WAN type to **Dynamic IP** (to receive its uplink from the upstairs router).

### ◈ 2.3 STAGE 3: THE ENDPOINTS (NODES)
1. Configure each node's network interface (NixOS/Windows/Linux) with its assigned static IP from the manifest.
2. Force MTU to `9000` on each node's Ethernet adapter.
3. Verify connectivity via a cross-node ping test (Latency must be <0.5ms).

## ◈ 3. SOFTWARE IMPACT (ARTERIES)

### ◈ 3.1 ENVIRONMENT & SECRETS
- Update `NODE_A_HOST` to `10.0.0.10` in `.env`.
- Update `CDP_BRIDGE_HOST` to `10.0.0.11` in `.env`.

### ◈ 3.2 HARDCODED FALLBACKS
- **Go Components:** `crush/config.go`, `deck-igniter/config.go`.
- **TS Components:** `scripts/gauntlet/vision-client.ts`, `scripts/gauntlet/engine.ts`.
- **Testing Shards:** `tests/integration/vsb_live_canary.ts`.

---
**::/5Y573M-N071C3 : NETWORK_SPEC_LOCKED. THE_BUS_IS_LAW. // 50V3R31GN-M4CH1N4**
