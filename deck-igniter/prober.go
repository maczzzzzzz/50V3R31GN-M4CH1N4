package main

// prober.go — Task 5: Heartbeat Monitor
//
// Every 2 seconds the tickMsg fires probeAllCmd which dispatches concurrent
// health probes per component:
//
//   foundry-vtt       → CDP JSON probe:  GET http://localhost:9222/json
//   director          → HTTP probe:      GET http://localhost:3000/health
//   sidecar-atlas     → HTTP probe:      GET http://localhost:3001/health
//   sidecar-netrunning→ HTTP probe:      GET http://localhost:3002/health
//   llama-server      → HTTP probe:      GET http://<node-a>:8080/health
//   zeroclaw          → VSB UDP heartbeat (port 9999)

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

// ── Probe Endpoints ────────────────────────────────────────────────────────────

const (
	probeTimeout = 1500 * time.Millisecond

	// Local WSL endpoints
	cdpEndpoint       = "http://localhost:9222/json"
	directorEndpoint  = "http://localhost:3000/health"
	atlasEndpoint     = "http://localhost:3001/health"
	netrunEndpoint    = "http://localhost:3002/health"

	// Remote Node A endpoints
	llamaEndpoint     = "http://node-a:8080/health"
	vsbUDPAddr        = "node-a:9999"
	vsbUDPReadTimeout = 1 * time.Second
)

var httpProber = &http.Client{Timeout: probeTimeout}

// ── Probe Dispatch ─────────────────────────────────────────────────────────────

// probeAllCmd replaces the stub from Task 1.
// It only probes components that are in StateStarting or StateRunning —
// idle/stopped components are left alone.
func probeAllCmd(components []*Component) tea.Cmd {
	var cmds []tea.Cmd
	for _, c := range components {
		if c.State != StateStarting && c.State != StateRunning {
			continue
		}
		comp := c // capture
		cmds = append(cmds, probeComponent(comp))
	}
	if len(cmds) == 0 {
		return nil
	}
	return tea.Batch(cmds...)
}

// probeComponent dispatches the correct probe for each component.
func probeComponent(c *Component) tea.Cmd {
	switch c.Name {
	case "foundry-vtt":
		return probeCDP(c.Name)
	case "director":
		return probeHTTP(c.Name, directorEndpoint)
	case "sidecar-atlas":
		return probeHTTP(c.Name, atlasEndpoint)
	case "sidecar-netrunning":
		return probeHTTP(c.Name, netrunEndpoint)
	case "llama-server":
		return probeHTTP(c.Name, llamaEndpoint)
	case "zeroclaw":
		return probeVSBUDP(c.Name)
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
			return probeResultMsg{
				name:    name,
				healthy: false,
				err:     fmt.Sprintf("HTTP %d from %s", resp.StatusCode, endpoint),
			}
		}
		return probeResultMsg{name: name, healthy: true}
	}
}

// ── CDP Probe (Foundry VTT) ────────────────────────────────────────────────────

// cdpTarget is a minimal representation of a Chrome DevTools Protocol target.
type cdpTarget struct {
	Type string `json:"type"`
	URL  string `json:"url"`
}

// probeCDP polls localhost:9222/json and looks for a "page" target whose URL
// contains "game" — indicating that the Foundry world is fully loaded.
func probeCDP(name string) tea.Cmd {
	return func() tea.Msg {
		resp, err := httpProber.Get(cdpEndpoint)
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
				// CDP is up; mark as Running even before world fully loads.
				return probeResultMsg{name: name, healthy: true}
			}
		}

		// CDP is up but no page target yet — still negotiating.
		return probeResultMsg{name: name, healthy: false,
			err: "CDP: no page target (world still loading)"}
	}
}

// ── VSB UDP Heartbeat Probe (zeroclaw) ────────────────────────────────────────
//
// Sends a 1-byte ping (0x01) to the zeroclaw VSB UDP server and waits for
// any non-empty reply.  The protocol is defined in zeroclaw/src/server/vsb_udp.rs.

const vsbPingByte = byte(0x01)

func probeVSBUDP(name string) tea.Cmd {
	return func() tea.Msg {
		conn, err := net.DialTimeout("udp", vsbUDPAddr, probeTimeout)
		if err != nil {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("VSB UDP dial: %v", err)}
		}
		defer conn.Close()

		if _, err := conn.Write([]byte{vsbPingByte}); err != nil {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("VSB UDP write: %v", err)}
		}

		_ = conn.SetReadDeadline(time.Now().Add(vsbUDPReadTimeout))
		buf := make([]byte, 64)
		n, err := conn.Read(buf)
		if err != nil || n == 0 {
			return probeResultMsg{name: name, healthy: false,
				err: fmt.Sprintf("VSB UDP no ACK: %v", err)}
		}

		return probeResultMsg{name: name, healthy: true}
	}
}

// ── Probe Result → State Transition ──────────────────────────────────────────
//
// The probeResultMsg handler in main.go's Update does the state transition.
// Components in StateStarting that pass a probe are promoted to StateRunning.
// probeResultMsg is extended here to carry a "promote" signal.

// promoteIfHealthy is called from Update when a probe result arrives for a
// component in StateStarting — it upgrades it to StateRunning.
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
