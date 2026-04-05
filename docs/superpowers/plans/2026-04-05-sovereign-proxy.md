# Sovereign Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the TypeScript `ClawLinkClient`'s direct TCP socket to ZeroClaw with a persistent Go proxy daemon (`crush proxy`) that owns the Node A connection, adds WSA command gating via Node A Reasoning Audit, and exposes a Unix socket to TypeScript using the same newline-delimited `ClawLinkPacket` JSON protocol.

**Architecture:** A new `crush proxy` subcommand starts a daemon that listens on a Unix socket (`/run/crush/clawlink.sock`) and maintains one persistent TCP connection to ZeroClaw (port 7878 on Node A). Concurrent in-flight requests are correlated via a pending map keyed on `trace_id`. TypeScript swaps `net.connect(host, port)` for `net.connect(socketPath)` — all other TypeScript code is unchanged. Four new `crush wsa <action> <id>` subcommands gate world-state mutations through a `reason_audit` ZeroClaw RPC.

**Tech Stack:** Go 1.24 (`bufio`, `net`, `sync`, `context`, `crypto/rand`), existing `github.com/charmbracelet/lipgloss` for WSA output, Vitest for TypeScript tests, Go `testing` package.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `crush/config.go` | **Create** | Env-var config for proxy (NODE_A_HOST, CLAWLINK_PORT, CLAWLINK_SOCK, CLAWLINK_TIMEOUT) |
| `crush/proxy.go` | **Create** | Proxy daemon: types, pending map, writer/reader goroutines, Unix socket, `runProxy()` |
| `crush/wsa.go` | **Create** | WSA subcommands: `runWSA()`, `buildAuditContext()`, `reasonAudit()` |
| `crush/main.go` | **Modify** | Add `"proxy"` and `"wsa"` dispatch cases |
| `crush/proxy_test.go` | **Create** | Tests: pending map, writer goroutine, concurrent in-flight integration |
| `crush/wsa_test.go` | **Create** | Tests: audit context strings, argument validation, exit codes |
| `src/shared/schemas/clawlink.schema.ts` | **Modify** | Replace `host`/`port` with `socketPath` |
| `src/api/clawlink-client.ts` | **Modify** | Swap `net.connect()` target, add `wsaAudit()` method |
| `tests/api/clawlink-client.test.ts` | **Create** | Tests: socket path config, `wsaAudit()` method |

---

## Setup: Create Feature Worktree

- [ ] **Create the worktree**

```bash
git worktree add .worktrees/feature/phase-26-sovereign-proxy -b feature/phase-26-sovereign-proxy
cd .worktrees/feature/phase-26-sovereign-proxy
```

---

## Task 1: crush Config

**Files:**
- Create: `crush/config.go`
- Create: `crush/config_test.go`

- [ ] **Step 1: Write the failing test**

Create `crush/config_test.go`:

```go
package main

import (
	"os"
	"testing"
)

func TestConfig_DefaultValues(t *testing.T) {
	os.Unsetenv("NODE_A_HOST")
	os.Unsetenv("CLAWLINK_PORT")
	os.Unsetenv("CLAWLINK_SOCK")
	os.Unsetenv("CLAWLINK_TIMEOUT")

	cfg := loadConfig()

	if cfg.NodeAHost != "192.168.0.50" {
		t.Errorf("NodeAHost = %q, want 192.168.0.50", cfg.NodeAHost)
	}
	if cfg.ClawlinkPort != "7878" {
		t.Errorf("ClawlinkPort = %q, want 7878", cfg.ClawlinkPort)
	}
	if cfg.ClawlinkSock != "/run/crush/clawlink.sock" {
		t.Errorf("ClawlinkSock = %q, want /run/crush/clawlink.sock", cfg.ClawlinkSock)
	}
	if cfg.ClawlinkTimeout != 5000 {
		t.Errorf("ClawlinkTimeout = %d, want 5000", cfg.ClawlinkTimeout)
	}
}

func TestConfig_EnvOverrides(t *testing.T) {
	os.Setenv("NODE_A_HOST", "10.0.0.1")
	os.Setenv("CLAWLINK_PORT", "9999")
	os.Setenv("CLAWLINK_SOCK", "/tmp/test.sock")
	os.Setenv("CLAWLINK_TIMEOUT", "3000")
	defer func() {
		os.Unsetenv("NODE_A_HOST")
		os.Unsetenv("CLAWLINK_PORT")
		os.Unsetenv("CLAWLINK_SOCK")
		os.Unsetenv("CLAWLINK_TIMEOUT")
	}()

	cfg := loadConfig()

	if cfg.NodeAHost != "10.0.0.1" {
		t.Errorf("NodeAHost = %q, want 10.0.0.1", cfg.NodeAHost)
	}
	if cfg.ClawlinkPort != "9999" {
		t.Errorf("ClawlinkPort = %q, want 9999", cfg.ClawlinkPort)
	}
	if cfg.ClawlinkSock != "/tmp/test.sock" {
		t.Errorf("ClawlinkSock = %q, want /tmp/test.sock", cfg.ClawlinkSock)
	}
	if cfg.ClawlinkTimeout != 3000 {
		t.Errorf("ClawlinkTimeout = %d, want 3000", cfg.ClawlinkTimeout)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd .worktrees/feature/phase-26-sovereign-proxy/crush
go test ./... -run TestConfig -v
```

Expected: `FAIL — loadConfig undefined`

- [ ] **Step 3: Write the implementation**

Create `crush/config.go`:

```go
package main

import (
	"os"
	"strconv"
)

// Config holds all runtime configuration for crush, sourced from env vars.
type Config struct {
	NodeAHost       string // NODE_A_HOST — IP of Node A (ZeroClaw)
	ClawlinkPort    string // CLAWLINK_PORT — ZeroClaw TCP port
	ClawlinkSock    string // CLAWLINK_SOCK — Unix socket path for proxy
	ClawlinkTimeout int    // CLAWLINK_TIMEOUT — per-request timeout in ms
}

// Cfg is the package-level config loaded at startup.
var Cfg = loadConfig()

func loadConfig() Config {
	return Config{
		NodeAHost:       getEnv("NODE_A_HOST", "192.168.0.50"),
		ClawlinkPort:    getEnv("CLAWLINK_PORT", "7878"),
		ClawlinkSock:    getEnv("CLAWLINK_SOCK", "/run/crush/clawlink.sock"),
		ClawlinkTimeout: getEnvInt("CLAWLINK_TIMEOUT", 5000),
	}
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultVal
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
go test ./... -run TestConfig -v
```

Expected:
```
--- PASS: TestConfig_DefaultValues (0.00s)
--- PASS: TestConfig_EnvOverrides (0.00s)
PASS
```

- [ ] **Step 5: Commit**

```bash
git add crush/config.go crush/config_test.go
git commit -m "feat(crush): add env-based config for sovereign proxy

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 2: Proxy Types and Pending Map

**Files:**
- Create: `crush/proxy.go` (types, helpers, pending map)
- Create: `crush/proxy_test.go` (pending map tests)

- [ ] **Step 1: Write the failing tests**

Create `crush/proxy_test.go`:

```go
package main

import (
	"testing"
	"time"
)

func TestProxy_RegisterAndDeliver(t *testing.T) {
	p := &proxy{
		pending:  make(map[string]chan clawLinkPacket),
		writerCh: make(chan []byte, 1),
		timeout:  200 * time.Millisecond,
	}

	ch := p.register("trace-abc")

	go func() {
		time.Sleep(10 * time.Millisecond)
		p.deliver(clawLinkPacket{
			TraceID: "trace-abc",
			Payload: `{"id":"trace-abc","result":{"pong":true},"error":null}`,
		})
	}()

	select {
	case pkt := <-ch:
		if pkt.TraceID != "trace-abc" {
			t.Errorf("got trace_id %q, want trace-abc", pkt.TraceID)
		}
	case <-time.After(300 * time.Millisecond):
		t.Fatal("timeout: deliver never fired")
	}
}

func TestProxy_DeliverUnknownTraceIDDropped(t *testing.T) {
	p := &proxy{
		pending: make(map[string]chan clawLinkPacket),
	}
	// Must not panic or block
	p.deliver(clawLinkPacket{TraceID: "ghost-id"})
}

func TestProxy_CancelAllRejectsAllPending(t *testing.T) {
	p := &proxy{
		pending:  make(map[string]chan clawLinkPacket),
		writerCh: make(chan []byte, 1),
		timeout:  200 * time.Millisecond,
	}

	ch1 := p.register("t1")
	ch2 := p.register("t2")

	p.cancelAll()

	for i, ch := range []chan clawLinkPacket{ch1, ch2} {
		select {
		case pkt := <-ch:
			if pkt.TraceID == "" {
				t.Errorf("chan %d: cancelAll sent packet with empty trace_id", i)
			}
		case <-time.After(100 * time.Millisecond):
			t.Errorf("chan %d: cancelAll did not unblock pending", i)
		}
	}
}

func TestNewTraceID_IsUnique(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		id := newTraceID()
		if seen[id] {
			t.Errorf("duplicate trace_id: %s", id)
		}
		seen[id] = true
		if len(id) < 30 {
			t.Errorf("trace_id too short: %q", id)
		}
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
go test ./... -run "TestProxy_|TestNewTraceID" -v
```

Expected: `FAIL — proxy undefined`

- [ ] **Step 3: Write the implementation**

Create `crush/proxy.go`:

```go
package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// ── Wire types ────────────────────────────────────────────────────────────────

// clawLinkPacket is the newline-delimited JSON frame used on both the Unix
// socket (TS ↔ proxy) and the TCP connection (proxy ↔ ZeroClaw).
// It mirrors the TypeScript ClawLinkPacket interface exactly.
type clawLinkPacket struct {
	TraceID  string `json:"trace_id"`
	Payload  string `json:"payload"`
	Checksum uint32 `json:"checksum"`
}

// payloadChecksum computes the uint32 sum of payload byte values,
// matching the TypeScript ClawLinkClient checksum algorithm.
func payloadChecksum(payload string) uint32 {
	var cs uint32
	for _, b := range []byte(payload) {
		cs += uint32(b)
	}
	return cs
}

// newTraceID generates a UUID v4-style trace identifier using crypto/rand.
func newTraceID() string {
	var b [16]byte
	rand.Read(b[:])
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

// ── Proxy ─────────────────────────────────────────────────────────────────────

// proxy holds the shared state for the crush proxy daemon.
type proxy struct {
	nodeAAddr  string        // "host:port" for ZeroClaw TCP
	socketPath string        // Unix socket path for TS clients
	timeout    time.Duration // per-request deadline

	// writerCh serialises frame writes to the ZeroClaw TCP connection.
	writerCh chan []byte

	// pending maps trace_id → response channel for in-flight requests.
	pendingMu sync.Mutex
	pending   map[string]chan clawLinkPacket
}

func newProxy() *proxy {
	return &proxy{
		nodeAAddr:  fmt.Sprintf("%s:%s", Cfg.NodeAHost, Cfg.ClawlinkPort),
		socketPath: Cfg.ClawlinkSock,
		timeout:    time.Duration(Cfg.ClawlinkTimeout) * time.Millisecond,
		writerCh:   make(chan []byte, 64),
		pending:    make(map[string]chan clawLinkPacket),
	}
}

// register allocates a response channel for the given trace_id.
func (p *proxy) register(traceID string) chan clawLinkPacket {
	ch := make(chan clawLinkPacket, 1)
	p.pendingMu.Lock()
	p.pending[traceID] = ch
	p.pendingMu.Unlock()
	return ch
}

// deliver routes an incoming ZeroClaw response to the correct waiting caller.
// Frames with unknown trace_ids are silently dropped (stale/duplicate).
func (p *proxy) deliver(pkt clawLinkPacket) {
	p.pendingMu.Lock()
	ch, ok := p.pending[pkt.TraceID]
	if ok {
		delete(p.pending, pkt.TraceID)
	}
	p.pendingMu.Unlock()
	if ok {
		ch <- pkt
	}
}

// cancelAll unblocks all pending callers with an error packet.
// Called when the ZeroClaw TCP connection is lost.
func (p *proxy) cancelAll() {
	p.pendingMu.Lock()
	defer p.pendingMu.Unlock()
	for id, ch := range p.pending {
		errPkt := clawLinkPacket{
			TraceID: id,
			Payload: fmt.Sprintf(`{"id":%q,"result":null,"error":"Node A connection lost"}`, id),
		}
		ch <- errPkt
		delete(p.pending, id)
	}
}

// errorPacketJSON builds a minimal error-response ClawLinkPacket payload.
func errorPacketJSON(id, msg string) []byte {
	pkt := clawLinkPacket{
		TraceID: id,
		Payload: fmt.Sprintf(`{"id":%q,"result":null,"error":%q}`, id, msg),
	}
	b, _ := json.Marshal(pkt)
	return append(b, '\n')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
go test ./... -run "TestProxy_|TestNewTraceID" -v
```

Expected:
```
--- PASS: TestProxy_RegisterAndDeliver (0.01s)
--- PASS: TestProxy_DeliverUnknownTraceIDDropped (0.00s)
--- PASS: TestProxy_CancelAllRejectsAllPending (0.00s)
--- PASS: TestNewTraceID_IsUnique (0.00s)
PASS
```

- [ ] **Step 5: Commit**

```bash
git add crush/proxy.go crush/proxy_test.go
git commit -m "feat(crush/proxy): add types, pending map, and helpers

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 3: Writer Goroutine and TCP Connection Manager

**Files:**
- Modify: `crush/proxy.go` (add `runWriter`, `connectNodeA`)
- Modify: `crush/proxy_test.go` (add writer test)

- [ ] **Step 1: Write the failing test**

Append to `crush/proxy_test.go`:

```go
import (
	"bufio"
	"context"
	"net"
	"testing"
	"time"
)

func TestProxy_WriterSendsFrames(t *testing.T) {
	// net.Pipe gives a synchronous in-memory connection — no real TCP needed.
	client, server := net.Pipe()
	defer client.Close()
	defer server.Close()

	p := &proxy{
		writerCh: make(chan []byte, 4),
		pending:  make(map[string]chan clawLinkPacket),
		timeout:  500 * time.Millisecond,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	go p.runWriter(ctx, client)

	// Send two frames
	p.writerCh <- []byte(`{"trace_id":"t1","payload":"a","checksum":0}` + "\n")
	p.writerCh <- []byte(`{"trace_id":"t2","payload":"b","checksum":0}` + "\n")

	scanner := bufio.NewScanner(server)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
		if len(lines) == 2 {
			break
		}
	}

	if len(lines) != 2 {
		t.Fatalf("got %d frames, want 2", len(lines))
	}
	if lines[0] != `{"trace_id":"t1","payload":"a","checksum":0}` {
		t.Errorf("frame 0 = %q", lines[0])
	}
	if lines[1] != `{"trace_id":"t2","payload":"b","checksum":0}` {
		t.Errorf("frame 1 = %q", lines[1])
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
go test ./... -run TestProxy_WriterSendsFrames -v
```

Expected: `FAIL — p.runWriter undefined`

- [ ] **Step 3: Write the implementation**

**Replace the import block** at the top of `crush/proxy.go` (currently only has `crypto/rand`, `encoding/json`, `fmt`, `sync`, `time`) with the full set needed by Tasks 2–4:

```go
import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"sync"
	"time"
)
```

Then add these functions to proxy.go:

```go
// runWriter drains writerCh and writes frames to the ZeroClaw TCP connection.
// It serialises all writes so frames from concurrent callers never interleave.
// Returns when ctx is cancelled or conn is closed.
func (p *proxy) runWriter(ctx context.Context, conn net.Conn) {
	for {
		select {
		case <-ctx.Done():
			return
		case frame, ok := <-p.writerCh:
			if !ok {
				return
			}
			if _, err := conn.Write(frame); err != nil {
				return
			}
		}
	}
}

// connectNodeA establishes and maintains the persistent TCP connection to ZeroClaw.
// On disconnect it cancels connCtx (unblocking runReader), calls cancelAll(),
// then retries with exponential backoff (500ms → 30s cap).
// Runs until ctx is cancelled.
func (p *proxy) connectNodeA(ctx context.Context) {
	const maxBackoff = 30 * time.Second
	backoff := 500 * time.Millisecond

	for {
		if ctx.Err() != nil {
			return
		}

		conn, err := net.DialTimeout("tcp", p.nodeAAddr, 5*time.Second)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[CRUSH] proxy: Node A unreachable (%v), retry in %v\n", err, backoff)
			select {
			case <-ctx.Done():
				return
			case <-time.After(backoff):
			}
			if backoff < maxBackoff {
				backoff *= 2
			}
			continue
		}

		backoff = 500 * time.Millisecond
		fmt.Fprintf(os.Stderr, "[CRUSH] proxy: connected to Node A at %s\n", p.nodeAAddr)

		connCtx, connCancel := context.WithCancel(ctx)

		go p.runWriter(connCtx, conn)
		go func() {
			p.runReader(connCtx, conn)
			connCancel()
			conn.Close()
			p.cancelAll()
		}()

		// Block until this connection dies or the parent context is cancelled.
		<-connCtx.Done()
		connCancel()
		conn.Close()

		if ctx.Err() != nil {
			return
		}
		fmt.Fprintf(os.Stderr, "[CRUSH] proxy: Node A connection lost, reconnecting…\n")
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
go test ./... -run "TestProxy_WriterSendsFrames|TestProxy_Register|TestProxy_Deliver|TestProxy_CancelAll|TestNewTraceID" -v
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add crush/proxy.go crush/proxy_test.go
git commit -m "feat(crush/proxy): add writer goroutine and TCP reconnect manager

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 4: Reader Goroutine, Unix Socket, and runProxy

**Files:**
- Modify: `crush/proxy.go` (add `runReader`, `send`, `handleUnixConn`, `runProxy`)
- Modify: `crush/proxy_test.go` (add integration test)

- [ ] **Step 1: Write the failing integration test**

Append to `crush/proxy_test.go`:

```go
func TestProxy_ConcurrentInFlightRequests(t *testing.T) {
	// Start a mock ZeroClaw TCP server that echoes frames back verbatim
	// (same trace_id, pong result).
	mockLn, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("mock listen: %v", err)
	}
	defer mockLn.Close()

	go func() {
		for {
			conn, err := mockLn.Accept()
			if err != nil {
				return
			}
			go func(c net.Conn) {
				defer c.Close()
				sc := bufio.NewScanner(c)
				for sc.Scan() {
					var pkt clawLinkPacket
					if err := json.Unmarshal(sc.Bytes(), &pkt); err != nil {
						continue
					}
					// Echo a response with the same trace_id
					resp := clawLinkPacket{
						TraceID: pkt.TraceID,
						Payload: fmt.Sprintf(`{"id":%q,"result":{"echo":true},"error":null}`, pkt.TraceID),
					}
					b, _ := json.Marshal(resp)
					c.Write(append(b, '\n'))
				}
			}(conn)
		}
	}()

	// Build proxy pointing at mock server
	mockHost, mockPort, _ := net.SplitHostPort(mockLn.Addr().String())
	sockPath := filepath.Join(t.TempDir(), "proxy_test.sock")

	orig := Cfg
	Cfg.NodeAHost = mockHost
	Cfg.ClawlinkPort = mockPort
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Start proxy
	errCh := make(chan error, 1)
	go func() { errCh <- runProxy(ctx) }()

	// Wait for socket to appear
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if _, err := os.Stat(sockPath); err == nil {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}

	// Connect two concurrent clients and send one request each
	type result struct {
		traceID string
		resp    string
	}
	results := make(chan result, 2)

	for i := 0; i < 2; i++ {
		go func() {
			c, err := net.DialTimeout("unix", sockPath, time.Second)
			if err != nil {
				t.Errorf("unix dial: %v", err)
				results <- result{}
				return
			}
			defer c.Close()

			traceID := newTraceID()
			rpcPayload := fmt.Sprintf(`{"id":%q,"method":"ping","params":{}}`, traceID)
			pkt := clawLinkPacket{
				TraceID:  traceID,
				Payload:  rpcPayload,
				Checksum: payloadChecksum(rpcPayload),
			}
			b, _ := json.Marshal(pkt)
			c.Write(append(b, '\n'))

			sc := bufio.NewScanner(c)
			if sc.Scan() {
				results <- result{traceID: traceID, resp: sc.Text()}
			} else {
				results <- result{traceID: traceID}
			}
		}()
	}

	for i := 0; i < 2; i++ {
		r := <-results
		if r.resp == "" {
			t.Errorf("client %d got no response", i)
			continue
		}
		var respPkt clawLinkPacket
		if err := json.Unmarshal([]byte(r.resp), &respPkt); err != nil {
			t.Errorf("client %d response parse error: %v", i, err)
			continue
		}
		if respPkt.TraceID != r.traceID {
			t.Errorf("client %d: got trace_id %q, want %q", i, respPkt.TraceID, r.traceID)
		}
	}

	cancel()
	<-errCh
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
go test ./... -run TestProxy_ConcurrentInFlightRequests -v
```

Expected: `FAIL — runProxy undefined`

- [ ] **Step 3: Write the implementation**

Append to `crush/proxy.go`:

```go
// runReader reads newline-delimited ClawLinkPacket frames from the ZeroClaw
// TCP connection and routes each response to the correct pending caller.
// Exits when conn is closed or ctx is cancelled.
// Buffer is set to 4MB to accommodate large ST3GG base64 payloads.
func (p *proxy) runReader(ctx context.Context, conn net.Conn) {
	sc := bufio.NewScanner(conn)
	sc.Buffer(make([]byte, 4*1024*1024), 4*1024*1024)
	for sc.Scan() {
		var pkt clawLinkPacket
		if err := json.Unmarshal(sc.Bytes(), &pkt); err != nil {
			continue // malformed frame — skip
		}
		p.deliver(pkt)
	}
}

// send enqueues a frame for writing to ZeroClaw and blocks until the matching
// response arrives or the per-request timeout expires.
func (p *proxy) send(frame []byte, traceID string) (clawLinkPacket, error) {
	ch := p.register(traceID)

	// Ensure frame is newline-terminated.
	if !bytes.HasSuffix(frame, []byte("\n")) {
		frame = append(frame, '\n')
	}

	select {
	case p.writerCh <- frame:
	case <-time.After(p.timeout):
		p.pendingMu.Lock()
		delete(p.pending, traceID)
		p.pendingMu.Unlock()
		return clawLinkPacket{}, fmt.Errorf("timeout enqueuing frame for trace_id=%s", traceID)
	}

	select {
	case resp := <-ch:
		return resp, nil
	case <-time.After(p.timeout):
		p.pendingMu.Lock()
		delete(p.pending, traceID)
		p.pendingMu.Unlock()
		return clawLinkPacket{}, fmt.Errorf("timeout awaiting response for trace_id=%s", traceID)
	}
}

// handleUnixConn serves one Unix socket client connection.
// Reads frames sequentially (TypeScript serialises requests anyway),
// forwards each to ZeroClaw, and writes the response back.
func (p *proxy) handleUnixConn(conn net.Conn) {
	defer conn.Close()
	sc := bufio.NewScanner(conn)
	sc.Buffer(make([]byte, 4*1024*1024), 4*1024*1024)
	for sc.Scan() {
		raw := sc.Bytes()
		var pkt clawLinkPacket
		if err := json.Unmarshal(raw, &pkt); err != nil {
			continue
		}

		resp, err := p.send(append(raw[:len(raw):len(raw)], '\n'), pkt.TraceID)
		if err != nil {
			conn.Write(errorPacketJSON(pkt.TraceID, err.Error()))
			continue
		}
		b, _ := json.Marshal(resp)
		conn.Write(append(b, '\n'))
	}
}

// runProxy starts the Unix socket listener and Node A TCP manager.
// Blocks until ctx is cancelled.
func runProxy(ctx context.Context) error {
	p := newProxy()

	if err := os.MkdirAll(filepath.Dir(p.socketPath), 0755); err != nil {
		return fmt.Errorf("mkdir %s: %w", filepath.Dir(p.socketPath), err)
	}
	os.Remove(p.socketPath) // remove stale socket

	ln, err := net.Listen("unix", p.socketPath)
	if err != nil {
		return fmt.Errorf("listen unix %s: %w", p.socketPath, err)
	}
	defer func() {
		ln.Close()
		os.Remove(p.socketPath)
	}()

	fmt.Printf("[CRUSH] proxy: listening on %s\n", p.socketPath)
	fmt.Printf("[CRUSH] proxy: routing to Node A at %s\n", p.nodeAAddr)

	go p.connectNodeA(ctx)

	// Close listener when context is cancelled to unblock Accept.
	go func() {
		<-ctx.Done()
		ln.Close()
	}()

	for {
		conn, err := ln.Accept()
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			continue
		}
		go p.handleUnixConn(conn)
	}
}
```

- [ ] **Step 4: Run all proxy tests to verify they pass**

```bash
go test ./... -run "TestProxy_" -v -timeout 15s
```

Expected:
```
--- PASS: TestProxy_RegisterAndDeliver (0.01s)
--- PASS: TestProxy_DeliverUnknownTraceIDDropped (0.00s)
--- PASS: TestProxy_CancelAllRejectsAllPending (0.00s)
--- PASS: TestProxy_WriterSendsFrames (0.00s)
--- PASS: TestProxy_ConcurrentInFlightRequests (0.10s)
PASS
```

- [ ] **Step 5: Commit**

```bash
git add crush/proxy.go crush/proxy_test.go
git commit -m "feat(crush/proxy): add reader goroutine, Unix socket listener, runProxy

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 5: reasonAudit Helper

**Files:**
- Create: `crush/wsa.go` (just `reasonAudit` + `newTraceID` usage — full WSA in Task 6)
- Modify: `crush/wsa_test.go` (reasonAudit parsing tests)

- [ ] **Step 1: Write the failing tests**

Create `crush/wsa_test.go`:

```go
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// startMockProxy starts a mock Unix socket server that returns a hardcoded
// reason_audit response. Returns the socket path and a stop function.
func startMockProxy(t *testing.T, verdict, rationale string) (sockPath string, stop func()) {
	t.Helper()
	sockPath = filepath.Join(t.TempDir(), "mock_proxy.sock")

	ln, err := net.Listen("unix", sockPath)
	if err != nil {
		t.Fatalf("mock proxy listen: %v", err)
	}

	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			go func(c net.Conn) {
				defer c.Close()
				sc := bufio.NewScanner(c)
				if !sc.Scan() {
					return
				}
				var req clawLinkPacket
				if err := json.Unmarshal(sc.Bytes(), &req); err != nil {
					return
				}
				result := fmt.Sprintf(`{"verdict":%q,"rationale":%q}`, verdict, rationale)
				resultJSON, _ := json.Marshal(result) // double-encode as string in Payload
				innerPayload := fmt.Sprintf(`{"id":%q,"result":%s,"error":null}`, req.TraceID, result)
				resp := clawLinkPacket{
					TraceID: req.TraceID,
					Payload: innerPayload,
				}
				b, _ := json.Marshal(resp)
				c.Write(append(b, '\n'))
				_ = resultJSON
			}(conn)
		}
	}()

	return sockPath, func() { ln.Close() }
}

func TestReasonAudit_ParsesGranted(t *testing.T) {
	sockPath, stop := startMockProxy(t, "GRANTED", "Action within bounds.")
	defer stop()

	orig := Cfg
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	verdict, rationale, err := reasonAudit("unlock", "door_001", "Unlock door door_001.")
	if err != nil {
		t.Fatalf("reasonAudit error: %v", err)
	}
	if verdict != "GRANTED" {
		t.Errorf("verdict = %q, want GRANTED", verdict)
	}
	if !strings.Contains(rationale, "Action within bounds") {
		t.Errorf("rationale = %q, want contains 'Action within bounds'", rationale)
	}
}

func TestReasonAudit_ParsesRejected(t *testing.T) {
	sockPath, stop := startMockProxy(t, "REJECTED", "Target not in scene.")
	defer stop()

	orig := Cfg
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	verdict, _, err := reasonAudit("unlock", "door_999", "Unlock door door_999.")
	if err != nil {
		t.Fatalf("reasonAudit error: %v", err)
	}
	if verdict != "REJECTED" {
		t.Errorf("verdict = %q, want REJECTED", verdict)
	}
}

func TestReasonAudit_ProxyNotRunning(t *testing.T) {
	orig := Cfg
	Cfg.ClawlinkSock = "/tmp/crush_nonexistent_test.sock"
	Cfg.ClawlinkTimeout = 200
	defer func() { Cfg = orig }()

	_, _, err := reasonAudit("unlock", "door_001", "ctx")
	if err == nil {
		t.Fatal("expected error when proxy not running, got nil")
	}
	if !strings.Contains(err.Error(), "proxy not running") {
		t.Errorf("error = %q, want contains 'proxy not running'", err.Error())
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
go test ./... -run TestReasonAudit -v
```

Expected: `FAIL — reasonAudit undefined`

- [ ] **Step 3: Write the implementation**

Create `crush/wsa.go` (partial — just reasonAudit for now):

```go
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"time"
)

// reasonAudit sends a reason_audit RPC to the crush proxy Unix socket and
// returns the Node A verdict ("GRANTED" or "REJECTED") and rationale string.
// Returns an error wrapping "proxy not running" if the socket is unreachable.
func reasonAudit(action, targetID, auditContext string) (verdict, rationale string, err error) {
	timeout := time.Duration(Cfg.ClawlinkTimeout) * time.Millisecond

	conn, err := net.DialTimeout("unix", Cfg.ClawlinkSock, timeout)
	if err != nil {
		return "", "", fmt.Errorf("proxy not running: %w", err)
	}
	defer conn.Close()

	traceID := newTraceID()
	rpcPayload := fmt.Sprintf(
		`{"id":%q,"method":"reason_audit","params":{"action":%q,"target_id":%q,"context":%q}}`,
		traceID, action, targetID, auditContext,
	)

	pkt := clawLinkPacket{
		TraceID:  traceID,
		Payload:  rpcPayload,
		Checksum: payloadChecksum(rpcPayload),
	}
	b, _ := json.Marshal(pkt)
	if _, err := conn.Write(append(b, '\n')); err != nil {
		return "", "", fmt.Errorf("write to proxy: %w", err)
	}

	conn.SetReadDeadline(time.Now().Add(timeout))
	sc := bufio.NewScanner(conn)
	if !sc.Scan() {
		return "", "", fmt.Errorf("no response from proxy")
	}

	var respPkt clawLinkPacket
	if err := json.Unmarshal(sc.Bytes(), &respPkt); err != nil {
		return "", "", fmt.Errorf("parse proxy response: %w", err)
	}

	// Unwrap the inner JSON-RPC envelope
	var rpcResp struct {
		Result json.RawMessage `json:"result"`
		Error  *string         `json:"error"`
	}
	if err := json.Unmarshal([]byte(respPkt.Payload), &rpcResp); err != nil {
		return "", "", fmt.Errorf("parse rpc envelope: %w", err)
	}
	if rpcResp.Error != nil && *rpcResp.Error != "" {
		return "", "", fmt.Errorf("Node A error: %s", *rpcResp.Error)
	}

	var auditResult struct {
		Verdict   string `json:"verdict"`
		Rationale string `json:"rationale"`
	}
	if err := json.Unmarshal(rpcResp.Result, &auditResult); err != nil {
		return "", "", fmt.Errorf("parse audit result: %w", err)
	}

	return auditResult.Verdict, auditResult.Rationale, nil
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
go test ./... -run TestReasonAudit -v -timeout 10s
```

Expected:
```
--- PASS: TestReasonAudit_ParsesGranted (0.00s)
--- PASS: TestReasonAudit_ParsesRejected (0.00s)
--- PASS: TestReasonAudit_ProxyNotRunning (0.00s)
PASS
```

- [ ] **Step 5: Commit**

```bash
git add crush/wsa.go crush/wsa_test.go
git commit -m "feat(crush/wsa): add reasonAudit helper with proxy socket dispatch

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 6: WSA Subcommands

**Files:**
- Modify: `crush/wsa.go` (add `buildAuditContext`, `runWSA`, output styles)
- Modify: `crush/wsa_test.go` (add argument and context tests)

- [ ] **Step 1: Write the failing tests**

Append to `crush/wsa_test.go`:

```go
func TestWSA_BuildAuditContext(t *testing.T) {
	tests := []struct {
		action   string
		targetID string
		wantSub  string
	}{
		{"unlock", "door_001", "Unlock door door_001"},
		{"dim-lights", "scene_02", "Dim lights in scene scene_02"},
		{"hack-camera", "cam_03", "Hack surveillance camera cam_03"},
		{"shut-down", "dev_04", "Shut down networked device dev_04"},
	}
	for _, tc := range tests {
		got := buildAuditContext(tc.action, tc.targetID)
		if got == "" {
			t.Errorf("buildAuditContext(%q, %q) returned empty string", tc.action, tc.targetID)
		}
		if !strings.Contains(got, tc.wantSub) {
			t.Errorf("buildAuditContext(%q, %q) = %q, want substring %q",
				tc.action, tc.targetID, got, tc.wantSub)
		}
	}
}

func TestWSA_UnknownActionReturns1(t *testing.T) {
	code := runWSA([]string{"explode", "everything"})
	if code != 1 {
		t.Errorf("unknown action: exit code = %d, want 1", code)
	}
}

func TestWSA_MissingTargetIDReturns1(t *testing.T) {
	code := runWSA([]string{"unlock"})
	if code != 1 {
		t.Errorf("missing target-id: exit code = %d, want 1", code)
	}
}

func TestWSA_NoArgsReturns1(t *testing.T) {
	code := runWSA([]string{})
	if code != 1 {
		t.Errorf("no args: exit code = %d, want 1", code)
	}
}

func TestWSA_ProxyDownReturns1(t *testing.T) {
	orig := Cfg
	Cfg.ClawlinkSock = "/tmp/crush_wsa_noexist.sock"
	Cfg.ClawlinkTimeout = 200
	defer func() { Cfg = orig }()

	code := runWSA([]string{"unlock", "door_001"})
	if code != 1 {
		t.Errorf("proxy down: exit code = %d, want 1", code)
	}
}

func TestWSA_GrantedExits0(t *testing.T) {
	sockPath, stop := startMockProxy(t, "GRANTED", "Within parameters.")
	defer stop()

	orig := Cfg
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	code := runWSA([]string{"unlock", "door_001"})
	if code != 0 {
		t.Errorf("GRANTED: exit code = %d, want 0", code)
	}
}

func TestWSA_RejectedExits2(t *testing.T) {
	sockPath, stop := startMockProxy(t, "REJECTED", "Not permitted.")
	defer stop()

	orig := Cfg
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	code := runWSA([]string{"unlock", "door_001"})
	if code != 2 {
		t.Errorf("REJECTED: exit code = %d, want 2", code)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
go test ./... -run TestWSA_ -v
```

Expected: `FAIL — buildAuditContext undefined / runWSA undefined`

- [ ] **Step 3: Write the implementation**

Append to `crush/wsa.go` (below `reasonAudit`):

```go
import (
	"fmt"
	"os"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

var (
	wsaGrantedStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("#00ff87")).Bold(true)
	wsaRejectedStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("#ff003c")).Bold(true)
)

const wsaUsage = `Usage: crush wsa <action> <target-id>

Actions:
  unlock      <door-id>     Unlock a door in the current scene
  dim-lights  <scene-id>    Dim lights in a scene
  hack-camera <camera-id>   Hack a surveillance camera
  shut-down   <device-id>   Shut down a networked device
`

// runWSA executes a WSA subcommand and returns an exit code:
//
//	0 = GRANTED (TypeScript Director should call Foundry runScript)
//	1 = proxy error / bad arguments
//	2 = REJECTED (TypeScript Director must NOT call runScript)
func runWSA(args []string) int {
	if len(args) < 2 {
		fmt.Fprint(os.Stderr, wsaUsage)
		return 1
	}

	action := args[0]
	targetID := args[1]

	ctx := buildAuditContext(action, targetID)
	if ctx == "" {
		fmt.Fprintf(os.Stderr, "[CRUSH] ERROR: unknown WSA action %q\n", action)
		fmt.Fprint(os.Stderr, wsaUsage)
		return 1
	}

	verdict, rationale, err := reasonAudit(action, targetID, ctx)
	if err != nil {
		if strings.Contains(err.Error(), "proxy not running") {
			fmt.Fprintln(os.Stderr, "[CRUSH] ERROR: proxy not running — start with 'crush proxy'")
		} else {
			fmt.Fprintf(os.Stderr, "[CRUSH] ERROR: audit failed: %v\n", err)
		}
		return 1
	}

	short := rationale
	if len(short) > 80 {
		short = short[:77] + "..."
	}

	switch verdict {
	case "GRANTED":
		fmt.Println(wsaGrantedStyle.Render(
			fmt.Sprintf("[WSA] ACCESS GRANTED — %s %s", action, targetID),
		) + "   " + short)
		return 0
	case "REJECTED":
		fmt.Println(wsaRejectedStyle.Render(
			fmt.Sprintf("[WSA] FIREWALL REJECTION — %s %s", action, targetID),
		) + " : " + rationale)
		return 2
	default:
		fmt.Fprintf(os.Stderr, "[CRUSH] ERROR: unexpected verdict %q\n", verdict)
		return 1
	}
}

// buildAuditContext returns the natural-language context string for the Node A
// Reasoning Audit. Returns "" for unknown actions.
func buildAuditContext(action, targetID string) string {
	switch action {
	case "unlock":
		return fmt.Sprintf("Unlock door %s in current scene. Operator-initiated via crush CLI.", targetID)
	case "dim-lights":
		return fmt.Sprintf("Dim lights in scene %s. Operator-initiated via crush CLI.", targetID)
	case "hack-camera":
		return fmt.Sprintf("Hack surveillance camera %s in current scene. Operator-initiated via crush CLI.", targetID)
	case "shut-down":
		return fmt.Sprintf("Shut down networked device %s in current scene. Operator-initiated via crush CLI.", targetID)
	default:
		return ""
	}
}
```

- [ ] **Step 4: Fix import block in wsa.go**

The imports from Task 5 and Task 6 must be merged into one `import` block at the top of the file:

```go
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"strings"
	"time"

	"github.com/charmbracelet/lipgloss"
)
```

- [ ] **Step 5: Run all WSA tests to verify they pass**

```bash
go test ./... -run TestWSA_ -v -timeout 10s
```

Expected: all 7 WSA tests PASS

- [ ] **Step 6: Commit**

```bash
git add crush/wsa.go crush/wsa_test.go
git commit -m "feat(crush/wsa): add WSA subcommands with Node A Reasoning Audit gate

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 7: main.go Dispatch

**Files:**
- Modify: `crush/main.go`

- [ ] **Step 1: Write the failing test**

Append to `crush/wsa_test.go`:

```go
func TestWSA_AllActionsRecognised(t *testing.T) {
	// Verify buildAuditContext returns non-empty for every documented action.
	actions := []string{"unlock", "dim-lights", "hack-camera", "shut-down"}
	for _, a := range actions {
		if got := buildAuditContext(a, "test_target"); got == "" {
			t.Errorf("buildAuditContext(%q, ...) returned empty — action not registered", a)
		}
	}
}
```

```bash
go test ./... -run TestWSA_AllActionsRecognised -v
```

Expected: PASS (buildAuditContext already covers all four)

- [ ] **Step 2: Update main.go**

Open `crush/main.go`. Two targeted edits:

**Edit A — Replace the import block** with one that includes `context`, `os/signal`, and `syscall`:

```go
import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/charmbracelet/lipgloss"
)
```

**Edit B — Replace the existing `os.Args` handler** inside `main()`. The current block is:

```go
	// Handle simple CLI flags/args
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "belt":
			if len(os.Args) > 2 {
				switch os.Args[2] {
				case "list":
```

Replace that entire `if len(os.Args) > 1 { ... }` block (lines up to and including the closing `}`) with:

```go
	// Top-level subcommand dispatch
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "proxy":
			ctx, cancel := signal.NotifyContext(
				context.Background(), syscall.SIGINT, syscall.SIGTERM,
			)
			defer cancel()
			if err := runProxy(ctx); err != nil {
				fmt.Fprintf(os.Stderr, "[CRUSH] proxy error: %v\n", err)
				os.Exit(1)
			}
			return

		case "wsa":
			os.Exit(runWSA(os.Args[2:]))

		case "belt":
			if len(os.Args) > 2 {
				switch os.Args[2] {
				case "list":
					fmt.Println(headerStyle.Render("⟨ UTILITY BELT: ACTIVE SIDECARS ⟩"))
					for _, s := range registry.List() {
						statusColor := colorCyan
						if s.State == StateOffline {
							statusColor = colorDim
						}
						fmt.Printf("  %s %s [%s] (Weight: %.1fGB)\n",
							lipgloss.NewStyle().Foreground(statusColor).Render("◈"),
							s.Name, s.State, s.VramWeight)
					}
					vram, _ := CheckVramHeadroom()
					fmt.Printf("\n  VRAM Headroom: %.2fGB\n", vram)
					return
				case "start":
					if len(os.Args) > 3 {
						name := os.Args[3]
						if err := registry.Start(name); err != nil {
							fmt.Printf("Error starting %s: %v\n", name, err)
						} else {
							fmt.Printf("Sidecar %s launched successfully.\n", name)
						}
						return
					}
				}
			}
		}
	}
```

The `registry` initialisation and everything below the replaced block remains untouched.

- [ ] **Step 3: Verify the build passes**

```bash
cd crush && go build ./...
```

Expected: no errors

- [ ] **Step 4: Verify all crush tests still pass**

```bash
go test ./... -timeout 30s
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add crush/main.go
git commit -m "feat(crush): add 'proxy' and 'wsa' subcommand dispatch to main

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 8: TypeScript Schema Update

**Files:**
- Modify: `src/shared/schemas/clawlink.schema.ts`
- Create: `tests/shared/clawlink-schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/shared/clawlink-schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ClawLinkConfigSchema } from '../../src/shared/schemas/clawlink.schema.js';

describe('ClawLinkConfigSchema', () => {
  it('accepts socketPath and applies default', () => {
    const result = ClawLinkConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.socketPath).toBe('/run/crush/clawlink.sock');
    }
  });

  it('accepts explicit socketPath', () => {
    const result = ClawLinkConfigSchema.safeParse({ socketPath: '/tmp/test.sock' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.socketPath).toBe('/tmp/test.sock');
    }
  });

  it('rejects empty socketPath', () => {
    const result = ClawLinkConfigSchema.safeParse({ socketPath: '' });
    expect(result.success).toBe(false);
  });

  it('does not accept host field (removed in Phase 26)', () => {
    // Zod strips unknown keys by default — host should not appear in output
    const result = ClawLinkConfigSchema.safeParse({
      host: '192.168.0.50',
      port: 7878,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['host']).toBeUndefined();
      expect((result.data as Record<string, unknown>)['port']).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/clawlink-schema.test.ts
```

Expected: FAIL — `socketPath` not in schema

- [ ] **Step 3: Update the schema**

Edit `src/shared/schemas/clawlink.schema.ts`. Replace the `ClawLinkConfigSchema` definition:

```typescript
// ── ClawLinkClient config schema ──────────────────────────────────────────────

export const ClawLinkConfigSchema = z.object({
  /**
   * Unix socket path for the crush proxy daemon.
   * Default: /run/crush/clawlink.sock
   * Proxy must be started with `crush proxy` before connecting.
   */
  socketPath: z.string().min(1).default('/run/crush/clawlink.sock'),
  /** Per-request RPC timeout in milliseconds (default: 5000). */
  timeoutMs: z.number().int().min(1).optional(),
});

export type ClawLinkConfig = z.infer<typeof ClawLinkConfigSchema>;
```

Remove the old `host` and `port` fields entirely. They are now in crush's env config (`NODE_A_HOST`, `CLAWLINK_PORT`).

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/shared/clawlink-schema.test.ts
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/schemas/clawlink.schema.ts tests/shared/clawlink-schema.test.ts
git commit -m "feat(ts/schema): replace host/port with socketPath in ClawLinkConfigSchema

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 9: TypeScript ClawLinkClient — Connection Swap and wsaAudit

**Files:**
- Modify: `src/api/clawlink-client.ts`
- Create: `tests/api/clawlink-client.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/api/clawlink-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import net from 'node:net';
import { ClawLinkClient } from '../../src/api/clawlink-client.js';

// Mock net.connect to capture the connection target.
vi.mock('node:net', async () => {
  const actual = await vi.importActual<typeof net>('node:net');
  return {
    ...actual,
    default: {
      ...actual,
      connect: vi.fn(),
    },
  };
});

const mockSocket = {
  on: vi.fn().mockReturnThis(),
  write: vi.fn(),
  destroy: vi.fn(),
  destroyed: false,
};

describe('ClawLinkClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (net.connect as ReturnType<typeof vi.fn>).mockReturnValue(mockSocket);
  });

  it('connects via Unix socket path, not TCP host/port', async () => {
    const client = new ClawLinkClient({ socketPath: '/tmp/test.sock' });

    mockSocket.on.mockImplementation((event: string, cb: () => void) => {
      if (event === 'connect') cb();
      return mockSocket;
    });

    await client.connect();

    expect(net.connect).toHaveBeenCalledWith('/tmp/test.sock');
    expect(net.connect).not.toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(String),
    );
  });

  it('uses default socket path when not specified', async () => {
    const client = new ClawLinkClient({});

    mockSocket.on.mockImplementation((event: string, cb: () => void) => {
      if (event === 'connect') cb();
      return mockSocket;
    });

    await client.connect();

    expect(net.connect).toHaveBeenCalledWith('/run/crush/clawlink.sock');
  });
});

describe('ClawLinkClient.wsaAudit', () => {
  it('sends reason_audit RPC and returns verdict/rationale', async () => {
    const client = new ClawLinkClient({ socketPath: '/tmp/test.sock' });

    // Simulate a connected socket by manually setting the internal socket.
    const traceCapture: string[] = [];

    mockSocket.on.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      if (event === 'connect') cb();
      return mockSocket;
    });
    mockSocket.write.mockImplementation((frame: string, _enc: string, callback?: () => void) => {
      // Parse the frame and echo a GRANTED response
      const pkt = JSON.parse(frame.trim());
      const inner = JSON.parse(pkt.payload);
      traceCapture.push(inner.id);

      // Trigger data event with a mock response
      const responseInner = JSON.stringify({
        id: inner.id,
        result: { verdict: 'GRANTED', rationale: 'All clear.' },
        error: null,
      });
      const response = JSON.stringify({ trace_id: inner.id, payload: responseInner, checksum: 0 }) + '\n';

      // Find the data handler and call it
      const dataHandler = mockSocket.on.mock.calls.find(([event]: [string]) => event === 'data')?.[1];
      if (dataHandler) dataHandler(Buffer.from(response));
      if (callback) callback();
      return true;
    });

    await client.connect();

    const result = await client.wsaAudit('unlock', 'door_001', 'Unlock door_001.');
    expect(result.verdict).toBe('GRANTED');
    expect(result.rationale).toBe('All clear.');
    expect(traceCapture.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/api/clawlink-client.test.ts
```

Expected: FAIL — `connect` still uses TCP, `wsaAudit` not defined

- [ ] **Step 3: Update ClawLinkClient**

In `src/api/clawlink-client.ts`, make the following changes:

**Change the `connect()` method** — replace:
```typescript
const socket = net.connect(this.config.port, this.config.host);
```
with:
```typescript
const socket = net.connect(this.config.socketPath);
```

**Add `wsaAudit` to the `IClawLinkClient` interface** after `processParseltongueNarrative`:
```typescript
/**
 * World State Authority: send a reason_audit RPC to the crush proxy.
 * Used by the Director for AI-initiated WSA mutations before calling runScript.
 * Returns verdict ('GRANTED' | 'REJECTED') and rationale from Node A.
 */
wsaAudit(
  action: string,
  targetId: string,
  context: string,
): Promise<{ verdict: 'GRANTED' | 'REJECTED'; rationale: string }>;
```

**Add `wsaAudit` implementation** to the `ClawLinkClient` class, after `processParseltongueNarrative`:
```typescript
async wsaAudit(
  action: string,
  targetId: string,
  context: string,
): Promise<{ verdict: 'GRANTED' | 'REJECTED'; rationale: string }> {
  const raw = await this.send<{ verdict: string; rationale: string }>(
    'reason_audit',
    { action, target_id: targetId, context },
  );
  if (raw.verdict !== 'GRANTED' && raw.verdict !== 'REJECTED') {
    throw new Error(
      `${CONTEXT} wsaAudit: unexpected verdict ${JSON.stringify(raw.verdict)}`,
    );
  }
  return { verdict: raw.verdict, rationale: raw.rationale ?? '' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/api/clawlink-client.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Run the full TypeScript test suite to check for regressions**

```bash
npx vitest run
```

Expected: all existing tests PASS (the only schema change was removing `host`/`port` — verify no test fixtures still pass those fields)

- [ ] **Step 6: Run the full Go test suite for a final check**

```bash
cd crush && go test ./... -timeout 30s && go vet ./...
```

Expected: all PASS, no vet warnings

- [ ] **Step 7: Commit**

```bash
git add src/api/clawlink-client.ts tests/api/clawlink-client.test.ts
git commit -m "feat(ts): migrate ClawLinkClient to Unix socket, add wsaAudit method

TypeScript Director now connects to the crush proxy Unix socket instead of
directly to ZeroClaw TCP. Adds wsaAudit() for AI-initiated WSA gating.

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Final Integration Check

- [ ] **Verify crush builds cleanly**

```bash
cd crush && go build -o /tmp/crush-test . && echo "BUILD OK"
```

- [ ] **Smoke-test the CLI interface**

```bash
/tmp/crush-test proxy --help 2>&1 || /tmp/crush-test proxy &
sleep 1
kill %1
echo "PROXY SMOKE OK"

/tmp/crush-test wsa 2>&1 | grep -q "Usage" && echo "WSA USAGE OK"
```

- [ ] **Merge to master**

```bash
cd /home/nixos/asp-gm-agent
git merge --no-ff feature/phase-26-sovereign-proxy \
  -m "feat(phase-26-task-1): sovereign proxy — crush proxy daemon and WSA command set

Replaces TypeScript ClawLinkClient direct TCP with Go Unix socket proxy.
Adds crush proxy daemon (pending-map concurrency, reconnect backoff) and
crush wsa subcommands with Node A Reasoning Audit gate.

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

- [ ] **Hand off to Gemini for Audit/Verification**

Gemini must verify:
1. `go build ./...` and `go test ./...` pass in the `crush/` module
2. `npx vitest run` passes for the TypeScript suite
3. `crush proxy` starts without error and creates the Unix socket
4. `crush wsa unlock test-door` correctly returns exit 1 ("proxy not running") when proxy is not started
5. Node A ZeroClaw `reason_audit` RPC handler is queued for implementation (Node A Gemini domain)
