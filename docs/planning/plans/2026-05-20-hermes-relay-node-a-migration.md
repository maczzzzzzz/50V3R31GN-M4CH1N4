# Hermes-Relay Migration: Node B Docker Desktop → Node A

**Status:** INITIATED  
**Date:** 2026-05-20  
**Target Host:** Node A (Synapse) – 100.96.253.114  
**Rationale:** Node A is the designated state/persistence node. Low inference load makes it the cleanest host for the relay service.

## Current State

- **Current Host:** Node B (Docker Desktop)
- **Container:** `hermes-relay:latest`
- **Port:** 8767 (exposed)
- **Version:** v0.6.1
- **Dependencies:** Android pairing, screenshot storage, Tailscale reachability

## Migration Plan

### Phase 1: Preparation (Node A)
1. Ensure Node A has Docker or native Python environment ready.
2. Create persistent volume for relay state (`~/.hermes/relay/`).
3. Add systemd unit (preferred) or Docker Compose.

### Phase 2: Data & Config Migration
- Copy pairing tokens and config from current relay.
- Update `~/.hermes/config.yaml` references if any.
- Update AGENTS.md and sidecar documentation.

### Phase 3: Cutover
1. Stop container on Node B.
2. Start service on Node A.
3. Update any port mappings or socat bridges on Node B.
4. Verify Android pairing and screenshot flow.

### Phase 4: Verification
- `hermes relay status`
- Test QR pairing from Android device
- Confirm screenshots land in expected location on Node A

## Deployment Method (Recommended)

Use a lightweight systemd service on Node A (NixOS) for maximum sovereignty.

```ini
# /etc/systemd/system/hermes-relay.service
[Unit]
Description=Hermes Relay - Android Device Bridge
After=network.target tailscaled.service

[Service]
Type=simple
User=maczz
WorkingDirectory=/home/maczz/.hermes/relay
ExecStart=/usr/bin/python3 -m relay_server --config /home/maczz/.hermes/relay/config.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Post-Migration Network

- Relay listens on Node A Tailscale IP: `100.96.253.114:8767`
- Node B TUI/dashboard continues to reach it via Tailscale (no localhost requirement after move).

## Rollback

If issues arise, restart the Docker container on Node B and revert the symlink/config changes.

## Next Actions

- Create systemd unit on Node A
- Stop Docker Desktop container on Node B
- Update AGENTS.md and KANBAN status
