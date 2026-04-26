package handlers

import (
	"bytes"
	"sovereign-host/fsgate"
	"sovereign-host/protocol"
)

func MakeWriteFileHandler(gate *fsgate.Gate) func(*protocol.IntentPacket) (*protocol.ResultPacket, error) {
	return func(p *protocol.IntentPacket) (*protocol.ResultPacket, error) {
		// Payload format: [path\0data]
		parts := bytes.SplitN(p.Payload[:], []byte{0}, 2)
		if len(parts) < 2 {
			return nil, protocol.ErrInvalidPayload
		}

		path := string(parts[0])
		data := parts[1]

		err := gate.WriteScratchFile(path, data)
		if err != nil {
			return nil, err
		}

		res := &protocol.ResultPacket{
			Header: protocol.SovereignHeader{
				SequenceID: p.Header.SequenceID,
			},
			Status:    protocol.StatusOk,
			SessionID: p.SessionID,
		}
		copy(res.Payload[:], "File written successfully")
		return res, nil
	}
}

func MakeDeleteFileHandler(gate *fsgate.Gate) func(*protocol.IntentPacket) (*protocol.ResultPacket, error) {
	return func(p *protocol.IntentPacket) (*protocol.ResultPacket, error) {
		// Payload format: [path] (null-terminated string)
		path := string(bytes.TrimRight(p.Payload[:], "\x00"))

		err := gate.DeleteScratchFile(path)
		if err != nil {
			return nil, err
		}

		res := &protocol.ResultPacket{
			Header: protocol.SovereignHeader{
				SequenceID: p.Header.SequenceID,
			},
			Status:    protocol.StatusOk,
			SessionID: p.SessionID,
		}
		copy(res.Payload[:], "File deleted successfully")
		return res, nil
	}
}
