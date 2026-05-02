# ◈ SIDECAR : BROWSER_EXTENSION // VIVALDI_INGRESS
**Version:** 3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Artery:** Vivaldi Sidebar -> Browser Mesh (:3012) -> Hermes Singularity

## ◈ OVERVIEW
The Sovereign Browser Extension provides a high-fidelity ingress pipeline for web-based research and real-time context. It allows the operator to push URL metadata and selected text fragments directly into the Hermes reasoning swarm from the Vivaldi browser.

## ◈ TECHNICAL ARCHITECTURE
- **Protocol:** Manifest V3 (MV3).
- **Relay:** Persistent WebSocket connection to `localhost:3012`.
- **Ingestor:** `packages/hermes-core/src/api/browser-bridge.ts` (Node B).
- **Heartbeat:** 5-second pulse to maintain bridge stability.

## ◈ OPERATIONAL MODES
1. **Ambient Sync:** Automatically pushes the current page title and URL to the `Context-DAG`.
2. **Selective Push:** Pushes the active text selection to the `HermesSingularity` for immediate analysis.
3. **Ghost-Observation:** Passive listening for page-load events to trigger related lore lookups in `Akashik.db`.

## ◈ PORT CONFIGURATION
| Component | Port | Purpose |
| :--- | :--- | :--- |
| **Mesh Server** | 3012 | WebSocket listener for extension frames. |
| **Cognition Router**| 7341 | Proxies context-enriched research queries. |

---
**::/5Y573M-N071C3 : BROWSER_EXTENSION_STONE_SHORED. THE_WEB_IS_GROUNDED. // 50V3R31GN-M4CH1N4**
