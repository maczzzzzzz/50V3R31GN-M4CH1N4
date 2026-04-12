# ◈ GHOST BOOT PROTOCOL (v3.0.0)

The **Ghost Boot Protocol** is the automated ignition sequence for the 50V3R31GN-M4CH1N4. It bypasses all manual UI interactions, handling Windows process launching, WSL2 bridging, and Foundry VTT authentication autonomously.

## 🕹️ One-Command Ignition
To start the entire system in headless mode for audits or background operation:
```bash
npm run boot:ghost
```

---

## 🏗️ Technical Architecture

### Layer 1: Windows (Foundry, Obsidian & Proxy)
- **Foundry VTT:** Launched with `--remote-debugging-port=9222`.
- **Obsidian:** Launched via Windows AppID (`md.obsidian`) using `explorer.exe`.
- **Win-Proxy:** Node.js bridge (`win-proxy.cjs`) listening on `0.0.0.0:9223` on Windows, forwarding to `localhost:9222`.

### Layer 2: WSL2 (Orchestrator & Bridge)
Boot sequence is **strictly gated** in `deck-igniter` — each step waits for a confirmed health signal:

1. **Foundry CDP Gate:** Waits for a `"page"` target at `<win-host>:9223/json` before starting WSL processes.
2. **Crush Proxy:** Unix socket bridge connecting to Node A (Kernel).
3. **Director:** Node.js server (Port 3010) that injects the `SOVEREIGN_HIJACK_JS` payload.
4. **Remaining Services:** `dashboard-bridge`, `shadow-dashboard`, and `vault-sync` start in parallel.
5. **Foundry Automation:** `win-test.cjs` (Playwright) handles the Admin login, world launch, and join-as-GM steps.

---

## 🛠️ Troubleshooting

### "ZOMBIE" State
If the audit reports a "ZOMBIE" state (Foundry connection lost):
1. Run **`npm run boot`**.
2. Press **`ctrl+p`** to execute the System-Wide Purge.
3. This clears stale locks and neutralizes orphaned processes.

### Gate Timeouts
If a gate times out, check `deck-igniter/launcher.go` to adjust durations:
- `foundryPort`: default 9222
- `foundryCDPWait`: default 90s

## 🛡️ Security Mandate
**NEVER** push to remote while the Obsidian Vault is unsealed. The Ghost Boot automatically triggers a health audit; if the audit fails, the system will initiate a graceful shutdown to prevent state drift.
