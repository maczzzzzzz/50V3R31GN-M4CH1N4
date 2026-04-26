# :/R3F3R3NC3 : 7H3-CRU5H-4R73RY // THE_PHYSICAL_BRIDGE
**Subject:** Sovereign-Proxy (Crush) Headless Operations
**Version:** 3.8.7

---

## 1. OVERVIEW
The **Crush Artery** is a Go-native, ultra-low-latency physical bridge. It operates 100% headless, connecting the NixOS sandbox to the Windows host environment and managing the physical state of the Sovereign Trinity.

All interactive TUI capabilities have been permanently deprecated in favor of the **Hermes Ink Shell** and the **Pretext HUD**.

---

## 2. CORE RESPONSIBILITIES

### 2.1 The Virtual System Bus (VSB)
- **Port:** `UDP 7878`
- **Function:** Handles all high-speed binary telemetry, packet signing, and Mmap synchronization (`black_ice_state.mem`) between Node A, Node B, and the Windows Host.

### 2.2 The ClawLink SSH Mesh
- **Function:** Maintains a persistent SSH tunnel to ZeroClaw (Node A), allowing the Orchestrator (Node B) to dispatch mechanical validation tasks with zero overhead.

### 2.3 The Nucleus Deck (Legacy HUD Support)
- **Port:** `TCP 3011`
- **Function:** Provides a fallback WebSocket endpoint for legacy HUD configurations, routing commands into the primary Orchestrator loop.

---

## 3. IGNITION PROTOCOL
The Crush Artery is ignited automatically by the system boot sequence in `scripts/audit/ignite-all.sh`.

```bash
# Manual Headless Ignition (Troubleshooting only)
./crush/crush start --full --headless
```

**::/5Y573M-N071C3 : CRUSH_ARTERY_DOCUMENTED. THE_BRIDGE_IS_HEADLESS. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[01_crush_artery]] | [[OS_CORE]]
