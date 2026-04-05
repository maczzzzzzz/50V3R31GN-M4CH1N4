package main

import (
	"os"
	"testing"
)

func TestVsbWatcher(t *testing.T) {
	tempFile := "test_vsb.mem"
	defer os.Remove(tempFile)

	w, err := NewVsbWatcher(tempFile)
	if err != nil {
		t.Fatalf("Failed to create watcher: %v", err)
	}

	p := w.GetProposal()
	p.ID = 123
	p.Status = StatusPending
	copy(p.Payload[:], "Test Payload")

	// Read back to confirm mmap is working
	p2 := w.GetProposal()
	if p2.ID != 123 {
		t.Errorf("Expected ID 123, got %d", p2.ID)
	}

	if string(p2.Payload[:12]) != "Test Payload" {
		t.Errorf("Payload mismatch: %s", string(p2.Payload[:]))
	}

	w.SetStatus(StatusApproved)
	if p.Status != StatusApproved {
		t.Errorf("Status update failed")
	}
}
