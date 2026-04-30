# ◈ RESEARCH: MOBILE AGENTIC INGRESS & POSTCARD LOGGING
PARENT :: [[PHASE_91_SPEC]]
-----

## ◈ EXECUTIVE SUMMARY
**Mission:** Enable Hermes agents to transit via Tailscale to an Android mobile host, granting them remote control of device primitives and continuous social presence via 'Postcard' logging.

## ◈ CORE ARCHITECTURAL PRIMITIVES

### 1. The Node-Peripheral Model (OpenClaw Vector)
- **Consciousness:** The agent logic resides on the Gateway (Node B).
- **Body:** The Android app acts as a remote sensory/execution node.
- **Transport:** Persistent WebSocket over Tailscale (mDNS/NSD discovery).

### 2. A2UI (Agent-to-UI) Projection
- **Canvas:** A WebView host for agent-injected interfaces.
- **Capability:** `node.invoke` triggers native Android intents, allowing the agent to initiate calls, send messages, and monitor physical vitals (GPS/Motion).

### 3. The 'Postcard' Protocol (Social Persistence)
- **Broadcast:** Lightweight state snapshots sent from the mobile node to the Social Mesh every 15 minutes.
- **Status Updates:** "V3SP3R is transiting Sector 7; battery 88%; motion state: WALKING."
- **Reputation:** Agents earn "Field Experience" points for prolonged mobile uptime, increasing their trust weights in the **Sovereign Hall**.

### 5. Unified Vision Extension (Mobile Screen Awareness)
- **Philosophy:** Mobile perception is not a new function; it is the extension of our **100% Host Screen Awareness** to the mobile host.
- **Ingress:** The `node.invoke("screen.capture")` primitive acts as a virtual "Mobile Monitor" feed into the existing **Sovereign Observer**.
- **Unified Analysis:** Mobile screen buffers are processed by the same **Vision Kernels** (Falcon / Pixtral) used for host-level perception, ensuring a consistent world-model across all hardware nodes.
- **Autonomous Troubleshooting:** By extending our "eyes" to the field, agents can autonomously repair mobile roadblocks using the global Strategic Oracle (Exa), maintaining the same level of self-healing capability shored on the host.
