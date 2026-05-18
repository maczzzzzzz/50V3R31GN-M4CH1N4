# Hermes Relay — Native Deployment & Multi-Device Guide

**Repository:** https://github.com/Codename-11/hermes-relay

## Current Status (May 2026)

- **Node A**: Native systemd user service (recommended)
- **Windows**: NSSM service available
- **Android**: Companion app in `app/` directory

## Quick Links

- [Windows NSSM Setup](windows-nssm-setup.ps1)
- [Android + Windows Guide](ANDROID-AND-WINDOWS.md)
- [Architecture Document](../docs/architecture/hermes-relay.html)

## Installation on New Devices

See `ANDROID-AND-WINDOWS.md` for complete instructions on Windows laptops and Android phones/tablets.

## Related Services on Node A

- `hermes-relay` — Native (this service)
- `cloak-cdp` — Docker (browser automation)