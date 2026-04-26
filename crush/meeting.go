package main

// meeting.go — Phase 80, Task 1.2
//
// Implements `crush meeting` subcommand for the Sovereign Hall Artery.
// Meetings are stored as thought-fragment vaults under data/meetings/<trace_id>/.
//
// Subcommands:
//   call <trace_id>   — Force a Hall meeting for a given trace ID
//   status            — List active meetings and participating agents

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/charmbracelet/lipgloss"
)

const meetingsDir = "data/meetings"

// MeetingManifest is the JSON index written at data/meetings/<trace_id>/manifest.json
type MeetingManifest struct {
	TraceID   string   `json:"trace_id"`
	CalledAt  string   `json:"called_at"`
	CalledBy  string   `json:"called_by"`
	Status    string   `json:"status"` // "open" | "resolved"
	Agents    []string `json:"agents"`
}

// runMeeting dispatches crush meeting subcommands. Returns exit code.
func runMeeting(args []string) int {
	if len(args) == 0 {
		printMeetingUsage()
		return 1
	}

	switch args[0] {
	case "call":
		return meetingCall(args[1:])
	case "status":
		return meetingStatus()
	default:
		fmt.Fprintf(os.Stderr, "[HALL] Unknown subcommand %q\n", args[0])
		printMeetingUsage()
		return 1
	}
}

func printMeetingUsage() {
	fmt.Fprintln(os.Stderr, `Usage: crush meeting <subcommand>

Subcommands:
  call <trace_id>   Force a Sovereign Hall meeting for the given trace ID
  status            List active meetings and participating agents
`)
}

// meetingCall forces a Hall meeting for the given trace_id.
// Creates data/meetings/<trace_id>/manifest.json and an empty .thought stub.
func meetingCall(args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "[HALL] ERROR: trace_id required. Usage: crush meeting call <trace_id>")
		return 1
	}

	traceID := sanitizeTraceID(args[0])
	if traceID == "" {
		fmt.Fprintln(os.Stderr, "[HALL] ERROR: invalid trace_id (only alphanumeric, -, _ allowed)")
		return 1
	}

	meetDir := filepath.Join(meetingsDir, traceID)
	if err := os.MkdirAll(meetDir, 0o755); err != nil {
		fmt.Fprintf(os.Stderr, "[HALL] ERROR: cannot create meeting dir: %v\n", err)
		return 1
	}

	manifest := MeetingManifest{
		TraceID:  traceID,
		CalledAt: time.Now().UTC().Format(time.RFC3339),
		CalledBy: "crush:meeting:call",
		Status:   "open",
		Agents:   []string{},
	}

	manifestPath := filepath.Join(meetDir, "manifest.json")
	data, _ := json.MarshalIndent(manifest, "", "  ")
	if err := os.WriteFile(manifestPath, data, 0o644); err != nil {
		fmt.Fprintf(os.Stderr, "[HALL] ERROR: cannot write manifest: %v\n", err)
		return 1
	}

	// Stub thought fragment for the Strategist
	stubPath := filepath.Join(meetDir, "strategist.thought")
	stub := fmt.Sprintf(
		"## THOUGHT_FRAGMENT : strategist\n- **Assumed Context:** trace_id=%s\n- **Failed Approach:** (fill in)\n- **Proposed Resolution:** (fill in)\n- **Confidence Score:** 0.0\n",
		traceID,
	)
	_ = os.WriteFile(stubPath, []byte(stub), 0o644)

	// Phase 85: Engrave in Logseq
	_ = LogseqEngraveMeeting(traceID, "Operator-initiated call")

	fmt.Println(headerStyle.Render("◈ SOVEREIGN_HALL_CALL"))
	fmt.Printf("  trace_id : %s\n", traceID)
	fmt.Printf("  vault    : %s\n", meetDir)
	fmt.Printf("  status   : open\n")
	fmt.Printf("  manifest : %s\n", manifestPath)
	return 0
}

// meetingStatus lists all open meetings with their participating agents.
func meetingStatus() int {
	entries, err := os.ReadDir(meetingsDir)
	if err != nil {
		if os.IsNotExist(err) {
			fmt.Println(headerStyle.Render("◈ SOVEREIGN_HALL: no meetings found"))
			return 0
		}
		fmt.Fprintf(os.Stderr, "[HALL] ERROR: %v\n", err)
		return 1
	}

	type summaryRow struct {
		traceID  string
		calledAt string
		status   string
		agents   int
	}

	var rows []summaryRow
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		manifestPath := filepath.Join(meetingsDir, e.Name(), "manifest.json")
		raw, err := os.ReadFile(manifestPath)
		if err != nil {
			continue
		}
		var m MeetingManifest
		if err := json.Unmarshal(raw, &m); err != nil {
			continue
		}
		rows = append(rows, summaryRow{
			traceID:  m.TraceID,
			calledAt: m.CalledAt,
			status:   m.Status,
			agents:   len(m.Agents),
		})
	}

	if len(rows) == 0 {
		fmt.Println(headerStyle.Render("◈ SOVEREIGN_HALL: no meetings found"))
		return 0
	}

	// Sort by calledAt descending
	sort.Slice(rows, func(i, j int) bool {
		return rows[i].calledAt > rows[j].calledAt
	})

	fmt.Println(headerStyle.Render("◈ SOVEREIGN_HALL: ACTIVE MEETINGS"))
	fmt.Println()
	for _, r := range rows {
		statusColor := colorRed
		if r.status == "resolved" {
			statusColor = lipgloss.Color("#00ff87")
		}
		fmt.Printf("  %s  %s  [agents: %d]  called: %s\n",
			lipgloss.NewStyle().Foreground(statusColor).Bold(true).Render("◈"),
			lipgloss.NewStyle().Foreground(colorWhite).Render(r.traceID),
			r.agents,
			lipgloss.NewStyle().Foreground(colorDim).Italic(true).Render(r.calledAt),
		)
	}
	return 0
}

// sanitizeTraceID allows only alphanumeric, dash, and underscore characters.
// Returns empty string if the input is invalid.
func sanitizeTraceID(raw string) string {
	if raw == "" || len(raw) > 128 {
		return ""
	}
	for _, c := range raw {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_') {
			return ""
		}
	}
	return raw
}

// EmitSovereignHallCall writes a MANDATORY_HALL_CALL marker for the given trace ID.
// Called by HealerProtocol (via a side-effect file) or directly.
// Returns the path to the created manifest.
func EmitSovereignHallCall(traceID string, reason string) (string, error) {
	safe := sanitizeTraceID(traceID)
	if safe == "" {
		safe = "unknown-" + strings.ReplaceAll(time.Now().UTC().Format("20060102T150405"), ":", "")
	}

	meetDir := filepath.Join(meetingsDir, safe)
	if err := os.MkdirAll(meetDir, 0o755); err != nil {
		return "", fmt.Errorf("EmitSovereignHallCall mkdir: %w", err)
	}

	manifest := MeetingManifest{
		TraceID:  safe,
		CalledAt: time.Now().UTC().Format(time.RFC3339),
		CalledBy: "healer:3-failure-gate",
		Status:   "open",
		Agents:   []string{},
	}

	manifestPath := filepath.Join(meetDir, "manifest.json")
	data, _ := json.MarshalIndent(manifest, "", "  ")
	if err := os.WriteFile(manifestPath, data, 0o644); err != nil {
		return "", fmt.Errorf("EmitSovereignHallCall write: %w", err)
	}

	// Write reason as a system.thought fragment
	stub := fmt.Sprintf(
		"## THOUGHT_FRAGMENT : healer:system\n- **Assumed Context:** 3-failure threshold crossed\n- **Failed Approach:** %s\n- **Proposed Resolution:** Awaiting agent fragments\n- **Confidence Score:** 0.0\n",
		reason,
	)
	_ = os.WriteFile(filepath.Join(meetDir, "healer.thought"), []byte(stub), 0o644)

	// Phase 85: Engrave in Logseq
	_ = LogseqEngraveMeeting(safe, reason)

	return manifestPath, nil
}
