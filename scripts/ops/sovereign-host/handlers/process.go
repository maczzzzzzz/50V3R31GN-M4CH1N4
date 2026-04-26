package handlers

import (
	"os/exec"
	"sovereign-host/protocol"
)

func GetProcessList(p *protocol.IntentPacket) (*protocol.ResultPacket, error) {
	// For Windows: tasklist /FO CSV /NH
	// For Linux (testing): ps -e
	
	cmd := exec.Command("tasklist", "/FO", "CSV", "/NH")
	output, err := cmd.Output()
	if err != nil {
		// Fallback for non-Windows environments to allow testing
		cmd = exec.Command("ps", "-e")
		output, _ = cmd.Output()
	}

	res := &protocol.ResultPacket{
		Header: protocol.SovereignHeader{
			SequenceID: p.Header.SequenceID,
		},
		Status:    protocol.StatusOk,
		SessionID: p.SessionID,
	}
	
	// Truncate output if it exceeds payload size (256 bytes)
	// In a real scenario, we might want a streaming protocol or multi-packet response,
	// but for Phase 81 we stick to the 256-byte VSB payload.
	copy(res.Payload[:], output)
	
	return res, nil
}
