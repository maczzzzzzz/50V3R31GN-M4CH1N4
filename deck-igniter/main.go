package main

import (
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// ── Black-Ice Theme ────────────────────────────────────────────────────────────

var (
	colorRed    = lipgloss.Color("#ff003c")
	colorBg     = lipgloss.Color("#080810")
	colorDim    = lipgloss.Color("#1a1a2e")
	colorYellow = lipgloss.Color("#ffaa00")
	colorWhite  = lipgloss.Color("#e0e0e0")
	colorGray   = lipgloss.Color("#444466")

	headerStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(colorRed).
			Background(colorBg).
			Padding(0, 2)

	selectedStyle = lipgloss.NewStyle().
			Background(colorDim).
			Foreground(colorRed)

	dimStyle = lipgloss.NewStyle().
			Foreground(colorGray)

	errorStyle = lipgloss.NewStyle().
			Foreground(colorRed).
			Bold(true)

	okStyle = lipgloss.NewStyle().
		Foreground(colorRed)

	warnStyle = lipgloss.NewStyle().
			Foreground(colorYellow)

	tableHeaderStyle = lipgloss.NewStyle().
				Foreground(colorRed).
				Bold(true).
				Underline(true)

	paneStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(colorRed).
			Padding(0, 1).
			Background(colorBg)
)

// ── Component Types ────────────────────────────────────────────────────────────

// ComponentState represents the lifecycle state of a supervised process.
type ComponentState int

const (
	StateIdle     ComponentState = iota // not yet started
	StateStarting                       // boot sequence in progress
	StateRunning                        // healthy and responsive
	StateError                          // probe failure or crash
	StateStopped                        // explicitly stopped by operator
)

func (s ComponentState) String() string {
	switch s {
	case StateIdle:
		return "IDLE"
	case StateStarting:
		return "STARTING"
	case StateRunning:
		return "RUNNING"
	case StateError:
		return "ERROR"
	case StateStopped:
		return "STOPPED"
	default:
		return "UNKNOWN"
	}
}

func (s ComponentState) Render() string {
	switch s {
	case StateRunning:
		return okStyle.Render("● RUNNING")
	case StateStarting:
		return warnStyle.Render("◌ STARTING")
	case StateError:
		return errorStyle.Render("✗ ERROR")
	case StateStopped:
		return dimStyle.Render("○ STOPPED")
	default:
		return dimStyle.Render("- IDLE")
	}
}

// Layer categorises where a component runs.
type Layer int

const (
	LayerWindows Layer = iota // Foundry VTT via WSL interop
	LayerWSL                  // Director / Sidecars on Node B
	LayerRemote               // Node A over SSH
)

func (l Layer) String() string {
	switch l {
	case LayerWindows:
		return "WIN"
	case LayerWSL:
		return "WSL"
	case LayerRemote:
		return "NODE-A"
	default:
		return "???"
	}
}

// MaxRestarts is the ceiling before the Igniter gives up auto-recovery.
const MaxRestarts = 3

// Component tracks a supervised process in the 50V3R31GN-M4CH1N4 stack.
type Component struct {
	Name      string
	Layer     Layer
	State     ComponentState
	PID       int           // local PID (0 if remote or not started)
	StartedAt time.Time     // zero value means never started
	Uptime    time.Duration // refreshed by heartbeat ticker
	Restarts  int           // auto-restart counter
	LastError string        // most recent error message
}

// uptimeStr formats the uptime for display; returns "—" before first start.
func (c *Component) uptimeStr() string {
	if c.StartedAt.IsZero() {
		return "—"
	}
	d := c.Uptime
	if d < time.Minute {
		return fmt.Sprintf("%ds", int(d.Seconds()))
	}
	if d < time.Hour {
		return fmt.Sprintf("%dm%02ds", int(d.Minutes()), int(d.Seconds())%60)
	}
	return fmt.Sprintf("%dh%02dm", int(d.Hours()), int(d.Minutes())%60)
}

// ── Bubble Tea Messages ───────────────────────────────────────────────────────

// tickMsg is sent every 2 seconds by the heartbeat ticker.
type tickMsg time.Time

// stateUpdateMsg carries an async state transition for a named component.
type stateUpdateMsg struct {
	name  string
	state ComponentState
	pid   int
	err   string
}

// logMsg appends a line to the event feed.
type logMsg struct {
	text string
}

// probeResultMsg carries the result of an async health probe.
type probeResultMsg struct {
	name    string
	healthy bool
	err     string
}

// bootCompleteMsg signals the ignition sequence has dispatched all commands.
type bootCompleteMsg struct{}

// ── Bubble Tea Model ──────────────────────────────────────────────────────────

const maxLogLines = 5

// Model is the root Bubble Tea application model for the DECK-IGNITER.
type Model struct {
	components []*Component
	selected   int    // currently focused row in the status table
	logs       []string // ring-buffer capped at maxLogLines
	width      int
	height     int
	booting    bool // true while sequential ctrl+i boot is in progress
	ghostMode  bool // true if started via './deck-igniter-cli ghost'
}

// ── Initialization ─────────────────────────────────────────────────────────────

func initialModel() Model {
	mode := os.Getenv("IGNITER_MODE")
	if mode == "" {
		mode = "full"
	}

	ghost := false
	if len(os.Args) > 1 && os.Args[1] == "ghost" {
		ghost = true
	}

	osComponents := []*Component{
		{Name: "obsidian", Layer: LayerWindows},
		{Name: "node-b-vision", Layer: LayerWindows},
		{Name: "crush-proxy", Layer: LayerWSL},
		{Name: "director", Layer: LayerWSL},
		{Name: "hermes-tui", Layer: LayerWSL},
		{Name: "sidecar-atlas", Layer: LayerWSL},
		{Name: "sidecar-cyberdeck", Layer: LayerWSL},
		{Name: "sidecar-netrunning", Layer: LayerWSL},
		{Name: "dashboard-bridge", Layer: LayerWSL},
		{Name: "pretext-hud-web", Layer: LayerWSL},
		{Name: "vault-sync", Layer: LayerWSL},
		{Name: "llama-server", Layer: LayerRemote},
		{Name: "zeroclaw", Layer: LayerRemote},
		{Name: "mooncake-synapse", Layer: LayerRemote},
		{Name: "oracle-logic", Layer: LayerRemote},
		{Name: "node-d-command", Layer: LayerRemote},
	}

	cprComponents := []*Component{
		{Name: "foundry-vtt", Layer: LayerWindows},
	}

	var activeComponents []*Component
	if mode == "lite" {
		for _, c := range osComponents {
			if c.Name != "vault-sync" && c.Name != "shadow-dashboard" {
				activeComponents = append(activeComponents, c)
			}
		}
	} else if mode == "cpr" {
		activeComponents = append(osComponents, cprComponents...)
	} else {
		activeComponents = osComponents
	}

	return Model{
		components: activeComponents,
		logs:       []string{fmt.Sprintf("Initialized in %s mode", mode)},
		ghostMode:  ghost,
	}
}

func (m Model) Init() tea.Cmd {
	cmds := []tea.Cmd{tickCmd()}
	if os.Getenv("AUTO_IGNITE") == "1" || m.ghostMode {
		cmds = append(cmds, tea.Sequence(
			logEvent("GHOST BOOT PROTOCOL ACTIVATED"),
			bootSequenceCmd(m.components, m.ghostMode),
		))
	}
	return tea.Batch(cmds...)
}

// ── Commands ──────────────────────────────────────────────────────────────────

func tickCmd() tea.Cmd {
	return tea.Tick(2*time.Second, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func logEvent(text string) tea.Cmd {
	return func() tea.Msg {
		return logMsg{text: fmt.Sprintf("[%s] %s", time.Now().Format("15:04:05"), text)}
	}
}

// ── Update ─────────────────────────────────────────────────────────────────────

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height

	case tickMsg:
		// Refresh uptime for running components and re-arm the ticker.
		for _, c := range m.components {
			if c.State == StateRunning && !c.StartedAt.IsZero() {
				c.Uptime = time.Since(c.StartedAt)
			}
		}
		return m, tea.Batch(tickCmd(), probeAllCmd(m.components))

	case bootCompleteMsg:
		m.booting = false

	case stateUpdateMsg:
		for _, c := range m.components {
			if c.Name == msg.name {
				c.State = msg.state
				c.LastError = msg.err
				if msg.pid != 0 {
					c.PID = msg.pid
				}
				if msg.state == StateRunning && c.StartedAt.IsZero() {
					c.StartedAt = time.Now()
				}
			}
		}

	case probeResultMsg:
		// Starting → Running promotion.
		promoteIfHealthy(&m, msg)

		// Running → Error detection with auto-restart.
		for _, c := range m.components {
			if c.Name == msg.name && c.State == StateRunning && !msg.healthy {
				c.State = StateError
				c.LastError = msg.err
				if c.Restarts < MaxRestarts {
					c.Restarts++
					return m, tea.Batch(
						logEvent(fmt.Sprintf("AUTO-RESTART #%d: %s", c.Restarts, c.Name)),
						restartComponent(c),
					)
				}
				return m, logEvent(fmt.Sprintf("MAX RESTARTS REACHED: %s — operator intervention required", c.Name))
			}
		}

	case logMsg:
		if os.Getenv("HEADLESS") == "1" {
			fmt.Printf("[LOG] %s\n", msg.text)
		}
		m.logs = append(m.logs, msg.text)
		if len(m.logs) > maxLogLines {
			m.logs = m.logs[len(m.logs)-maxLogLines:]
		}

	case tea.KeyMsg:
		switch {
		case msg.Type == tea.KeyCtrlI:
			if !m.booting {
				m.booting = true
				return m, tea.Batch(
					logEvent("IGNITION SEQUENCE INITIATED"),
					bootSequenceCmd(m.components, m.ghostMode),
				)
			}

		case msg.Type == tea.KeyCtrlP:
			return m, tea.Batch(
				logEvent("⚡ INITIATING SYSTEM-WIDE PURGE..."),
				performPurge(),
			)

		case msg.String() == "r":
			if m.selected >= 0 && m.selected < len(m.components) {
				c := m.components[m.selected]
				return m, tea.Batch(
					logEvent(fmt.Sprintf("RESET: %s", c.Name)),
					restartComponent(c),
				)
			}

		case msg.String() == "k":
			if m.selected >= 0 && m.selected < len(m.components) {
				c := m.components[m.selected]
				c.State = StateStopped
				return m, tea.Batch(
					logEvent(fmt.Sprintf("KILLED: %s", c.Name)),
					killComponent(c),
				)
			}

		case msg.Type == tea.KeyUp:
			if m.selected > 0 {
				m.selected--
			}

		case msg.Type == tea.KeyDown:
			if m.selected < len(m.components)-1 {
				m.selected++
			}

		case msg.String() == "Q": // shift+q
			return m, tea.Sequence(
				logEvent("GRACEFUL SHUTDOWN INITIATED"),
				shutdownCmd(m.components),
			)
		}
	}

	return m, nil
}

// ── View ───────────────────────────────────────────────────────────────────────

var igniterBanner = `
 ██╗ ██████╗ ███╗   ██╗██╗████████╗███████╗██████╗
 ██║██╔════╝ ████╗  ██║██║╚══██╔══╝██╔════╝██╔══██╗
 ██║██║  ███╗██╔██╗ ██║██║   ██║   █████╗  ██████╔╝
 ██║██║   ██║██║╚██╗██║██║   ██║   ██╔══╝  ██╔══██╗
 ██║╚██████╔╝██║ ╚████║██║   ██║   ███████╗██║  ██║
 ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝`

func (m Model) View() string {
	var sb strings.Builder

	// Banner
	banner := lipgloss.NewStyle().Foreground(colorRed).Render(igniterBanner)
	sb.WriteString(banner)
	sb.WriteString("\n")
	sb.WriteString(dimStyle.Render("  50V3R31GN-M4CH1N4 v2.2.0 — Master Supervisor & Boot Sequencer"))
	sb.WriteString("\n\n")

	// Status table
	sb.WriteString(m.renderStatusTable())
	sb.WriteString("\n")

	// Log feed
	sb.WriteString(m.renderLogFeed())
	sb.WriteString("\n")

	// Hotkey legend
	sb.WriteString(m.renderLegend())

	return sb.String()
}

func (m Model) renderStatusTable() string {
	colName := 20
	colLayer := 8
	colState := 16
	colUptime := 10
	colPID := 10

	header := fmt.Sprintf(" %-*s %-*s %-*s %-*s %-*s",
		colName, tableHeaderStyle.Render("COMPONENT"),
		colLayer, tableHeaderStyle.Render("LAYER"),
		colState, tableHeaderStyle.Render("STATE"),
		colUptime, tableHeaderStyle.Render("UPTIME"),
		colPID, tableHeaderStyle.Render("PID/IP"),
	)

	rows := []string{header}
	for i, c := range m.components {
		pidStr := "—"
		if c.PID != 0 {
			pidStr = fmt.Sprintf("%d", c.PID)
		}
		if c.Layer == LayerRemote {
			pidStr = "SSH"
		}

		line := fmt.Sprintf(" %-*s %-*s %-*s %-*s %-*s",
			colName, c.Name,
			colLayer, dimStyle.Render(c.Layer.String()),
			colState, c.State.Render(),
			colUptime, c.uptimeStr(),
			colPID, pidStr,
		)

		if i == m.selected {
			line = selectedStyle.Render(line)
		}
		rows = append(rows, line)
	}

	return paneStyle.Render(strings.Join(rows, "\n"))
}

func (m Model) renderLogFeed() string {
	title := tableHeaderStyle.Render("EVENT LOG")
	lines := []string{title}
	if len(m.logs) == 0 {
		lines = append(lines, dimStyle.Render("  — no events —"))
	} else {
		for _, l := range m.logs {
			lines = append(lines, "  "+dimStyle.Render(l))
		}
	}
	return paneStyle.Render(strings.Join(lines, "\n"))
}

func (m Model) renderLegend() string {
	keys := []string{
		okStyle.Render("ctrl+i") + " ignite all",
		okStyle.Render("ctrl+p") + " purge zombies",
		okStyle.Render("r") + " reset selected",
		okStyle.Render("k") + " kill selected",
		okStyle.Render("↑/↓") + " navigate",
		errorStyle.Render("shift+q") + " shutdown",
	}
	return dimStyle.Render("  " + strings.Join(keys, "   "))
}

// probeAllCmd, bootSequenceCmd, restartComponent, killComponent, and
// shutdownCmd are implemented in prober.go (Task 5), launcher.go (Task 2),
// and ssh.go (Task 3).

// ── Entry Point ───────────────────────────────────────────────────────────────

func main() {
	LoadConfig()

	opts := []tea.ProgramOption{
		tea.WithAltScreen(),
		tea.WithMouseCellMotion(),
	}

	// If running in the background without a TTY (e.g. from a script), disable the UI
	if os.Getenv("HEADLESS") == "1" {
		fmt.Printf("://NUCLEUS-ORCH357R470R // 5747U5: 4C71V3 [H34DL355]\n")
		fmt.Printf("://M0D3: %s\n", os.Getenv("IGNITER_MODE"))
		os.Stdout.Sync()
		pr, _ := io.Pipe()
		opts = []tea.ProgramOption{
			tea.WithOutput(os.Stdout),
			tea.WithInput(pr),
			tea.WithoutRenderer(),
		}
	}

	p := tea.NewProgram(
		initialModel(),
		opts...
	)

	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "IGNITER: fatal error: %v\n", err)
		os.Exit(1)
	}
}
