package protocol

import (
	"bytes"
	"testing"
)

func TestHeaderCodec(t *testing.T) {
	h := SovereignHeader{
		PacketType: PacketIntent,
		SequenceID: 42,
		PayloadLen: 256,
	}

	buf := make([]byte, HEADER_SIZE)
	err := h.Encode(buf)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	decoded, err := DecodeHeader(buf)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	if decoded.Magic != VSB_MAGIC {
		t.Errorf("Expected magic %x, got %x", VSB_MAGIC, decoded.Magic)
	}
	if decoded.SequenceID != 42 {
		t.Errorf("Expected sequence 42, got %d", decoded.SequenceID)
	}
	if decoded.PacketType != PacketIntent {
		t.Errorf("Expected type %v, got %v", PacketIntent, decoded.PacketType)
	}
}

func TestIntentPacketCodec(t *testing.T) {
	session := [16]byte{0xAB, 0xCD}
	actor := [16]byte{0xEF, 0x01}
	payload := [256]byte{'H', 'e', 'l', 'l', 'o'}

	p := IntentPacket{
		Header: SovereignHeader{
			SequenceID: 123,
		},
		IntentType: IntentRoll,
		SessionID:  session,
		ActorID:    actor,
		Payload:    payload,
	}

	buf, err := p.Encode()
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	decoded, err := DecodeIntentPacket(buf)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	if decoded.Header.SequenceID != 123 {
		t.Errorf("Expected sequence 123, got %d", decoded.Header.SequenceID)
	}
	if decoded.IntentType != IntentRoll {
		t.Errorf("Expected intent type %v, got %v", IntentRoll, decoded.IntentType)
	}
	if !bytes.Equal(decoded.SessionID[:], session[:]) {
		t.Errorf("SessionID mismatch")
	}
	if !bytes.Equal(decoded.Payload[:], payload[:]) {
		t.Errorf("Payload mismatch")
	}
}

func TestResultPacketCodec(t *testing.T) {
	session := [16]byte{0x12, 0x34}
	payload := [256]byte{'W', 'o', 'r', 'l', 'd'}

	p := ResultPacket{
		Header: SovereignHeader{
			SequenceID: 456,
		},
		Status:     StatusOk,
		SessionID:  session,
		ResultCode: 200,
		Payload:    payload,
	}

	buf, err := p.Encode()
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	decoded, err := DecodeResultPacket(buf)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	if decoded.Header.SequenceID != 456 {
		t.Errorf("Expected sequence 456, got %d", decoded.Header.SequenceID)
	}
	if decoded.Status != StatusOk {
		t.Errorf("Expected status %v, got %v", StatusOk, decoded.Status)
	}
	if decoded.ResultCode != 200 {
		t.Errorf("Expected result code 200, got %d", decoded.ResultCode)
	}
	if !bytes.Equal(decoded.Payload[:], payload[:]) {
		t.Errorf("Payload mismatch")
	}
}
