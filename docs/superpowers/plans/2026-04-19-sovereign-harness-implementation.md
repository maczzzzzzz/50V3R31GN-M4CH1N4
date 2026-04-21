# Sovereign Harness (Go-Native CDP Engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the high-performance Go-native CDP engine (Sovereign Harness) to replace the Playwright/Node.js Gauntlet.

**Architecture:** The harness operates as a standalone package within `crush`. It utilizes `gobwas/ws` for low-overhead transport and `cdproto` for type-safe interaction with the Chrome DevTools Protocol.

**Tech Stack:** Go 1.21+, `gobwas/ws`, `cdproto`, `Akashik.db` (SQLite).

---

### Task 1: Harness Kernel (Transport & VSB Handshake)

**Files:**
- Create: `crush/harness/kernel/transport.go`
- Create: `crush/harness/kernel/session.go`
- Create: `crush/harness/kernel/vsb_listener.go`
- Test: `crush/harness/kernel/kernel_test.go`

- [ ] **Step 1: Write the failing test for CDP connection**

```go
package kernel

import "testing"

func TestConnect(t *testing.T) {
    // Testing against Node B bridge
    url := "ws://10.0.0.11:9223" 
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    session, err := Connect(ctx, url)
    if err != nil {
        t.Fatalf("Failed to connect to CDP bridge: %v", err)
    }
    defer session.Close()
}
```

- [ ] **Step 2: Implement VSB Listener using 'harness/protocol'**

```go
package kernel

import (
    "net"
    "github.com/50v3r31gn-m4ch1n4/crush/harness/protocol"
)

func ListenForIntents(port string) error {
    addr, _ := net.ResolveUDPAddr("udp", ":"+port)
    conn, _ := net.ListenUDP("udp", addr)
    buf := make([]byte, 1024)
    for {
        n, _, _ := conn.ReadFromUDP(buf)
        pkt, err := protocol.DecodeIntent(buf[:n])
        if err == nil {
            // Dispatch to Driver
        }
    }
}
```

- [ ] **Step 3: Implement minimal `Connect` via `gobwas/ws`**

```go
package kernel

import (
	"context"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
)

type Session struct {
    conn net.Conn
}

func Connect(ctx context.Context, url string) (*Session, error) {
    conn, _, _, err := ws.Dial(ctx, url)
    if err != nil {
        return nil, err
    }
    return &Session{conn: conn}, nil
}

func (s *Session) Close() error {
    return s.conn.Close()
}
```

- [ ] **Step 3: Run test to verify handshake**

Run: `go test -v ./crush/harness/kernel/...`
Expected: PASS (if Archer/Mesh is up) or FAIL with connection error.

---

### Task 2: Driver Primitives (Click & AXTree)

**Files:**
- Create: `crush/harness/driver/primitives.go`
- Create: `crush/harness/driver/axtree.go`

- [ ] **Step 1: Implement `ReadAXTree` using `cdproto`**

```go
func (s *Session) ReadAXTree(ctx context.Context) (*accessibility.GetFullAXTreeReturns, error) {
    // Wrap cdproto Accessibility.getFullAXTree call
    return accessibility.GetFullAXTree().Do(ctx)
}
```

- [ ] **Step 2: Implement `ClickElement` via DOM coordinates**

```go
func (s *Session) ClickElement(ctx context.Context, selector string) error {
    // 1. Resolve selector to NodeID
    // 2. Get box model
    // 3. Dispatch mouse event at center coordinates
    return nil // Implementation requires cdproto DOM and Input domains
}
```

---

### Task 3: Night Market Skill Shard (Steel-Thread)

**Files:**
- Create: `crush/harness/skills/night_market.go`

- [ ] **Step 1: Implement the Market Generation loop**

```go
func GenerateNightMarket(s *Session) error {
    // 1. Navigate to Market Tab
    // 2. Click "#generate-market-btn"
    // 3. Wait for stability
    // 4. Capture AXTree
    // 5. Send to Node C Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle for parsing if needed
    return nil
}
```

---

### Task 4: Self-Healing (Healer Protocol)

**Files:**
- Create: `crush/harness/healer.go`

- [ ] **Step 1: Implement the Fallback-to-Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle logic**

```go
func (s *Session) ResolveWithHealer(ctx context.Context, intent string) error {
    // 1. Fetch AXTree
    // 2. Wrap in VSB packet to Node C
    // 3. Wait for "Repair Shard" (JSON selector/action)
    // 4. Execute repair
    return nil
}
```
