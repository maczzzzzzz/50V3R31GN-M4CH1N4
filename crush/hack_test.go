package main

import (
	"encoding/json"
	"net"
	"os"
	"path/filepath"
	"testing"
)

// startMockHackProxy starts a Unix socket server that echoes a fixed JSON response.
// Returns the socket path and a cleanup function.
func startMockHackProxy(t *testing.T, response map[string]interface{}) string {
	t.Helper()
	sockPath := filepath.Join(t.TempDir(), "hack_test.sock")
	ln, err := net.Listen("unix", sockPath)
	if err != nil {
		t.Fatalf("listen: %v", err)
	}

	go func() {
		conn, err := ln.Accept()
		if err != nil {
			return
		}
		defer conn.Close()
		defer ln.Close()

		// Read one line (the intent payload) — discard it
		buf := make([]byte, 4096)
		conn.Read(buf) //nolint:errcheck

		// Write the response
		data, _ := json.Marshal(response)
		conn.Write(append(data, '\n')) //nolint:errcheck
	}()

	return sockPath
}

func TestRunScan_AllTargetType(t *testing.T) {
	sock := startMockHackProxy(t, map[string]interface{}{
		"status":  "GRANTED",
		"message": "3 targets acquired",
	})
	orig := Cfg.ClawlinkSock
	Cfg.ClawlinkSock = sock
	defer func() { Cfg.ClawlinkSock = orig }()

	code := runScan([]string{"all"})
	if code != 0 {
		t.Errorf("expected exit 0, got %d", code)
	}
}

func TestRunScan_InvalidType(t *testing.T) {
	code := runScan([]string{"unknown-type"})
	if code != 1 {
		t.Errorf("expected exit 1 for invalid type, got %d", code)
	}
}

func TestRunScan_NoArgs_DefaultsToAll(t *testing.T) {
	sock := startMockHackProxy(t, map[string]interface{}{
		"status":  "GRANTED",
		"message": "scan complete",
	})
	orig := Cfg.ClawlinkSock
	Cfg.ClawlinkSock = sock
	defer func() { Cfg.ClawlinkSock = orig }()

	code := runScan([]string{})
	if code != 0 {
		t.Errorf("expected exit 0 with no args, got %d", code)
	}
}

func TestRunHack_MissingArgs(t *testing.T) {
	code := runHack([]string{"unlock"}) // missing target
	if code != 1 {
		t.Errorf("expected exit 1 for missing target, got %d", code)
	}
}

func TestRunHack_InvalidAction(t *testing.T) {
	code := runHack([]string{"explode", "door-99"})
	if code != 1 {
		t.Errorf("expected exit 1 for invalid action, got %d", code)
	}
}

func TestRunHack_Granted(t *testing.T) {
	sock := startMockHackProxy(t, map[string]interface{}{
		"status":  "GRANTED",
		"message": "door unlocked",
	})
	orig := Cfg.ClawlinkSock
	Cfg.ClawlinkSock = sock
	defer func() { Cfg.ClawlinkSock = orig }()

	code := runHack([]string{"unlock", "door-42"})
	if code != 0 {
		t.Errorf("expected exit 0 (GRANTED), got %d", code)
	}
}

func TestRunHack_Rejected(t *testing.T) {
	sock := startMockHackProxy(t, map[string]interface{}{
		"status":  "REJECTED",
		"message": "firewall blocked",
	})
	orig := Cfg.ClawlinkSock
	Cfg.ClawlinkSock = sock
	defer func() { Cfg.ClawlinkSock = orig }()

	code := runHack([]string{"dim-lights", "scene-01"})
	if code != 2 {
		t.Errorf("expected exit 2 (REJECTED), got %d", code)
	}
}

func TestRunHack_ProxyUnavailable(t *testing.T) {
	orig := Cfg.ClawlinkSock
	Cfg.ClawlinkSock = "/tmp/nonexistent_crush_test.sock"
	defer func() { Cfg.ClawlinkSock = orig }()

	// Redirect stderr to suppress noise
	devNull, _ := os.Open(os.DevNull)
	oldStderr := os.Stderr
	os.Stderr = devNull
	defer func() { os.Stderr = oldStderr; devNull.Close() }()

	code := runHack([]string{"hack-camera", "cam-07"})
	if code != 1 {
		t.Errorf("expected exit 1 when proxy unavailable, got %d", code)
	}
}

func TestIntentPayload_MarshalHack(t *testing.T) {
	p := IntentPayload{Command: "hack", Action: "unlock", Target: "door-1"}
	data, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var out map[string]string
	if err := json.Unmarshal(data, &out); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if out["command"] != "hack" {
		t.Errorf("command=%q want hack", out["command"])
	}
	if out["action"] != "unlock" {
		t.Errorf("action=%q want unlock", out["action"])
	}
	if out["target"] != "door-1" {
		t.Errorf("target=%q want door-1", out["target"])
	}
}

func TestIntentPayload_MarshalScan(t *testing.T) {
	p := IntentPayload{Command: "scan", ScanType: "objectives"}
	data, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var out map[string]string
	if err := json.Unmarshal(data, &out); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if out["command"] != "scan" {
		t.Errorf("command=%q want scan", out["command"])
	}
	if out["scan_type"] != "objectives" {
		t.Errorf("scan_type=%q want objectives", out["scan_type"])
	}
}
