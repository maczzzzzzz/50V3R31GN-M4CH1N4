package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// startMockProxy starts a mock Unix socket server that returns a hardcoded
// reason_audit response. Returns the socket path and a stop function.
func startMockProxy(t *testing.T, verdict, rationale string) (sockPath string, stop func()) {
	t.Helper()
	sockPath = filepath.Join(t.TempDir(), "mock_proxy.sock")

	ln, err := net.Listen("unix", sockPath)
	if err != nil {
		t.Fatalf("mock proxy listen: %v", err)
	}

	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			go func(c net.Conn) {
				defer c.Close()
				sc := bufio.NewScanner(c)
				if !sc.Scan() {
					return
				}
				var req clawLinkPacket
				if err := json.Unmarshal(sc.Bytes(), &req); err != nil {
					return
				}
				result := fmt.Sprintf(`{"verdict":%q,"rationale":%q}`, verdict, rationale)
				innerPayload := fmt.Sprintf(`{"id":%q,"result":%s,"error":null}`, req.TraceID, result)
				resp := clawLinkPacket{
					TraceID: req.TraceID,
					Payload: innerPayload,
				}
				b, _ := json.Marshal(resp)
				c.Write(append(b, '\n'))
			}(conn)
		}
	}()

	return sockPath, func() { ln.Close() }
}

func TestReasonAudit_ParsesGranted(t *testing.T) {
	sockPath, stop := startMockProxy(t, "GRANTED", "Action within bounds.")
	defer stop()

	orig := Cfg
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	verdict, rationale, err := reasonAudit("unlock", "door_001", "Unlock door door_001.")
	if err != nil {
		t.Fatalf("reasonAudit error: %v", err)
	}
	if verdict != "GRANTED" {
		t.Errorf("verdict = %q, want GRANTED", verdict)
	}
	if !strings.Contains(rationale, "Action within bounds") {
		t.Errorf("rationale = %q, want contains 'Action within bounds'", rationale)
	}
}

func TestReasonAudit_ParsesRejected(t *testing.T) {
	sockPath, stop := startMockProxy(t, "REJECTED", "Target not in scene.")
	defer stop()

	orig := Cfg
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	verdict, _, err := reasonAudit("unlock", "door_999", "Unlock door door_999.")
	if err != nil {
		t.Fatalf("reasonAudit error: %v", err)
	}
	if verdict != "REJECTED" {
		t.Errorf("verdict = %q, want REJECTED", verdict)
	}
}

func TestReasonAudit_ProxyNotRunning(t *testing.T) {
	orig := Cfg
	Cfg.ClawlinkSock = "/tmp/crush_nonexistent_test.sock"
	Cfg.ClawlinkTimeout = 200
	defer func() { Cfg = orig }()

	_, _, err := reasonAudit("unlock", "door_001", "ctx")
	if err == nil {
		t.Fatal("expected error when proxy not running, got nil")
	}
	if !strings.Contains(err.Error(), "proxy not running") {
		t.Errorf("error = %q, want contains 'proxy not running'", err.Error())
	}
}

func TestWSA_BuildAuditContext(t *testing.T) {
	tests := []struct {
		action   string
		targetID string
		wantSub  string
	}{
		{"unlock", "door_001", "Unlock door door_001"},
		{"dim-lights", "scene_02", "Dim lights in scene scene_02"},
		{"hack-camera", "cam_03", "Hack surveillance camera cam_03"},
		{"shut-down", "dev_04", "Shut down networked device dev_04"},
	}
	for _, tc := range tests {
		got := buildAuditContext(tc.action, tc.targetID)
		if got == "" {
			t.Errorf("buildAuditContext(%q, %q) returned empty string", tc.action, tc.targetID)
		}
		if !strings.Contains(got, tc.wantSub) {
			t.Errorf("buildAuditContext(%q, %q) = %q, want substring %q",
				tc.action, tc.targetID, got, tc.wantSub)
		}
	}
}

func TestWSA_UnknownActionReturns1(t *testing.T) {
	code := runWSA([]string{"explode", "everything"})
	if code != 1 {
		t.Errorf("unknown action: exit code = %d, want 1", code)
	}
}

func TestWSA_MissingTargetIDReturns1(t *testing.T) {
	code := runWSA([]string{"unlock"})
	if code != 1 {
		t.Errorf("missing target-id: exit code = %d, want 1", code)
	}
}

func TestWSA_NoArgsReturns1(t *testing.T) {
	code := runWSA([]string{})
	if code != 1 {
		t.Errorf("no args: exit code = %d, want 1", code)
	}
}

func TestWSA_ProxyDownReturns1(t *testing.T) {
	orig := Cfg
	Cfg.ClawlinkSock = "/tmp/crush_wsa_noexist.sock"
	Cfg.ClawlinkTimeout = 200
	defer func() { Cfg = orig }()

	code := runWSA([]string{"unlock", "door_001"})
	if code != 1 {
		t.Errorf("proxy down: exit code = %d, want 1", code)
	}
}

func TestWSA_GrantedExits0(t *testing.T) {
	sockPath, stop := startMockProxy(t, "GRANTED", "Within parameters.")
	defer stop()

	orig := Cfg
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	code := runWSA([]string{"unlock", "door_001"})
	if code != 0 {
		t.Errorf("GRANTED: exit code = %d, want 0", code)
	}
}

func TestWSA_RejectedExits2(t *testing.T) {
	sockPath, stop := startMockProxy(t, "REJECTED", "Not permitted.")
	defer stop()

	orig := Cfg
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	code := runWSA([]string{"unlock", "door_001"})
	if code != 2 {
		t.Errorf("REJECTED: exit code = %d, want 2", code)
	}
}

func TestWSA_AllActionsRecognised(t *testing.T) {
	actions := []string{"unlock", "dim-lights", "hack-camera", "shut-down"}
	for _, a := range actions {
		if got := buildAuditContext(a, "test_target"); got == "" {
			t.Errorf("buildAuditContext(%q, ...) returned empty — action not registered", a)
		}
	}
}

func TestReasonAudit_TimeoutReturnsError(t *testing.T) {
	sockPath := filepath.Join(t.TempDir(), "slow_proxy.sock")
	ln, err := net.Listen("unix", sockPath)
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer ln.Close()

	// Accept but never respond
	go func() {
		conn, _ := ln.Accept()
		if conn != nil {
			time.Sleep(5 * time.Second)
			conn.Close()
		}
	}()

	orig := Cfg
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 100 // 100ms timeout
	defer func() { Cfg = orig }()

	_, _, err = reasonAudit("unlock", "door_001", "ctx")
	if err == nil {
		t.Fatal("expected error on timeout, got nil")
	}
}
