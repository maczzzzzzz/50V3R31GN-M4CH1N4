package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"time"
)

// GhostAction represents a single physical event in a sequence
type GhostAction struct {
	Type       string  `json:"type"`       // "click", "move", "drag", "type"
	X          float64 `json:"x,omitempty"`
	Y          float64 `json:"y,omitempty"`
	TargetX    float64 `json:"targetX,omitempty"`
	TargetY    float64 `json:"targetY,omitempty"`
	Text       string  `json:"text,omitempty"`
	DurationMs int     `json:"durationMs,omitempty"`
}

// GhostSequence is a collection of actions to be played back
type GhostSequence struct {
	Name    string        `json:"name"`
	Actions []GhostAction `json:"actions"`
}

// DevDomController handles high-level environment dominance commands
type DevDomController struct {
	Proxy *SovereignProxy
}

func NewDevDomController(p *SovereignProxy) *DevDomController {
	return &DevDomController{Proxy: p}
}

// PlaybackSequence reads a .ghost file and dispatches actions to the Node B bridge
func (d *DevDomController) PlaybackSequence(filePath string) error {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read ghost file: %w", err)
	}

	var seq GhostSequence
	if err := json.Unmarshal(data, &seq); err != nil {
		return fmt.Errorf("failed to parse ghost sequence: %w", err)
	}

	fmt.Printf("📡 50V3R31GN-M4CH1N4: Initiating Ghost Sequence [%s] (%d actions)\n", seq.Name, len(seq.Actions))

	for i, action := range seq.Actions {
		fmt.Printf("  >> [%d/%d] Action: %s\n", i+1, len(seq.Actions), action.Type)
		
		// Map the Go struct to a Bridge command
		cmd := map[string]interface{}{
			"type": "ghost_input",
			"payload": action,
		}
		
		// Broadcast to all bridge listeners (FoundryAdapter)
		d.Proxy.Broadcast(cmd)

		// Wait for action duration if specified, plus jitter
		wait := action.DurationMs
		if wait == 0 {
			wait = 200
		}
		time.Sleep(time.Duration(wait) * time.Millisecond)
	}

	fmt.Printf("✅ Sequence [%s] C0MPL373.\n", seq.Name)
	return nil
}

// ForceCorruption triggers a UI infiltration event from the CLI
func (d *DevDomController) ForceCorruption(intensity float64, cType string) {
	fmt.Printf("📡 50V3R31GN-M4CH1N4: Injecting UI Corruption [Type: %s, Intensity: %.2f]\n", cType, intensity)
	cmd := map[string]interface{}{
		"type": "corrupt_ui",
		"payload": map[string]interface{}{
			"intensity": intensity,
			"type":      cType,
		},
	}
	d.Proxy.Broadcast(cmd)
}
