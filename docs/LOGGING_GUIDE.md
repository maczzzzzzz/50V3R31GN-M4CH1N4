# High-Signal Logging & Observability Guide (v1.0.0)

This document defines the persistent logging strategy for the **ASP.GM-Agent** Split-Node stack. Use these logs to debug the binary bridge, swarm concurrency, and world state mutations.

---

## 🏗️ Node B: Narrative Orchestrator (Windows)
Logs are generated via `console.error` and standard output streams.

| Log Path | Subsystem | Description |
| :--- | :--- | :--- |
| `data/logs/orchestrator.log` | Core | Main loop, Foundry events, and AI narrative synthesis errors. |
| `data/logs/bridge.log` | ClawLink | Binary socket handshakes, checksum failures, and transport latency. |
| `data/logs/db.log` | Unified Oracle | SQLite transaction flushes, trigger execution, and RKG query performance. |

### Command to Monitor Node B:
```powershell
Get-Content -Path "data/logs/orchestrator.log" -Wait -Tail 20
```

---

## 🦀 Node A: Rules Authority (Ubuntu)
Logs are generated via the Rust `tracing` crate and captured in the ZeroClaw process.

| Log Path | Subsystem | Description |
| :--- | :--- | :--- |
| `zeroclaw/zeroclaw.log` | Server | Socket listeners, JSON-RPC parsing, and tokio task spawning. |
| `zeroclaw/cv.log` | Vision | Canny edge detection thresholds and Hough line transform output. |

### Command to Monitor Node A:
```bash
tail -f zeroclaw/zeroclaw.log
```

---

## 🦾 Swarm Oracle Debugging
When **Task-Isolated Reasoning** is active, Node A spawns ephemeral threads. Look for the following trace markers:
- `[Swarm] Spawning task for trace_id: <uuid>`
- `[Oracle] Math check grounding against RED_RULES.md`
- `[Bridge] Checksum verified: <hex>`

## ⚠️ Log Rotation Invariant
To prevent VRAM/Disk exhaustion, logs are limited to 50MB per file with a 5-file rotation policy enforced by the orchestrator lifecycle.
