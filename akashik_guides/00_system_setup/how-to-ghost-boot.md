# ◈ GHOST BOOT PROTOCOL (v3.4.1)

The **Ghost Boot Protocol** is the automated ignition sequence for the 50V3R31GN-M4CH1N4. It bypasses all manual UI interactions, handling Windows process launching, WSL2 bridging, and Foundry VTT authentication autonomously.

## 🕹️ Nucleus-Driven Ignition
To start the system in headless mode for audits or background operation:

1.  **Launch Nucleus:** `npm run crush nucleus`
2.  **Select Mode:** From the **◈ NUCLEUS** dropdown, select **[GHOST_BOOT]**.

The Machina will now execute the background ignition sequence and run automated login and audit scripts.

---

## 🏗️ Technical Architecture

### Layer 1: Windows (Foundry, Obsidian & Proxy)
- **Foundry VTT:** Launched with `--remote-debugging-port=9222`.
- **Obsidian:** Launched via Windows AppID (`md.obsidian`) using `explorer.exe`.
- **Win-Proxy:** Node.js bridge (`scripts/win-proxy.cjs`) listening on `0.0.0.0:9223` on Windows, forwarding to `localhost:9222`.

### Layer 2: WSL2 (Orchestrator & Mesh)
Boot sequence is managed headlessly by `crush start --headless` — each step waits for a confirmed health signal:

1. **Foundry CDP Gate:** Waits for a `"page"` target at `<win-host>:9223/json` before starting WSL processes.
2. **Crush Proxy:** Unix socket bridge connecting to Node A (Kernel).
3. **Director:** Node.js server (Port 3010) that injects the `SOVEREIGN_HIJACK_JS` payload from `src/core/sovereign-theme.ts`.
4. **Remaining Services:** `dashboard-bridge` and `mcp-daemon` start in parallel.
5. **Foundry Automation:** `scripts/win-test.cjs` (Playwright) handles the Admin login, world launch, and join-as-GM steps.

---

## 🛠️ Troubleshooting

### "ZOMBIE" State
If the audit reports a "ZOMBIE" state (Foundry connection lost):
1. Use the **PURGE** function (if implemented in UI) or run `crush shut-down` from terminal.
2. Restart the Nucleus Artery and attempt a fresh **[GHOST_BOOT]**.

### Gate Timeouts
If a gate times out, check `deck-igniter/launcher.go` to adjust durations:
- `foundryPort`: default 9222
- `foundryCDPWait`: default 90s

## 🛡️ Security Mandate
**NEVER** push to remote while the Obsidian Vault is unsealed. The Ghost Boot automatically triggers a health audit; if the audit fails, the system will initiate a graceful shutdown to prevent state drift.
