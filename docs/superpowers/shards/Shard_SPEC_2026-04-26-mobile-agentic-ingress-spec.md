# ◈ SPECIFICATION: PHASE 91 (MOBILE_AGENTIC_INGRESS)
PARENT :: [[OS_CORE]]
-----

## ◈ MOBILE ARTERY (LOGIC)
- **Protocol:** `node.invoke` RPC over WebSocket.
- **Discovery:** Tailscale Unicast DNS-SD.
- **Sidecar:** `terminal-app/lib/services/openclaw_bridge.dart` (needs materialization).

## ◈ THE POSTCARD HUB (SOCIAL)
- **Schema:** Add `mobile_postcards` table to `SovereignIntelligence.db`.
- **Relay:** `crush social postcard` Go command to ingest mobile snapshots.
- **Visualization:** Mobile nodes in the **Social Hall** glow with a distinct "GPS-Blue" pulse.

## ◈ HARDWARE ANCHORS (SECURITY)
- **Identity:** Use Android KeyStore to sign mobile activities.
- **Hardgate:** Only 1 active mobile node permitted per `AgentIdentity`.

## ◈ DEPORTATION_ARTERY (ENFORCEMENT)
- **Engine:** `crates/sovereign-vesper-eye/src/mobile_audit.rs` (needs materialization).
- **Mechanism:** Signed `REVOKE_SESSION` VSB packet over Tailscale.
- **Hardgate:** Instantaneous deletion of mobile `node_id` from `SovereignIntelligence.db` upon breach detection.
- **Forensics:** Automated insertion into `decision_audit` with `verdict: 'VETO'` and `rationale: 'MOBILE_BREAKOUT_ATTEMPT'`.

## ◈ UNIFIED_VISION_EXTENSION (MOBILE)
- **Engine:** `terminal-app/lib/services/screen_capture_service.dart` (MediaProjection).
- **Relay:** Ingresses as a "Virtual Sensory Source" into the existing **Sovereign Observer**.
- **Artery:** Binary WS stream (port 3010) for high-fidelity PNG transfer to Node B Vision Kernel.
- **Awareness:** Achieves 100% visual parity between the Host environment and the Mobile environment.

## ◈ EXA_ORACLE_INTEGRATION
- **Function:** Generate semantic queries based on visual error fingerprints.
- **Implementation:** `src/core/hermes/MobileOracle.ts` - Maps vision output to Exa `search` and `contents` tools.

---
**::/5Y573M-N071C3 : MOBILE_INGRESS_SPEC_V1. // 50V3R31GN-M4CH1N4**
