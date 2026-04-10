package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"strings"
	"time"

	"github.com/charmbracelet/lipgloss"
)

var (
	wsaGrantedStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("#00ff87")).Bold(true)
	wsaRejectedStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("#ff003c")).Bold(true)
)

const wsaUsage = `Usage: crush wsa <action> <target-id>

Actions:
  unlock      <door-id>     Unlock a door in the current scene
  dim-lights  <scene-id>    Dim lights in a scene
  hack-camera <camera-id>   Hack a surveillance camera
  shut-down   <device-id>   Shut down a networked device
  friction    <faction-id>  Trigger friction roll for faction
`

// runWSA executes a WSA subcommand and returns an exit code:
//
//	0 = GRANTED  (TypeScript Director should call Foundry runScript)
//	1 = proxy error / bad arguments
//	2 = REJECTED (TypeScript Director must NOT call runScript)
func runWSA(args []string) int {
	if len(args) < 2 {
		fmt.Fprint(os.Stderr, wsaUsage)
		return 1
	}

	action := args[0]
	targetID := args[1]

	ctx := buildAuditContext(action, targetID)
	if ctx == "" {
		logError("[CRUSH] ERROR: unknown WSA action %q\n", action)
		fmt.Fprint(os.Stderr, wsaUsage)
		return 1
	}

	verdict, rationale, err := reasonAudit(action, targetID, ctx)
	if err != nil {
		if strings.Contains(err.Error(), "proxy not running") {
			fmt.Fprintln(os.Stderr, "[CRUSH] ERROR: proxy not running — start with 'crush proxy'")
		} else {
			logError("[CRUSH] ERROR: audit failed: %v\n", err)
		}
		return 1
	}

	short := rationale
	if len(short) > 80 {
		short = short[:77] + "..."
	}

	switch verdict {
	case "GRANTED":
		fmt.Println(wsaGrantedStyle.Render(
			fmt.Sprintf("[WSA] ACCESS GRANTED — %s %s", action, targetID),
		) + "   " + short)
		return 0
	case "REJECTED":
		fmt.Println(wsaRejectedStyle.Render(
			fmt.Sprintf("[WSA] FIREWALL REJECTION — %s %s", action, targetID),
		) + " : " + rationale)
		return 2
	default:
		logError("[CRUSH] ERROR: unexpected verdict %q\n", verdict)
		return 1
	}
}

// buildAuditContext returns the natural-language context string for the Node A
// Reasoning Audit. Returns "" for unknown actions.
func buildAuditContext(action, targetID string) string {
	switch action {
	case "unlock":
		return fmt.Sprintf("Unlock door %s in current scene. Operator-initiated via crush CLI.", targetID)
	case "dim-lights":
		return fmt.Sprintf("Dim lights in scene %s. Operator-initiated via crush CLI.", targetID)
	case "hack-camera":
		return fmt.Sprintf("Hack surveillance camera %s in current scene. Operator-initiated via crush CLI.", targetID)
	case "shut-down":
		return fmt.Sprintf("Shut down networked device %s in current scene. Operator-initiated via crush CLI.", targetID)
	default:
		return ""
	}
}

// reasonAudit sends a reason_audit RPC to the crush proxy Unix socket and
// returns the Node A verdict ("GRANTED" or "REJECTED") and rationale string.
// Returns an error wrapping "proxy not running" if the socket is unreachable.
func reasonAudit(action, targetID, auditContext string) (verdict, rationale string, err error) {
	timeout := time.Duration(Cfg.ClawlinkTimeout) * time.Millisecond

	conn, err := net.DialTimeout("unix", Cfg.ClawlinkSock, timeout)
	if err != nil {
		return "", "", fmt.Errorf("proxy not running: %w", err)
	}
	defer conn.Close()

	traceID := newTraceID()
	rpcPayload := fmt.Sprintf(
		`{"id":%q,"method":"reason_audit","params":{"action":%q,"target_id":%q,"context":%q}}`,
		traceID, action, targetID, auditContext,
	)

	pkt := clawLinkPacket{
		TraceID:  traceID,
		Payload:  rpcPayload,
		Checksum: payloadChecksum(rpcPayload),
	}
	b, _ := json.Marshal(pkt)
	if _, err := conn.Write(append(b, '\n')); err != nil {
		return "", "", fmt.Errorf("write to proxy: %w", err)
	}

	conn.SetReadDeadline(time.Now().Add(timeout))
	sc := bufio.NewScanner(conn)
	if !sc.Scan() {
		return "", "", fmt.Errorf("no response from proxy")
	}

	var respPkt clawLinkPacket
	if err := json.Unmarshal(sc.Bytes(), &respPkt); err != nil {
		return "", "", fmt.Errorf("parse proxy response: %w", err)
	}

	var rpcResp struct {
		Result json.RawMessage `json:"result"`
		Error  *string         `json:"error"`
	}
	if err := json.Unmarshal([]byte(respPkt.Payload), &rpcResp); err != nil {
		return "", "", fmt.Errorf("parse rpc envelope: %w", err)
	}
	if rpcResp.Error != nil && *rpcResp.Error != "" {
		return "", "", fmt.Errorf("Node A error: %s", *rpcResp.Error)
	}

	var auditResult struct {
		Verdict   string `json:"verdict"`
		Rationale string `json:"rationale"`
	}
	if err := json.Unmarshal(rpcResp.Result, &auditResult); err != nil {
		return "", "", fmt.Errorf("parse audit result: %w", err)
	}

	return auditResult.Verdict, auditResult.Rationale, nil
}
