package main

import (
	"encoding/json"
	"fmt"
	"os"
)

/**
 * CRUSH_PROPOSE : v3.8.8 (Autotelic Curiosity)
 * 
 * Injects an agent proposal into the VSB shared memory for Hall authorization.
 */

type AgentProposal struct {
	ID      uint32 `json:"id"`
	Origin  string `json:"origin"` // "synapse", "vesper", "oracle"
	Type    string `json:"type"`   // "OPTIMIZATION", "RECON", "SECURITY"
	Payload string `json:"payload"`
}

func ProposeCommand(args []string) {
	if len(args) < 1 {
		fmt.Println("Usage: crush propose <json_file>")
		return
	}

	data, err := os.ReadFile(args[0])
	if err != nil {
		fmt.Printf("❌ Failed to read proposal file: %v\n", err)
		return
	}

	var ap AgentProposal
	if err := json.Unmarshal(data, &ap); err != nil {
		fmt.Printf("❌ Invalid proposal JSON: %v\n", err)
		return
	}

	watcher, err := NewVsbWatcher("black_ice_state.mem")
	if err != nil {
		fmt.Printf("❌ Failed to access VSB Mmap: %v\n", err)
		return
	}

	p := watcher.GetProposal()
	p.ID = ap.ID
	if ap.Origin == "synapse" { p.Origin = 0 } else { p.Origin = 1 }
	p.ActionType = 83 // Phase 83 Efficiency Proposal
	p.Status = StatusPending
	
	// Copy payload (max 256 bytes)
	copy(p.Payload[:], []byte(ap.Payload))

	fmt.Printf(">> PROPOSAL INJECTED: [ID:%d] from %s. Awaiting Hall authorization...\n", ap.ID, ap.Origin)
}
