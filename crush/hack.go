package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"time"

	"github.com/charmbracelet/lipgloss"
)

var (
	hackGrantedStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("#00ff87")).Bold(true)
	hackRejectedStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("#ff003c")).Bold(true)
	hackInfoStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("#00f3ff"))
)

const hackUsage = `Usage: crush hack <action> <target-id>

Actions:
  unlock      <door-id>     Unlock a door in the current scene
  dim-lights  <scene-id>    Dim lights in a scene
  hack-camera <camera-id>   Hack a surveillance camera
  shut-down   <device-id>   Shut down a networked device

Example:
  crush hack unlock door-42
  crush hack dim-lights scene-01
`

const scanUsage = `Usage: crush scan [target-type]

target-type (optional): objectives | hazards | cover | all (default: all)

Example:
  crush scan
  crush scan objectives
`

const cropScanUsage = `Usage: crush crop-scan <x> <y> [size]

Example:
  crush crop-scan 1200 850
  crush crop-scan 500 500 256
`

// IntentPayload is the JSON message sent to Node B Director.
type IntentPayload struct {
	Command  string `json:"command"`
	Action   string `json:"action,omitempty"`
	Target   string `json:"target,omitempty"`
	ScanType string `json:"scan_type,omitempty"`
	X        float64 `json:"x,omitempty"`
	Y        float64 `json:"y,omitempty"`
	Size     int     `json:"size,omitempty"`
}

// runHack sends a hack intent to Node B via the crush proxy socket.
// Returns an exit code: 0=GRANTED, 1=error, 2=REJECTED.
func runHack(args []string) int {
	if len(args) < 2 {
		fmt.Fprint(os.Stderr, hackUsage)
		return 1
	}

	action := args[0]
	target := args[1]

	validActions := map[string]bool{
		"unlock": true, "dim-lights": true, "hack-camera": true, "shut-down": true,
	}
	if !validActions[action] {
		logError("[HACK] unknown action %q\n%s", action, hackUsage)
		return 1
	}

	payload := IntentPayload{
		Command: "hack",
		Action:  action,
		Target:  target,
	}

	return sendIntent(payload)
}

// runScan sends a scan intent to Node B and prints discovered targets.
// Returns 0 on success, 1 on error.
func runScan(args []string) int {
	scanType := "all"
	if len(args) > 0 {
		switch args[0] {
		case "objectives", "hazards", "cover", "all":
			scanType = args[0]
		default:
			logError("[SCAN] unknown target-type %q\n%s", args[0], scanUsage)
			return 1
		}
	}

	payload := IntentPayload{
		Command:  "scan",
		ScanType: scanType,
	}

	return sendIntent(payload)
}

// runCropScan sends a crop-scan intent to Node B.
func runCropScan(args []string) int {
	if len(args) < 2 {
		fmt.Fprint(os.Stderr, cropScanUsage)
		return 1
	}

	var x, y float64
	size := 512

	if _, err := fmt.Sscanf(args[0], "%f", &x); err != nil {
		logError("[SCAN] invalid x coordinate: %v\n", err)
		return 1
	}
	if _, err := fmt.Sscanf(args[1], "%f", &y); err != nil {
		logError("[SCAN] invalid y coordinate: %v\n", err)
		return 1
	}
	if len(args) > 2 {
		if _, err := fmt.Sscanf(args[2], "%d", &size); err != nil {
			logError("[SCAN] invalid size: %v\n", err)
			return 1
		}
	}

	payload := IntentPayload{
		Command: "crop-scan",
		X:       x,
		Y:       y,
		Size:    size,
	}

	return sendIntent(payload)
}

// sendIntent connects to the crush proxy Unix socket, writes the JSON intent,
// reads the response, and prints the result.
func sendIntent(payload IntentPayload) int {
	data, err := json.Marshal(payload)
	if err != nil {
		logError("[CRUSH] marshal error: %v\n", err)
		return 1
	}

	timeout := time.Duration(Cfg.ClawlinkTimeout) * time.Millisecond
	conn, err := net.DialTimeout("unix", Cfg.ClawlinkSock, timeout)
	if err != nil {
		logError("[CRUSH] proxy unavailable (%s): %v\n", Cfg.ClawlinkSock, err)
		return 1
	}
	defer conn.Close()

	_ = conn.SetDeadline(time.Now().Add(timeout))

	// Write newline-delimited JSON frame
	if _, err := fmt.Fprintf(conn, "%s\n", data); err != nil {
		logError("[CRUSH] write error: %v\n", err)
		return 1
	}

	// Read response frame
	scanner := bufio.NewScanner(conn)
	if !scanner.Scan() {
		if err := scanner.Err(); err != nil {
			logError("[CRUSH] read error: %v\n", err)
		} else {
			fmt.Fprintln(os.Stderr, "[CRUSH] proxy closed connection without response")
		}
		return 1
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(scanner.Bytes(), &resp); err != nil {
		// Non-JSON response — print raw
		fmt.Println(scanner.Text())
		return 0
	}

	status, _ := resp["status"].(string)
	message, _ := resp["message"].(string)

	switch status {
	case "GRANTED":
		fmt.Println(hackGrantedStyle.Render("ACCESS GRANTED") + " " + message)
		return 0
	case "REJECTED":
		fmt.Println(hackRejectedStyle.Render("FIREWALL REJECTION") + " " + message)
		return 2
	default:
		fmt.Println(hackInfoStyle.Render(scanner.Text()))
		return 0
	}
}
