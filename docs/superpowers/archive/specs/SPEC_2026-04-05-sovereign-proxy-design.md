# Design: Sovereign Proxy — Phase 26 Task 1 (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)

**Date:** 2026-04-05
**Status:** Approved
**Phase:** 26 — Hybrid V2 Refactor
**Author:** Claude Sonnet + Gemini CLI

## 1. Problem Statement

`ClawLinkClient` is a TypeScript class embedded inside the Director process. It maintains a persistent TCP socket to ZeroClaw on Node A (port 7878), serialising all requests through a single-event-loop promise queue to prevent VRAM bandwidth exhaustion. This design leaks Node.js GC pressure into the hot path and limits concurrency to Node.js's cooperative scheduling model.

Phase 26 replaces this with a persistent Go binary (`crush proxy`) that owns the Node A connection. TypeScript becomes a pure Visual Mesh (Foundry WebSocket only). Go handles all Node A RPC and World State Authority (WSA) gating.

---

## 2. Architecture Overview

### 2.1 Component Map

```
crush/
  main.go          ← extend: add "proxy" and "wsa" dispatch cases
  proxy.go         ← NEW: Unix socket daemon + TCP connection to ZeroClaw
  wsa.go           ← NEW: WSA subcommands (unlock, dim-lights, hack-camera, shut-down)
  registry.go      ← unchanged
  watcher.go       ← unchanged
  auth_pane.go     ← unchanged
```

### 2.2 Runtime Topology

```
TypeScript Director ─── Unix socket ──────────────────────┐
                        /run/crush/clawlink.sock           │
crush wsa <action> ─── Unix socket (short-lived) ──────── Crush Proxy (crush proxy)
                                                           │
                        TCP persistent connection          │
                        Node A :7878 ──────────────────────┘
                                   ZeroClaw (Rust/Tokio)
```

**Invariants:**
- TypeScript owns the Foundry WebSocket bridge exclusively.
- The Go proxy owns the single TCP connection to ZeroClaw exclusively.
- Foundry `runScript` is only executed by TypeScript, never by Go.
- The Go proxy is the sole arbiter of Node A Reasoning Audit verdicts.

---

## 3. crush proxy Daemon (`proxy.go`)

### 3.1 Unix Socket Listener

- Binds to `/run/crush/clawlink.sock` (override via `CLAWLINK_SOCK` env var).
- Each accepted connection spawns a goroutine that reads newline-delimited `ClawLinkPacket` JSON frames and writes responses back on the same connection.
- Multiple concurrent callers (TypeScript Director + `crush wsa` invocations) are fully supported.

### 3.2 TCP Connection to ZeroClaw

- Single `net.Conn` to `NODE_A_HOST:7878`.
- On disconnect: exponential-backoff reconnect loop (500ms → 1s → 2s → cap 30s).
- Requests that arrive during reconnect receive an immediate error response — no indefinite queuing.

### 3.3 Concurrency Model — Pending Map + Goroutines

```
pendingMu  sync.Mutex
pending    map[string]chan clawLinkResponse   // trace_id → response channel

writerCh   chan []byte    // serialised frame bytes for ZeroClaw TCP writes
```

**Writer goroutine:** drains `writerCh`, writes frames sequentially to the ZeroClaw TCP connection. Prevents frame interleaving from concurrent callers.

**Reader goroutine:** reads newline-delimited frames from ZeroClaw, parses `trace_id`, looks up the pending channel, delivers the response. Unknown `trace_id` frames are logged and dropped (stale/duplicate responses).

**Per-request flow:**
1. Parse incoming Unix socket frame for `trace_id`.
2. Register `chan clawLinkResponse` in `pending` map.
3. Send raw frame bytes to `writerCh`.
4. Block on response channel (with `probeTimeout` = 5s deadline).
5. Write response frame back to Unix socket caller.
6. Remove `trace_id` from pending map.

### 3.4 WSA Reasoning Audit Helper

```go
func reasonAudit(action, targetID, context string) (verdict, rationale string, err error)
```

Builds a `reason_audit` `ClawLinkPacket`, sends it through the pending-map path, parses `verdict` (`"GRANTED"` | `"REJECTED"`) and `rationale` string from the result. Used by both `wsa.go` (operator-initiated) and TypeScript-originated audit calls.

---

## 4. WSA Command Set (`wsa.go`)

### 4.1 Commands

```
crush wsa unlock      <door-id>
crush wsa dim-lights  <scene-id>
crush wsa hack-camera <camera-id>
crush wsa shut-down   <device-id>
```

### 4.2 Three-Step Flow

1. **Build audit context** — natural-language string describing the action and target for Open-Reasoner-Zero-1.5B, e.g. `"Unlock door door_001 in current scene. Operator-initiated via crush CLI."`
2. **Call `reasonAudit()`** — connects to proxy Unix socket, sends `reason_audit` RPC, awaits verdict. If proxy is not running: prints `[CRUSH] ERROR: proxy not running — start with 'crush proxy'` and exits 1.
3. **Render verdict** (Black-Ice theme):
   ```
   [WSA] ACCESS GRANTED  — unlock door_001   (<rationale truncated to 80 chars>)
   [WSA] FIREWALL REJECTION — unlock door_001 : <rationale>
   ```

### 4.3 Exit Codes

| Code | Meaning |
|------|---------|
| 0    | GRANTED — TypeScript Director proceeds with Foundry `runScript` |
| 1    | Proxy error / network failure |
| 2    | REJECTED — TypeScript Director does NOT call `runScript` |

### 4.4 main.go Dispatch

```go
case "proxy":
    runProxy()         // blocks until SIGINT/SIGTERM
case "wsa":
    runWSA(os.Args[2:])
```

No changes to the existing `belt` dispatch path.

---

## 5. TypeScript Integration

### 5.1 ClawLinkClient Change (one line)

```typescript
// Before: direct TCP to Node A
const socket = net.connect(this.config.port, this.config.host);

// After: Unix socket to crush proxy
const socket = net.connect(this.config.socketPath);
```

### 5.2 Schema Change

```typescript
// clawlink.schema.ts
export const ClawLinkConfigSchema = z.object({
  socketPath: z.string().min(1).default('/run/crush/clawlink.sock'),
  timeoutMs: z.number().int().min(1).optional(),
});
// host and port removed — now live in crush env config (NODE_A_HOST, CLAWLINK_PORT)
```

### 5.3 New IClawLinkClient Method

```typescript
wsaAudit(
  action: string,
  targetId: string,
  context: string,
): Promise<{ verdict: 'GRANTED' | 'REJECTED'; rationale: string }>
```

Routes through the `reason_audit` RPC for AI-initiated WSA actions without shelling out to `crush wsa`. The TypeScript Director calls this before any `runScript` world-state mutation.

### 5.4 What Does Not Change

- `ClawLinkPacket` framing (newline-delimited JSON, `trace_id` correlation)
- Zod Zero-Trust validation on all responses
- Request queue (protects against TypeScript-side call storms)
- Timeout handling
- All call sites: `hybridSearch`, `resolveAttack`, `resolveDamage`, `st3ggEncode/Decode`, `executeRpc`

---

## 6. Wire Protocol (Unchanged)

All frames on the Unix socket use the identical `ClawLinkPacket` schema already in production:

```typescript
interface ClawLinkPacket {
  trace_id: string;   // UUID v4
  payload:  string;   // JSON-stringified RpcRequest or RpcResponse
  checksum: number;   // uint32 sum of payload char codes
}
```

The `reason_audit` RPC uses `executeRpc` with:
```json
{
  "method": "reason_audit",
  "params": {
    "action":    "unlock",
    "target_id": "door_001",
    "context":   "Unlock door door_001 in current scene. Operator-initiated via crush CLI."
  }
}
```

Response shape:
```json
{
  "verdict":   "GRANTED",
  "rationale": "Action within allowed parameters for current encounter phase."
}
```

---

## 7. Configuration

All crush proxy config is sourced from environment variables (consistent with deck-igniter's `config.go` pattern):

| Variable        | Default                      | Purpose                        |
|-----------------|------------------------------|--------------------------------|
| `NODE_A_HOST`   | `192.168.0.50`               | ZeroClaw TCP address           |
| `CLAWLINK_PORT` | `7878`                       | ZeroClaw TCP port              |
| `CLAWLINK_SOCK` | `/run/crush/clawlink.sock`   | Unix socket path               |
| `CLAWLINK_TIMEOUT` | `5000` (ms)               | Per-request deadline           |

---

## 8. Testing

- **`proxy_test.go`:** Spin up an in-process ZeroClaw mock (net.Listener on a random port), connect proxy, verify concurrent in-flight requests resolve to correct callers via trace_id.
- **`wsa_test.go`:** Mock proxy Unix socket, verify GRANTED exits 0, REJECTED exits 2, proxy-down exits 1. Verify audit context strings for each action type.
- **`clawlink-client.test.ts`:** Update config fixture to use `socketPath`, verify socket path is passed to `net.connect`. Existing RPC method tests unchanged.

---

## 9. Refactor Sequence

Per `docs/superpowers/specs/2026-04-05-unified-cyberdeck-design.md` Phase 2 alignment:

1. **Go (this spec):** Implement `crush proxy` + `crush wsa` + `reasonAudit()`.
2. **TypeScript:** Swap `ClawLinkClient` connection target, add `wsaAudit()` method, remove `host`/`port` from schema.
3. **ZeroClaw (Rust/Node A — Gemini domain):** Add `reason_audit` RPC handler routing to Open-Reasoner-Zero-1.5B.

---

*Verified by Gemini CLI v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS Orchestrator.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
