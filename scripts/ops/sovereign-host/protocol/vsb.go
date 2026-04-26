package protocol

import (
	"encoding/binary"
	"errors"
)

var (
	ErrInvalidPayload = errors.New("invalid payload")
)

const (
	VSB_MAGIC   = 0xC0DE
	VSB_VERSION = 0x01

	HEADER_SIZE        = 13
	INTENT_PACKET_SIZE = 302
	RESULT_PACKET_SIZE = 290
)

type PacketType uint8

const (
	PacketIntent    PacketType = 0x01
	PacketResult    PacketType = 0x02
	PacketHeartbeat PacketType = 0x03
	PacketAck       PacketType = 0x04
)

type IntentType uint8

const (
	IntentRoll          IntentType = 0x01
	IntentDamage        IntentType = 0x02
	IntentSkillCheck    IntentType = 0x03
	IntentHeal          IntentType = 0x04
	IntentFriction      IntentType = 0x05
	IntentContextUpdate IntentType = 0x0A
	IntentVocalIntent   IntentType = 0x0B
	// Host capabilities
	IntentGetProcessList IntentType = 0x80
	IntentFocusWindow    IntentType = 0x81
	IntentWriteFile      IntentType = 0x82
	IntentCaptureScreen  IntentType = 0x83
	IntentDeleteFile     IntentType = 0x84
)

type ResultStatus uint8

const (
	StatusOk      ResultStatus = 0x00
	StatusError   ResultStatus = 0x01
	StatusPending ResultStatus = 0x02
)

type SovereignHeader struct {
	Magic      uint16
	Version    uint8
	PacketType PacketType
	SequenceID uint32
	PayloadLen uint32
	Checksum   uint8
}

type IntentPacket struct {
	Header     SovereignHeader
	IntentType IntentType
	SessionID  [16]byte
	ActorID    [16]byte
	Payload    [256]byte
}

type ResultPacket struct {
	Header     SovereignHeader
	Status     ResultStatus
	SessionID  [16]byte
	ResultCode uint32
	Payload    [256]byte
}

func ComputeChecksum(buf []byte) uint8 {
	var acc uint8
	for _, b := range buf {
		acc ^= b
	}
	return acc
}

func (h *SovereignHeader) Encode(buf []byte) error {
	if len(buf) < HEADER_SIZE {
		return errors.New("buffer too small")
	}
	binary.LittleEndian.PutUint16(buf[0:2], VSB_MAGIC)
	buf[2] = VSB_VERSION
	buf[3] = uint8(h.PacketType)
	binary.LittleEndian.PutUint32(buf[4:8], h.SequenceID)
	binary.LittleEndian.PutUint32(buf[8:12], h.PayloadLen)
	buf[12] = ComputeChecksum(buf[0:12])
	return nil
}

func DecodeHeader(buf []byte) (*SovereignHeader, error) {
	if len(buf) < HEADER_SIZE {
		return nil, errors.New("buffer too small")
	}
	magic := binary.LittleEndian.Uint16(buf[0:2])
	if magic != VSB_MAGIC {
		return nil, errors.New("invalid magic")
	}
	version := buf[2]
	if version != VSB_VERSION {
		return nil, errors.New("invalid version")
	}
	expectedChecksum := ComputeChecksum(buf[0:12])
	if buf[12] != expectedChecksum {
		return nil, errors.New("invalid checksum")
	}

	return &SovereignHeader{
		Magic:      magic,
		Version:    version,
		PacketType: PacketType(buf[3]),
		SequenceID: binary.LittleEndian.Uint32(buf[4:8]),
		PayloadLen: binary.LittleEndian.Uint32(buf[8:12]),
		Checksum:   buf[12],
	}, nil
}

func (p *IntentPacket) Encode() ([]byte, error) {
	buf := make([]byte, INTENT_PACKET_SIZE)
	p.Header.PacketType = PacketIntent
	p.Header.PayloadLen = 256
	if err := p.Header.Encode(buf[0:13]); err != nil {
		return nil, err
	}
	buf[13] = uint8(p.IntentType)
	copy(buf[14:30], p.SessionID[:])
	copy(buf[30:46], p.ActorID[:])
	copy(buf[46:302], p.Payload[:])
	return buf, nil
}

func DecodeIntentPacket(buf []byte) (*IntentPacket, error) {
	if len(buf) < INTENT_PACKET_SIZE {
		return nil, errors.New("buffer too small")
	}
	header, err := DecodeHeader(buf[0:13])
	if err != nil {
		return nil, err
	}
	if header.PacketType != PacketIntent {
		return nil, errors.New("not an intent packet")
	}

	p := &IntentPacket{
		Header:     *header,
		IntentType: IntentType(buf[13]),
	}
	copy(p.SessionID[:], buf[14:30])
	copy(p.ActorID[:], buf[30:46])
	copy(p.Payload[:], buf[46:302])
	return p, nil
}

func (p *ResultPacket) Encode() ([]byte, error) {
	buf := make([]byte, RESULT_PACKET_SIZE)
	p.Header.PacketType = PacketResult
	p.Header.PayloadLen = 273 // status(1) + session(16) + resultCode(4) + payload(256) ? 
    // Wait, let's check ts implementation for payloadLen
    // ResultPacketCodec.encode(buf, 0, PacketType.Result, sequenceId, 273);
    // 273 matches.
	p.Header.PayloadLen = 273
	if err := p.Header.Encode(buf[0:13]); err != nil {
		return nil, err
	}
	buf[13] = uint8(p.Status)
	copy(buf[14:30], p.SessionID[:])
	binary.LittleEndian.PutUint32(buf[30:34], p.ResultCode)
	copy(buf[34:290], p.Payload[:])
	return buf, nil
}

func DecodeResultPacket(buf []byte) (*ResultPacket, error) {
	if len(buf) < RESULT_PACKET_SIZE {
		return nil, errors.New("buffer too small")
	}
	header, err := DecodeHeader(buf[0:13])
	if err != nil {
		return nil, err
	}
	if header.PacketType != PacketResult {
		return nil, errors.New("not a result packet")
	}

	p := &ResultPacket{
		Header:     *header,
		Status:     ResultStatus(buf[13]),
		ResultCode: binary.LittleEndian.Uint32(buf[30:34]),
	}
	copy(p.SessionID[:], buf[14:30])
	copy(p.Payload[:], buf[34:290])
	return p, nil
}
