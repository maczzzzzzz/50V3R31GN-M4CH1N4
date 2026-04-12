# High-Signal Logging & Observability Guide (v1.9.0)

This document defines the persistent logging strategy for the **50V3R31GN-M4CH1N4** Split-Node stack. Use these logs to debug the binary bridge, swarm concurrency, and world state mutations.

---

## Node B: Narrative Orchestrator (NixOS/WSL)
Logs are generated via standard output streams.

| Log Path | Subsystem | Description |
| :--- | :--- | :--- |
| `data/logs/orchestrator.log` | Core | Main loop, Foundry events, and AI narrative synthesis errors. |
| `data/logs/bridge.log` | ClawLink | Binary socket handshakes, checksum failures, and transport latency. |
| `data/logs/db.log` | Unified Oracle | SQLite transaction flushes, trigger execution, and RKG query performance. |

---

## Node A: Rules Authority (Nix/Ubuntu)
Logs are generated via the Rust `tracing` crate and native `llama-server` outputs.

| Log Path | Subsystem | Description |
| :--- | :--- | :--- |
| `zeroclaw/zeroclaw.log` | Server | Socket listeners, JSON-RPC parsing, and tokio task spawning. |
| `~/zeroclaw_final.log` | VSB | VSB UDP server logs and high-priority Judge dispatch. |
| `~/llama_server.log` | Inference | Resident model residency and completion generation. |

### Command to Monitor Node A:
```bash
tail -f zeroclaw/zeroclaw.log
```

---

## Swarm Oracle Debugging
When **Task-Isolated Reasoning** is active, Node A dispatches mechanical intents to the **Open-Reasoner-Zero-1.5B** judge. Look for the following trace markers:
- `vsb_udp: ← INTENT`
- `vsb_udp: → RESULT`
- `[Oracle] Math check grounding against RED_RULES.md`

## ⚠️ Log Rotation Invariant
To prevent VRAM/Disk exhaustion, logs are limited to 50MB per file with a 5-file rotation policy enforced by the orchestrator lifecycle.
