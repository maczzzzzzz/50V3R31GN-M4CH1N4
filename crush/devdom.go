package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strconv"
	"time"
)

// GhostAction represents a single physical event in a .ghost sequence.
type GhostAction struct {
	Type       string  `json:"type"`              // "click", "move", "drag", "key", "type"
	X          float64 `json:"x,omitempty"`
	Y          float64 `json:"y,omitempty"`
	TargetX    float64 `json:"targetX,omitempty"`
	TargetY    float64 `json:"targetY,omitempty"`
	TokenID    string  `json:"tokenId,omitempty"`
	Text       string  `json:"text,omitempty"`
	Key        string  `json:"key,omitempty"`
	DurationMs int     `json:"durationMs,omitempty"`
	DelayMs    int     `json:"delayMs,omitempty"`
}

// GhostSequence is a collection of GhostActions parsed from a .ghost JSON file.
type GhostSequence struct {
	Name    string        `json:"name"`
	Actions []GhostAction `json:"actions"`
}

// DevDomController handles Ghost Protocol and chaos engineering commands.
type DevDomController struct {
	conn net.Conn
}

// NewDevDomController dials the sovereign proxy and returns a controller.
// Caller is responsible for closing the returned controller via Close().
func NewDevDomController(sockPath string) (*DevDomController, error) {
	conn, err := net.Dial("unix", sockPath)
	if err != nil {
		return nil, fmt.Errorf("sovereign proxy not detected at %s: %w", sockPath, err)
	}
	return &DevDomController{conn: conn}, nil
}

func (d *DevDomController) Close() {
	if d.conn != nil {
		d.conn.Close()
	}
}

// broadcast encodes a command as JSON and writes it to the proxy connection.
func (d *DevDomController) broadcast(cmd map[string]interface{}) error {
	return json.NewEncoder(d.conn).Encode(cmd)
}

// PlaybackSequence reads a .ghost file and streams its actions to the Node B bridge.
func (d *DevDomController) PlaybackSequence(filePath string) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read ghost file: %w", err)
	}

	var seq GhostSequence
	if err := json.Unmarshal(data, &seq); err != nil {
		return fmt.Errorf("failed to parse ghost sequence: %w", err)
	}

	fmt.Printf("📡 50V3R31GN-M4CH1N4: Initiating Ghost Sequence [%s] (%d actions)\n", seq.Name, len(seq.Actions))

	for i, action := range seq.Actions {
		fmt.Printf("  >> [%d/%d] %s\n", i+1, len(seq.Actions), action.Type)

		cmd := map[string]interface{}{
			"type":    "ghost_input",
			"payload": action,
		}
		if err := d.broadcast(cmd); err != nil {
			return fmt.Errorf("broadcast failed on action %d: %w", i+1, err)
		}

		// Inter-action delay: explicit delayMs first, then durationMs, then default 200ms.
		wait := action.DelayMs
		if wait == 0 {
			wait = action.DurationMs
		}
		if wait == 0 {
			wait = 200
		}
		time.Sleep(time.Duration(wait) * time.Millisecond)
	}

	fmt.Printf("✅ Sequence [%s] C0MPL373.\n", seq.Name)
	return nil
}

// ForceCorruption triggers a UI infiltration event via the bridge.
func (d *DevDomController) ForceCorruption(intensity float64, cType string) error {
	fmt.Printf("📡 50V3R31GN-M4CH1N4: Injecting UI Corruption [Type: %s, Intensity: %.2f]\n", cType, intensity)
	return d.broadcast(map[string]interface{}{
		"type": "corrupt_ui",
		"payload": map[string]interface{}{
			"intensity": intensity,
			"type":      cType,
		},
	})
}

// RunChaosNetwork adds synthetic network latency to a network interface via Linux tc netem.
// Pass latencyMs=0 to clear any existing netem rules.
func RunChaosNetwork(iface string, latencyMs int) error {
	if latencyMs == 0 {
		cmd := exec.Command("tc", "qdisc", "del", "dev", iface, "root")
		out, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("tc del failed: %w\n%s", err, out)
		}
		fmt.Printf("✅ Chaos Network: Latency cleared on %s.\n", iface)
		return nil
	}

	// Remove existing rule first (ignore error — rule may not exist yet).
	exec.Command("tc", "qdisc", "del", "dev", iface, "root").Run() //nolint:errcheck

	latency := strconv.Itoa(latencyMs) + "ms"
	cmd := exec.Command("tc", "qdisc", "add", "dev", iface, "root", "netem", "delay", latency)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("tc add netem failed: %w\n%s", err, out)
	}
	fmt.Printf("📡 Chaos Network: +%dms latency injected on %s.\n", latencyMs, iface)
	return nil
}
