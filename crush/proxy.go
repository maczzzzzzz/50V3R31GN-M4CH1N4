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
