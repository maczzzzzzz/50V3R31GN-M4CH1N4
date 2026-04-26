package handlers

import (
	"bytes"
	"sovereign-host/protocol"
	"strings"
)

// FocusWindow brings a window to front by title.
// Payload contains the window title.
func FocusWindow(p *protocol.IntentPacket) (*protocol.ResultPacket, error) {
	title := string(bytes.TrimRight(p.Payload[:], "\x00"))
	title = strings.TrimSpace(title)

	err := focusWindow(title)

	res := &protocol.ResultPacket{
		Header: protocol.SovereignHeader{
			SequenceID: p.Header.SequenceID,
		},
		Status:    protocol.StatusOk,
		SessionID: p.SessionID,
	}

	if err != nil {
		res.Status = protocol.StatusError
		copy(res.Payload[:], err.Error())
	} else {
		copy(res.Payload[:], "Window focused: "+title)
	}

	return res, nil
}
