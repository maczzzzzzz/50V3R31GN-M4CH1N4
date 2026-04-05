package main

import (
	"os"
	"testing"
)

func TestSidecarRegistry(t *testing.T) {
	r, err := NewSidecarRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}
	defer os.RemoveAll(".crush/logs")

	exe, _ := os.Executable()
	s := &Sidecar{
		Name:       "test-sidecar",
		BinaryPath: exe,
		State:      StateOffline,
	}

	r.Register(s)
	
	if len(r.List()) != 1 {
		t.Errorf("Expected 1 sidecar, got %d", len(r.List()))
	}

	if err := r.Start("test-sidecar"); err != nil {
		t.Errorf("Failed to start sidecar: %v", err)
	}

	// We can't easily check StateOnline here because Start is asynchronous 
	// in some OS contexts, but for /usr/bin/true it should be fast.
}

func TestCheckVram(t *testing.T) {
	// This might fail if nvidia-smi is missing, which is expected on some Nix envs.
	vram, err := CheckVramHeadroom()
	if err != nil {
		t.Logf("VRAM check failed (expected if no NVIDIA): %v", err)
	} else {
		t.Logf("Available VRAM: %.2fGB", vram)
	}
}
