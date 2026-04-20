package protocol

import (
	"encoding/binary"
	"fmt"
)

// Sovereign Binary Protocol (Go Port)
// Alignment: Bit-identical to sovereign-sdk (Rust/C)

const (
	VSB_MAGIC   uint16 = 0xC0DE
	VSB_VERSION uint8  = 0x01
)

type PacketType uint8

const (
	PacketIntent    PacketType = 0x01
	PacketResult    PacketType = 0x02
	PacketHeartbeat PacketType = 0x03
	PacketAck       PacketType = 0x04
	PacketTelemetry PacketType = 0x05
)

// SovereignHeader is exactly 13 bytes.
type SovereignHeader struct {
	Magic      uint16
	Version    uint8
	PacketType uint8
	SequenceID uint32
	PayloadLen uint32
	Checksum   uint8
}

// Encode serializes the header to a 13-byte buffer.
func (h *SovereignHeader) Encode() []byte {
	buf := make([]byte, 13)
	binary.LittleEndian.PutUint16(buf[0:2], h.Magic)
	buf[2] = h.Version
	buf[3] = h.PacketType
	binary.LittleEndian.PutUint32(buf[4:8], h.SequenceID)
	binary.LittleEndian.PutUint32(buf[8:12], h.PayloadLen)
	buf[12] = h.ComputeChecksum(buf[:12])
	return buf
}

// ComputeChecksum XORs bytes [0..12].
func (h *SovereignHeader) ComputeChecksum(data []byte) uint8 {
	var cs uint8
	for _, b := range data {
		cs ^= b
	}
	return cs
}

// IntentPacket is exactly 302 bytes.
type IntentPacket struct {
	Header     SovereignHeader
	IntentType uint8
	SessionID  [16]byte
	ActorID    [16]byte
	Payload    [256]byte
}

func (p *IntentPacket) Encode() []byte {
	buf := make([]byte, 302)
	copy(buf[0:13], p.Header.Encode())
	buf[13] = p.IntentType
	copy(buf[14:30], p.SessionID[:])
	copy(buf[30:46], p.ActorID[:])
	copy(buf[46:302], p.Payload[:])
	return buf
}

// DecodeIntent decodes a 302-byte buffer into an IntentPacket.
func DecodeIntent(buf []byte) (*IntentPacket, error) {
	if len(buf) < 302 {
		return nil, fmt.Errorf("buffer too short: %d", len(buf))
	}
	hdr := SovereignHeader{
		Magic:      binary.LittleEndian.Uint16(buf[0:2]),
		Version:    buf[2],
		PacketType: buf[3],
		SequenceID: binary.LittleEndian.Uint32(buf[4:8]),
		PayloadLen: binary.LittleEndian.Uint32(buf[8:12]),
		Checksum:   buf[12],
	}
	
	if hdr.Magic != VSB_MAGIC {
		return nil, fmt.Errorf("invalid magic: %x", hdr.Magic)
	}

	p := &IntentPacket{
		Header:     hdr,
		IntentType: buf[13],
	}
	copy(p.SessionID[:], buf[14:30])
	copy(p.ActorID[:], buf[30:46])
	copy(p.Payload[:], buf[46:302])
	
	return p, nil
}
