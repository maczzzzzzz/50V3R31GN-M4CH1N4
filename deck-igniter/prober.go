package main

// prober.go — Task 5 (Remediated): Heartbeat Monitor
//
// Every 2 seconds the tickMsg fires probeAllCmd which dispatches concurrent
// health probes per component:
//
//   foundry-vtt       → CDP JSON probe:  GET http://<win-host>:9223/json (via win-proxy.cjs)
//   director          → TCP dial:        localhost:3010 (WebSocket server)
//   sidecar-atlas     → PID registry:    process alive check (Egui native, no HTTP)
//   sidecar-netrunning→ PID registry:    process alive check (Egui native, no HTTP)
//   llama-server      → HTTP probe:      GET http://<NODE_A_HOST>:8080/health
//   zeroclaw          → VSB UDP:         302-byte IntentPacket → await ResultPacket

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"syscall"
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

// ── Probe Config ───────────────────────────────────────────────────────────────

const (
	probeTimeout = 1500 * time.Millisecond

	// directorWSAddr is the local WSL WebSocket TCP endpoint for the Director.
	directorWSAddr = "localhost:3010"

	// cdpProxyPort is the win-proxy port that forwards WSL2 → Windows CDP.
	// win-proxy.cjs must be running on the Windows host (scripts/win-proxy.cjs).
	cdpProxyPort = 9223

	// VSB UDP timeouts
	vsbUDPReadTimeout = 1 * time.Second
)

// cdpJSONEndpoint returns the CDP /json URL routed through the Windows proxy.
// Foundry VTT Electron binds CDP strictly to Windows 127.0.0.1:9222; it
// ignores --remote-debugging-address=0.0.0.0.  win-proxy.cjs bridges
// 0.0.0.0:9223 → 127.0.0.1:9222 on the Windows side. From WSL2 we reach
// Windows via the default gateway (ResolveWindowsHostIP).
func cdpJSONEndpoint() string {
	return fmt.Sprintf("http://%s:%d/json", ResolveWindowsHostIP(), cdpProxyPort)
}

// llamaHealthURL is derived at runtime from Cfg.NodeAHost.
func llamaHealthURL() string {
	return fmt.Sprintf("http://%s:8080/health", Cfg.NodeAHost)
}

// vsbUDPAddr is derived at runtime from Cfg.NodeAHost and Cfg.ClawlinkPort.
func vsbUDPAddr() string {
	return net.JoinHostPort(Cfg.NodeAHost, Cfg.ClawlinkPort)
}

func oracleHealthURL() string {
	return fmt.Sprintf("http://%s:%s/health", Cfg.NodeCHost, Cfg.NodeCPort)
}

func mooncakeHealthURL() string {
	return fmt.Sprintf("http://%s:6789/health", Cfg.NodeAHost)
}

func swapperHealthURL() string {
	return fmt.Sprintf("http://%s:%s/health", Cfg.NodeDHost, Cfg.NodeDPort)
}

var httpProber = &http.Client{Timeout: probeTimeout}

// ── Probe Dispatch ─────────────────────────────────────────────────────────────

// probeAllCmd dispatches health probes for Starting/Running components only.
func probeAllCmd(components []*Component) tea.Cmd {
	var cmds []tea.Cmd
	for _, c := range components {
		if c.State != StateStarting && c.State != StateRunning {
			continue
		}
		comp := c
		cmds = append(cmds, probeComponent(comp))
	}
	if len(cmds) == 0 {
		return nil
	}
	return tea.Batch(cmds...)
}

// probeComponent dispatches the correct strategy per component.
func probeComponent(c *Component) tea.Cmd {
	switch c.Name {
	case "foundry-vtt":
		return probeCDP(c.Name)
	case "pixtral":
		// Pixtral runs on Windows; reach it via the WSL2 gateway.
		return probeHTTP(c.Name, fmt.Sprintf("http://%s:8080/health", ResolveWindowsHostIP()))
	case "director":
		return probeTCPDial(c.Name, directorWSAddr)
	case "sidecar-atlas", "sidecar-netrunning", "sidecar-cyberdeck", "crush-proxy", "dashboard-bridge", "shadow-dashboard", "vault-sync":
		return probePID(c.Name)
	case "crush-gui":
		return nil // external Windows console window — not probed via PID
	case "llama-server":
		return probeHTTP(c.Name, llamaHealthURL())
	case "zeroclaw":
		return probeVSBUDP(c.Name)
	case "mooncake-synapse":
		return probeHTTP(c.Name, mooncakeHealthURL())
	case "oracle-logic":
		return probeHTTP(c.Name, oracleHealthURL())
	case "node-d-command":
		return probeHTTP(c.Name, swapperHealthURL())
	default:
		return nil
	}
}

// ── HTTP Probe ─────────────────────────────────────────────────────────────────

func probeHTTP(name, endpoint string) tea.Cmd {
	return func() tea.Msg {
		resp, err := httpProber.Get(endpoint)
		if err != nil {
			return probeResultMsg{name: name, healthy: false, err: err.Error()}
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("HTTP %d from %s", resp.StatusCode, endpoint)}
		}
		return probeResultMsg{name: name, healthy: true}
	}
}

// ── TCP Dial Probe (Director WebSocket) ───────────────────────────────────────
// The Director (FoundryAdapter) runs a WebSocket server on port 3010.
// It exposes no REST /health endpoint, so we verify liveness by completing
// a TCP connect + immediate close.

func probeTCPDial(name, addr string) tea.Cmd {
	return func() tea.Msg {
		conn, err := net.DialTimeout("tcp", addr, probeTimeout)
		if err != nil {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("TCP dial %s: %v", addr, err)}
		}
		conn.Close()
		return probeResultMsg{name: name, healthy: true}
	}
}

// ── PID Registry Probe (Egui Sidecars) ────────────────────────────────────────
// sidecar-atlas and sidecar-netrunning are native Rust/Egui GUI applications.
// They host no HTTP server. Liveness is determined by checking that their PID
// is still alive in the OS process table.

func probePID(name string) tea.Cmd {
	return func() tea.Msg {
		procRegistryMu.Lock()
		cmd, ok := procRegistry[name]
		procRegistryMu.Unlock()

		if !ok || cmd == nil || cmd.Process == nil {
			// Process was never registered — still starting or already gone.
			return probeResultMsg{name: name, healthy: false,
				err: "process not in registry"}
		}

		// Send signal 0: checks if the PID exists without disturbing it.
		if err := cmd.Process.Signal(syscall.Signal(0)); err != nil {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("PID probe: %v", err)}
		}
		return probeResultMsg{name: name, healthy: true}
	}
}

// ── CDP Probe (Foundry VTT) ────────────────────────────────────────────────────

type cdpTarget struct {
	Type string `json:"type"`
	URL  string `json:"url"`
}

func probeCDP(name string) tea.Cmd {
	return func() tea.Msg {
		resp, err := httpProber.Get(cdpJSONEndpoint())
		if err != nil {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("CDP unreachable: %v", err)}
		}
		defer resp.Body.Close()

		var targets []cdpTarget
		if err := json.NewDecoder(resp.Body).Decode(&targets); err != nil {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("CDP JSON decode: %v", err)}
		}

		for _, t := range targets {
			if t.Type == "page" {
				return probeResultMsg{name: name, healthy: true}
			}
		}
		return probeResultMsg{name: name, healthy: false,
			err: "CDP: no page target (world still loading)"}
	}
}

// ── VSB UDP Heartbeat Probe (zeroclaw) ────────────────────────────────────────
//
// vsb_udp.rs strictly validates the IntentPacket wire format:
//   - Size MUST be exactly 302 bytes (size_of::<IntentPacket>())
//   - PacketType MUST be 0x01 (Intent) — other types are dropped
//   - Header checksum (XOR of bytes [0..12]) MUST be valid
//
// We build a minimal but protocol-compliant IntentPacket and wait for any
// ResultPacket (290 bytes) in reply, confirming the VSB highway is live.

const (
	vsbMagic         = uint16(0xC0DE)
	vsbVersion       = uint8(0x01)
	vsbTypeIntent    = uint8(0x01)
	intentPacketSize = 302
	resultPacketSize = 290
)

// buildHeartbeatPacket constructs a valid 302-byte IntentPacket.
// SovereignHeader layout (13 bytes):
//   [0:2]  magic       u16 LE
//   [2]    version     u8
//   [3]    packet_type u8
//   [4:8]  sequence_id u32 LE
//   [8:12] payload_len u32 LE  (= 256)
//   [12]   checksum    u8  (XOR of [0:12])
// IntentPacket extras (289 bytes after header):
//   [13]    intent_type u8       (Roll = 0x01)
//   [14:30] session_id  [16]u8
//   [30:46] actor_id    [16]u8
//   [46:302] payload    [256]u8  ("HEARTBEAT_PROBE" padded)
func buildHeartbeatPacket(seq uint32) [intentPacketSize]byte {
	var pkt [intentPacketSize]byte

	// Magic (LE)
	binary.LittleEndian.PutUint16(pkt[0:2], vsbMagic)
	// Version
	pkt[2] = vsbVersion
	// PacketType = Intent (0x01)
	pkt[3] = vsbTypeIntent
	// Sequence ID (LE)
	binary.LittleEndian.PutUint32(pkt[4:8], seq)
	// Payload length = 256 (LE)
	binary.LittleEndian.PutUint32(pkt[8:12], 256)
	// XOR checksum of bytes [0:12]
	var cs byte
	for _, b := range pkt[0:12] {
		cs ^= b
	}
	pkt[12] = cs

	// intent_type = Roll (0x01)
	pkt[13] = 0x01
	// session_id [14:30], actor_id [30:46] — zero (already zero)
	// payload [46:302] — embed probe tag
	copy(pkt[46:], []byte("HEARTBEAT_PROBE"))

	return pkt
}

// probeSeq is a monotonic counter for heartbeat packets.
var probeSeq uint32

func probeVSBUDP(name string) tea.Cmd {
	probeSeq++
	seq := probeSeq

	return func() tea.Msg {
		addr := vsbUDPAddr()
		conn, err := net.DialTimeout("udp", addr, probeTimeout)
		if err != nil {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("VSB UDP dial: %v", err)}
		}
		defer conn.Close()

		pkt := buildHeartbeatPacket(seq)
		if _, err := conn.Write(pkt[:]); err != nil {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("VSB UDP write: %v", err)}
		}

		_ = conn.SetReadDeadline(time.Now().Add(vsbUDPReadTimeout))
		buf := make([]byte, 512)
		n, err := conn.Read(buf)
		if err != nil || n < resultPacketSize {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("VSB UDP no ACK (got %d bytes): %v", n, err)}
		}

		return probeResultMsg{name: name, healthy: true}
	}
}

// ── Probe Result → State Transition ──────────────────────────────────────────

// promoteIfHealthy upgrades Starting components to Running on first healthy probe.
func promoteIfHealthy(m *Model, msg probeResultMsg) {
	for _, c := range m.components {
		if c.Name != msg.name {
			continue
		}
		if msg.healthy && c.State == StateStarting {
			c.State = StateRunning
			if c.StartedAt.IsZero() {
				c.StartedAt = time.Now()
			}
		}
	}
}

// ── Boot Sequence Gate Probes ─────────────────────────────────────────────────
//
// Each gate blocks inside a tea.Cmd until a readiness condition is met or the
// deadline expires, enforcing strict dependency ordering in bootSequenceCmd.
// tea.Sequence will not dispatch the next command until the gate returns.

// waitForCDPGate polls cdpJSONEndpoint until a "page" target appears (Foundry
// world loaded) or timeout expires.
func waitForCDPGate(timeout time.Duration) tea.Cmd {
	return func() tea.Msg {
		deadline := time.Now().Add(timeout)
		for time.Now().Before(deadline) {
			resp, err := httpProber.Get(cdpJSONEndpoint())
			if err == nil {
				var targets []cdpTarget
				if json.NewDecoder(resp.Body).Decode(&targets) == nil {
					resp.Body.Close()
					for _, t := range targets {
						if t.Type == "page" {
							return logMsg{text: fmt.Sprintf("[%s] GATE ✓ CDP page target confirmed", time.Now().Format("15:04:05"))}
						}
					}
				} else {
					resp.Body.Close()
				}
			}
			time.Sleep(2 * time.Second)
		}
		return logMsg{text: fmt.Sprintf("[%s] GATE TIMEOUT: CDP unreachable after %s — continuing anyway", time.Now().Format("15:04:05"), timeout)}
	}
}

// waitForSockGate polls for a Unix socket file until it exists or timeout expires.
func waitForSockGate(sockPath string, timeout time.Duration) tea.Cmd {
	return func() tea.Msg {
		deadline := time.Now().Add(timeout)
		for time.Now().Before(deadline) {
			if _, err := os.Stat(sockPath); err == nil {
				return logMsg{text: fmt.Sprintf("[%s] GATE ✓ socket %s ready", time.Now().Format("15:04:05"), sockPath)}
			}
			time.Sleep(500 * time.Millisecond)
		}
		return logMsg{text: fmt.Sprintf("[%s] GATE TIMEOUT: %s not found after %s — continuing anyway", time.Now().Format("15:04:05"), sockPath, timeout)}
	}
}

// waitForTCPGate polls a TCP address until a connection succeeds or timeout expires.
func waitForTCPGate(addr string, timeout time.Duration) tea.Cmd {
	return func() tea.Msg {
		deadline := time.Now().Add(timeout)
		for time.Now().Before(deadline) {
			conn, err := net.DialTimeout("tcp", addr, 1*time.Second)
			if err == nil {
				conn.Close()
				return logMsg{text: fmt.Sprintf("[%s] GATE ✓ TCP %s confirmed", time.Now().Format("15:04:05"), addr)}
			}
			time.Sleep(1 * time.Second)
		}
		return logMsg{text: fmt.Sprintf("[%s] GATE TIMEOUT: TCP %s unreachable after %s — continuing anyway", time.Now().Format("15:04:05"), addr, timeout)}
	}
}
