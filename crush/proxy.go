package main

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
	"strings"
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
	Type     string `json:"type,omitempty"` // "broadcast" for real-time streams
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

	// clients tracks active Unix socket connections for broadcasting.
	clientsMu sync.Mutex
	clients   map[net.Conn]struct{}
}

func newProxy() *proxy {
	return &proxy{
		nodeAAddr:  fmt.Sprintf("%s:%s", Cfg.NodeAHost, Cfg.ClawlinkPort),
		socketPath: Cfg.ClawlinkSock,
		timeout:    time.Duration(Cfg.ClawlinkTimeout) * time.Millisecond,
		writerCh:   make(chan []byte, 64),
		pending:    make(map[string]chan clawLinkPacket),
		clients:    make(map[net.Conn]struct{}),
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

// runWriter drains writerCh and writes frames to the ZeroClaw TCP connection.
// Serialises all writes so frames from concurrent callers never interleave.
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
			logError("[CRUSH] proxy: Node A unreachable (%v), retry in %v\n", err, backoff)
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
		logError("[CRUSH] proxy: connected to Node A at %s\n", p.nodeAAddr)

		connCtx, connCancel := context.WithCancel(ctx)

		go p.runWriter(connCtx, conn)
		go func() {
			p.runReader(connCtx, conn)
			connCancel()
			conn.Close()
			p.cancelAll()
		}()

		<-connCtx.Done()
		connCancel()
		conn.Close()

		if ctx.Err() != nil {
			return
		}
		logError("[CRUSH] proxy: Node A connection lost, reconnecting\n")
	}
}

// runReader reads newline-delimited ClawLinkPacket frames from the ZeroClaw TCP
// connection and routes each response to the correct pending caller.
// Buffer is 4MB to accommodate large ST3GG base64 payloads.
func (p *proxy) runReader(ctx context.Context, conn net.Conn) {
	sc := bufio.NewScanner(conn)
	sc.Buffer(make([]byte, 4*1024*1024), 4*1024*1024)
	for sc.Scan() {
		var pkt clawLinkPacket
		if err := json.Unmarshal(sc.Bytes(), &pkt); err != nil {
			continue
		}
		p.deliver(pkt)
	}
}

// send enqueues a frame for writing to ZeroClaw and blocks until the matching
// response arrives or the per-request timeout expires.
func (p *proxy) send(frame []byte, traceID string) (clawLinkPacket, error) {
	ch := p.register(traceID)

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
func (p *proxy) handleUnixConn(conn net.Conn) {
	p.clientsMu.Lock()
	p.clients[conn] = struct{}{}
	p.clientsMu.Unlock()

	defer func() {
		p.clientsMu.Lock()
		delete(p.clients, conn)
		p.clientsMu.Unlock()
		conn.Close()
	}()

	sc := bufio.NewScanner(conn)
	sc.Buffer(make([]byte, 4*1024*1024), 4*1024*1024)
	for sc.Scan() {
		raw := sc.Bytes()
		fmt.Printf("[DEBUG] Received raw frame: %s\n", string(raw))
		var pkt clawLinkPacket
		if err := json.Unmarshal(raw, &pkt); err != nil {
			fmt.Printf("[DEBUG] JSON Unmarshal error: %v\n", err)
			continue
		}

		if pkt.TraceID == "" {
			// If not a standard packet (e.g. raw JSON intent from CLI), wrap it
			pkt.Payload = string(raw)
			pkt.TraceID = newTraceID()
			fmt.Printf("[DEBUG] Wrapped non-standard packet. New trace_id=%s\n", pkt.TraceID)
			// Update raw to be the wrapped packet for broadcasting/sending
			raw, _ = json.Marshal(pkt)
		}

		// Handle broadcast packets from Node B (TypeScript)
		if pkt.Type == "broadcast" {
			p.broadcast(raw, conn)
			continue
		}

		// Phase 30: Route human intents to Node B (Director)
		// We detect these by parsing the payload for commands like "scan" or "hack".
		var intent struct {
			Command string `json:"command"`
			Method  string `json:"method"`
		}
		_ = json.Unmarshal([]byte(pkt.Payload), &intent)

		if intent.Command == "scan" || intent.Command == "hack" || intent.Command == "crop-scan" || intent.Command == "intent" || intent.Method == "reason_audit" {
			fmt.Printf("[DEBUG] Broadcasting intent: cmd=%s, method=%s, trace_id=%s\n", intent.Command, intent.Method, pkt.TraceID)
			// Broadcast to Node B and other listeners
			p.broadcast(raw, conn)
			
			// If it's a CLI command that expects a direct response from Node B, we skip Node A.
			if intent.Method != "reason_audit" {
				continue
			}
		}

		fmt.Printf("[DEBUG] Sending to Node A: method=%s, trace_id=%s\n", intent.Method, pkt.TraceID)
		resp, err := p.send(append(raw[:len(raw):len(raw)], '\n'), pkt.TraceID)
		if strings.Contains(pkt.Payload, "reason_audit") {
			payloadStr := "nil"
			if err == nil {
				payloadStr = resp.Payload
			}
			fmt.Printf("[DEBUG] reason_audit Node A response: err=%v, payload=%s\n", err, payloadStr)
		}
		if err != nil {
			// Node A is offline — reject to preserve Zero-Trust integrity
			if strings.Contains(pkt.Payload, "reason_audit") {
				rejPkt := clawLinkPacket{
					TraceID: pkt.TraceID,
					Payload: fmt.Sprintf(`{"id":%q,"result":{"verdict":"REJECTED","rationale":"SECURITY_VETO: Node A Reasoner Offline — Physical Sovereignty Compromised"}}`, pkt.TraceID),
				}
				b, _ := json.Marshal(rejPkt)
				conn.Write(append(b, '\n'))
				continue
			}
			conn.Write(errorPacketJSON(pkt.TraceID, err.Error()))
			continue
		}

		// Also check for RPC-level errors from Node A (unknown method = unrecognized intent)
		if err == nil && strings.Contains(pkt.Payload, "reason_audit") && strings.Contains(resp.Payload, "Unknown method") {
			rejPkt := clawLinkPacket{
				TraceID: pkt.TraceID,
				Payload: fmt.Sprintf(`{"id":%q,"result":{"verdict":"REJECTED","rationale":"SECURITY_VETO: Node A Reasoner Offline — Physical Sovereignty Compromised"}}`, pkt.TraceID),
			}
			b, _ := json.Marshal(rejPkt)
			conn.Write(append(b, '\n'))
			continue
		}

		b, _ := json.Marshal(resp)
		conn.Write(append(b, '\n'))
	}
}

// broadcast sends a raw frame to all connected Unix socket clients except the specified skip connection.
func (p *proxy) broadcast(frame []byte, skip net.Conn) {
	if !bytes.HasSuffix(frame, []byte("\n")) {
		frame = append(frame, '\n')
	}

	p.clientsMu.Lock()
	defer p.clientsMu.Unlock()
	for c := range p.clients {
		if c == skip {
			continue
		}
		c.Write(frame)
	}
}

// runProxy starts the Unix socket listener and Node A TCP manager.
// Blocks until ctx is cancelled.
func runProxy(ctx context.Context) error {
	p := newProxy()

	if err := os.MkdirAll(filepath.Dir(p.socketPath), 0755); err != nil {
		return fmt.Errorf("mkdir %s: %w", filepath.Dir(p.socketPath), err)
	}
	os.Remove(p.socketPath)

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
