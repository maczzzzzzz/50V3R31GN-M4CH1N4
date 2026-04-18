package main

// dashboard_bridge.go — VSB-to-WebSocket telemetry bridge.
//
// Listens on UDP :7878 for binary IntentPackets (302 bytes), decodes them,
// and broadcasts JSON telemetry to all connected WebSocket clients on :9090.
//
// Binary layout (little-endian, mirrors vsb_protocol.ts):
//   [0:2]   magic     u16   (0xC0DE)
//   [2]     version   u8    (0x01)
//   [3]     pktType   u8
//   [4:8]   seqId     u32
//   [8:12]  payloadLen u32
//   [12]    checksum  u8
//   [13]    intentType u8
//   [14:30] sessionId [16]byte
//   [30:46] actorId   [16]byte
//   [46:302] payload  [256]byte

import (
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	vsbMagic         = 0xC0DE
	intentPktSize    = 302
	telemetryPktSize = 269
	udpReadBufSize   = 512
)

// TelemetryPacket is the JSON payload broadcast to dashboard clients.
type TelemetryPacket struct {
	Timestamp  string `json:"ts"`
	SeqID      uint32 `json:"seq"`
	PacketType uint8  `json:"pkt_type"`
	IntentType uint8  `json:"intent_type"`
	PayloadLen uint32 `json:"payload_len"`
	SessionID  string `json:"session_id"`
	ActorID    string `json:"actor_id"`
	Payload    string `json:"payload"`
}

// wsHub manages connected WebSocket clients and fan-out broadcasts.
type wsHub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]struct{}
}

func newWsHub() *wsHub {
	return &wsHub{clients: make(map[*websocket.Conn]struct{})}
}

func (h *wsHub) add(c *websocket.Conn) {
	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()
}

func (h *wsHub) remove(c *websocket.Conn) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
	c.Close()
}

func (h *wsHub) broadcast(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients {
		_ = c.WriteMessage(websocket.TextMessage, msg)
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// decodeVsbPacket parses a buffer into a TelemetryPacket JSON.
// Handles both Intent (0x01) and Telemetry (0x05) packets.
func decodeVsbPacket(buf []byte) *TelemetryPacket {
	if len(buf) < 13 {
		return nil
	}
	magic := binary.LittleEndian.Uint16(buf[0:2])
	if magic != vsbMagic {
		return nil
	}

	pktType := buf[3]
	seqID := binary.LittleEndian.Uint32(buf[4:8])
	payloadLen := binary.LittleEndian.Uint32(buf[8:12])

	tp := &TelemetryPacket{
		Timestamp:  time.Now().UTC().Format(time.RFC3339Nano),
		SeqID:      seqID,
		PacketType: pktType,
		PayloadLen: payloadLen,
	}

	if pktType == 0x01 && len(buf) >= intentPktSize { // Intent
		tp.IntentType = buf[13]
		tp.SessionID = hex.EncodeToString(buf[14:30])
		tp.ActorID = hex.EncodeToString(buf[30:46])
		tp.Payload = hex.EncodeToString(buf[46:110])
	} else if pktType == 0x05 && len(buf) >= telemetryPktSize { // Telemetry
		rawPayload := buf[13:telemetryPktSize]
		if payloadLen > 256 {
			payloadLen = 256
		}
		tp.Payload = string(rawPayload[:payloadLen])
	} else {
		return nil
	}

	return tp
}

// runDashboardBridge starts the VSB→WebSocket telemetry bridge.
// Blocks until the process is killed.
func runDashboardBridge() error {
	hub := newWsHub()

	// ── WebSocket server ──────────────────────────────────────────────────────
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		hub.add(conn)
		fmt.Printf("[BRIDGE] client connected: %s\n", r.RemoteAddr)
		// Drain incoming frames (ping/close) and clean up on disconnect.
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
		hub.remove(conn)
		fmt.Printf("[BRIDGE] client disconnected: %s\n", r.RemoteAddr)
	})

	wsAddr := "127.0.0.1:" + Cfg.DashboardPort
	go func() {
		fmt.Printf("[BRIDGE] WebSocket listening on ws://%s/ws\n", wsAddr)
		if err := http.ListenAndServe(wsAddr, mux); err != nil {
			fmt.Printf("[BRIDGE] WS server error: %v\n", err)
		}
	}()

	// ── UDP listener ─────────────────────────────────────────────────────────
	udpAddr, err := net.ResolveUDPAddr("udp4", "0.0.0.0:"+Cfg.ClawlinkPort)
	if err != nil {
		return fmt.Errorf("resolve UDP addr: %w", err)
	}
	conn, err := net.ListenUDP("udp4", udpAddr)
	if err != nil {
		return fmt.Errorf("UDP listen :7878: %w", err)
	}
	defer conn.Close()

	fmt.Printf("[BRIDGE] UDP listener on :%s — ready to decode VSB packets\n", Cfg.ClawlinkPort)

	buf := make([]byte, udpReadBufSize)
	for {
		n, _, err := conn.ReadFromUDP(buf)
		if err != nil {
			fmt.Printf("[BRIDGE] UDP read error: %v\n", err)
			continue
		}

		pkt := decodeVsbPacket(buf[:n])
		if pkt == nil {
			continue // drop malformed / non-VSB datagrams
		}

		data, err := json.Marshal(pkt)
		if err != nil {
			continue
		}
		hub.broadcast(data)
	}
}

