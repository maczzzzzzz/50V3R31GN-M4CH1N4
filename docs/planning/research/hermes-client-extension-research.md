# Hermes Client Extension Research

Date: 2026-05-16
Assessor: Gemini 3.1 Pro (delegated by GLM-5)
Status: Research complete, awaiting deployment decision

---

## Objective

Assess two GitHub repositories for extending mesh access to:
1. Android tablet and phone
2. Windows 11 laptop (clean install, no special software)

Evaluated against NODESTADT Quaternary Mesh specs (AGENTS.md v3.9), Tailscale-only networking, and post-RTX 5060 Ti upgrade capabilities.

---

## 1. hermes-relay (Codename-11)

- **Repo:** https://github.com/Codename-11/hermes-relay
- **Stars:** 23 | **Issues:** 17 | **Last Update:** May 15, 2026

### A. Architecture

Hub-and-spoke multi-surface platform. Central Python/aiohttp relay server connects Hermes Agent to client "surfaces" (native Android app, Desktop CLI/TUI). HTTP/SSE for real-time chat streaming. Secure WebSockets (WSS) for remote control and tool routing.

### B. Hermes API Compatibility

Bit-compatible with the hermes-agent tool registry. Follows Open WebUI SSE pattern. Authentication uses 6-character pairing code or QR code for initial device setup, backed by Android Keystore (StrongBox) for session storage. Supports time-bound session grants (TTL).

### C. Deployment on the Mesh

Moderate complexity. Requires Python 3.11+. Relay server is lightweight and avoids competing for VRAM (traffic routing only, no inference). Strong Docker candidate.

### D. Security Posture

Strong. Supports WSS/HTTPS. TOFU (Trust On First Use) certificate pinning prevents MITM. Per-app blocklist (blocks banking/2FA apps by default). Requires on-device confirmation for destructive actions. Devices connect outbound to server -- no open incoming ports required. Compatible with Tailscale-only mesh.

### E. Client Experience

High quality. Android app uses native Material 3 (Kotlin/Compose). Windows/laptop client is Ink-based TUI. Includes aggressive reconnect-on-drop logic, racing multiple endpoints (Tailscale vs LAN) for lowest latency. No true offline LLM support -- requires mesh connection.

### F. Post-5060 Ti Impact

High. Relay can route TTS/STT and vision tasks. Moving to RTX 5060 Ti on Node D with Qwen3.5-35B-A3B-MTP means relay can offload heavy vision tasks (screen context analysis) to Node D much faster than relying on Node B's current 2B vision model.

### G. Showstoppers

Desktop CLI binaries are **unsigned**. On clean-install Windows 11 laptop, Windows SmartScreen will throw aggressive warnings/blocks. Requires manual bypass.

### H. Deployment Plan

1. Build Docker image from repo on Node B
2. Deploy relay server container on Node B (Docker Desktop, alongside LiteLLM port 4000)
3. Install Android app on phone + tablet from APK or Play Store
4. Install Desktop CLI/TUI on Windows 11 laptop
5. All traffic routed exclusively over Tailscale IPs
6. Pair devices via QR code or 6-digit code

---

## 2. hermes-android (raulvidis)

- **Repo:** https://github.com/raulvidis/hermes-android
- **Stars:** 178 | **Issues:** 4 | **Last Update:** May 16, 2026

### A. Architecture

Direct bridge application. NOT a chat UI. WebSocket client connecting Android device directly to Hermes server. Exposes 36+ low-level android_* tools (tap, swipe, read screen) via Android Accessibility Services.

### B. Hermes API Compatibility

Direct WebSocket connection exposing tools to the agent. Server orchestrates auth and tool calling. No separate relay needed.

### C. Deployment on the Mesh

Low server-side (connects to existing agent). High client-side (requires granting deep system accessibility permissions on Android devices).

### D. Security Posture

Weak by default. Uses unencrypted ws://. Recommends TLS proxy. Tailscale WireGuard tunnel mitigates network-layer interception risk. Bigger risk is god-level accessibility permissions if device is compromised.

### E. Client Experience

Purely utilitarian. Silent bridge for agent to control the phone. Not a conversational UI. Latency tied to network. Zero offline support.

### F. Post-5060 Ti Impact

Massive. Heavily relies on AI comprehending Android screen when accessibility view trees fail or are obfuscated. Node D's new 5060 Ti running 35B multimodal model turns this from a clunky automation tool into a highly capable autonomous device operator.

### G. Showstoppers

Android battery management. Accessibility Services are killed by aggressive battery optimizers (especially Samsung/Xiaomi). Must manually exclude from all battery restrictions.

### H. Deployment Plan

1. Install app directly on Android phone and tablet
2. Point WebSocket connection to Node B Tailscale IP (where Hermes agent + LiteLLM live)
3. Grant Accessibility Services permissions
4. Whitelist app from battery optimization
5. Only deploy if autonomous device control is a use case (not for chatting)

---

## Final Verdict

These repos are complementary, not competing.

| Use Case | Tool | Priority |
|----------|------|----------|
| Chat with mesh from phone/tablet/laptop | hermes-relay | Deploy now |
| Chat with mesh from Win11 laptop TUI | hermes-relay | Deploy now |
| Agent-controlled phone automation | hermes-android | Post-5060Ti upgrade |
| Vision-guided device interaction | hermes-android | Post-5060Ti upgrade |

### Recommended Deployment Sequence

1. **Now:** Deploy hermes-relay server on Node B (Docker). Install clients on all devices.
2. **Monday (post-upgrade):** Reassess hermes-android once Node D has 35B multimodal on GPU.

---

## Supplementary Research: tmux + Zeroboot Integration Potential

Date: 2026-05-16 (follow-up analysis by GLM-5 from repo source inspection)

### tmux Integration: Native, First-Class

hermes-relay has tmux baked into the protocol at the wire level.

**Desktop CLI Shell Mode:**
- Bare `hermes-relay` pipes the host's actual Hermes Ink TUI through a PTY in tmux
- From any device (Win11 laptop, eventually Android), you get the full TUI as if local
- `Ctrl+A .` detaches (tmux session persists), `Ctrl+A k` kills
- `Ctrl+A v` pastes clipboard image into the conversation (Win+Shift+S -> Ctrl+A v workflow)
- Conversation picker on attach -- resume existing server-side sessions

**Android Terminal (Phase 2 of hermes-relay, not yet shipped):**
- "Secure remote shell via tmux" is a planned channel
- Would let you jump into tmux sessions from your phone

**Desktop Tool Routing (the game-changer):**
The relay exposes a `desktop_*` toolset that lets the agent execute on connected client machines:
- `desktop_terminal` -- run arbitrary shell commands on YOUR device
- `desktop_read_file` / `desktop_write_file` / `desktop_patch` -- file operations on YOUR device
- `desktop_search_files` -- ripgrep on YOUR device
- `desktop_screenshot` -- capture YOUR screen
- `desktop_clipboard_read/write` -- clipboard access on YOUR device
- `desktop_open_in_editor` -- open files in YOUR editor

This means: Hermes agent running on Node B can reach out and execute on the Win11 laptop, the Android devices, or any machine running the desktop CLI daemon.

**Safety:** Consent gate per-URL (must type "yes"), 30s timeout ceiling, interactive patch approval, non-TTY fails closed.

### Zeroboot: No Native Support, But Architecture-Compatible

"zeroboot" returns zero matches in the repo. It is our own Phase 2 concept (SOUL.md) that hasn't been materialized.

However, hermes-relay's architecture could serve as the zeroboot transport layer:

1. `desktop_terminal` already runs arbitrary commands on remote devices
2. `desktop_*` tools could be extended with zeroboot-specific handlers (wake-on-LAN, PXE triggers, boot config management)
3. Daemon mode (`hermes-relay daemon`) runs headless, keeping the agent connected to devices permanently
4. The relay's channel multiplexing (chat, terminal, bridge, desktop) over a single WSS connection is the exact pattern zeroboot needs for device orchestration
5. The relay's consent/safety model provides a reasonable security baseline for device control

**Conclusion:** Zeroboot would be a custom extension layer built on top of hermes-relay's `desktop_*` tool framework. The relay becomes the transport; zeroboot becomes the domain logic.

### Key API Reference (from source)

```
Architecture:
  Phone (HTTP/SSE)  -> Hermes API Server (:8642)   [chat -- direct, no relay]
  Phone (WSS)       -> Relay Server (:8767)         [terminal, bridge, media]
  Desktop CLI (WSS) -> Relay Server (:8767)         [tui, terminal, desktop tools]

Relay Server Config:
  RELAY_HOST=0.0.0.0  RELAY_PORT=8767
  RELAY_WEBAPI_URL=http://localhost:8642
  RELAY_HERMES_CONFIG=~/.hermes/config.yaml

Docker:
  docker run -d --name hermes-relay --network host \
    -v ~/.hermes:/home/relay/.hermes:ro \
    ghcr.io/codename-11/hermes-relay:latest

Plugin Install:
  curl -fsSL https://raw.githubusercontent.com/Codename-11/hermes-relay/main/install.sh | bash

Pairing:
  /hermes-relay-pair (from any Hermes chat surface)
  hermes-pair (from shell)
  hermes-relay pair --remote ws://<host>:8767 (from desktop CLI)

Health Check:
  curl http://localhost:8767/health
  -> {"status":"ok","version":"0.4.0","channels":["chat","terminal","bridge"]}

Tailscale Multi-Endpoint:
  hermes-relay-tailscale enable
  hermes-pair --mode auto --prefer tailscale
```
