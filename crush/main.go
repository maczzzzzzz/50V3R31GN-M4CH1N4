package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/charmbracelet/lipgloss"
)

// Black-Ice Theme constants
// Primary:    #ff003c (red)
// Background: #080810 (near-black)
// Accent:     #ff003c (red for critical)
// Dim:        #1a1a2e (dark panel bg)
// White:      #e0e0e0

var (
	colorRed = lipgloss.Color("#ff003c")
	colorBg     = lipgloss.Color("#080810")
	colorAccent = lipgloss.Color("#ff003c")
	colorDim    = lipgloss.Color("#1a1a2e")
	colorWhite  = lipgloss.Color("#e0e0e0")

	// Bordered pane style
	paneStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(colorRed).
			Padding(0, 1).
			Background(colorDim)

	// Header style
	headerStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(colorRed).
			Background(colorBg).
			Padding(0, 2)

	// Label style (dimmer)
	labelStyle = lipgloss.NewStyle().
			Foreground(colorDim).
			Italic(true)

	// Critical value style (low HP warning)
	critStyle = lipgloss.NewStyle().
			Foreground(colorAccent).
			Bold(true)
)

// renderVitalityBar renders a Cyberpunk RED style ASCII HP/SP bar.
// width is the total bar width (default 20).
// Example: [████████░░░░░░░░░░░░] 8/20
func renderVitalityBar(current, max, width int, label string) string {
	if max <= 0 {
		max = 1
	}
	if current < 0 {
		current = 0
	}
	if current > max {
		current = max
	}

	filled := (current * width) / max
	empty := width - filled

	bar := "[" + strings.Repeat("█", filled) + strings.Repeat("░", empty) + "]"
	ratio := fmt.Sprintf("%d/%d", current, max)

	// Color bar based on health percentage
	pct := float64(current) / float64(max)
	var barStr string
	switch {
	case pct <= 0.25:
		barStr = critStyle.Render(bar)
	case pct <= 0.50:
		barStr = lipgloss.NewStyle().Foreground(lipgloss.Color("#ffaa00")).Render(bar)
	default:
		barStr = lipgloss.NewStyle().Foreground(colorRed).Render(bar)
	}

	return labelStyle.Render(label+": ") + barStr + " " + lipgloss.NewStyle().Foreground(colorWhite).Render(ratio)
}

// NPC represents a Cyberpunk RED non-player character with vitality stats.
type NPC struct {
	Name        string
	HP          int
	MaxHP       int
	SP          int
	MaxSP       int
	Faction     string
	Disposition string
}

func renderNPCCard(npc NPC) string {
	title := headerStyle.Render("◈ " + npc.Name)
	hpBar := renderVitalityBar(npc.HP, npc.MaxHP, 20, "HP")
	spBar := renderVitalityBar(npc.SP, npc.MaxSP, 20, "SP")
	factionLine := labelStyle.Render("Faction: ") + lipgloss.NewStyle().Foreground(colorRed).Render(npc.Faction)
	dispLine := labelStyle.Render("Stance: ") + lipgloss.NewStyle().Foreground(colorWhite).Render(npc.Disposition)

	content := strings.Join([]string{title, hpBar, spBar, factionLine, dispLine}, "\n")
	return paneStyle.Render(content)
}

// applyCRTGlow wraps text with ANSI sequences for a subtle terminal glow effect.
// Uses bold + bright red for the "glow" simulation.
func applyCRTGlow(text string) string {
	return "\033[1;96m" + text + "\033[0m"
}

// SearchResult holds a search query and its results for display.
type SearchResult struct {
	Query   string
	Results []string
}

func renderSearchPane(sr SearchResult) string {
	header := headerStyle.Render("⟨ RKG SEARCH: " + sr.Query + " ⟩")
	var lines []string
	lines = append(lines, header)
	for i, r := range sr.Results {
		lines = append(lines, fmt.Sprintf("  %s %s",
			lipgloss.NewStyle().Foreground(colorRed).Render(fmt.Sprintf("[%02d]", i+1)),
			lipgloss.NewStyle().Foreground(colorWhite).Render(r),
		))
	}
	return paneStyle.Render(strings.Join(lines, "\n"))
}

func main() {
	registry, err := NewSidecarRegistry()
	if err != nil {
		fmt.Printf("Error initializing registry: %v\n", err)
		os.Exit(1)
	}

	// Initialize VSB Watcher
	watcher, err := NewVsbWatcher("black_ice_state.mem")
	if err != nil {
		fmt.Printf("Warning: VSB Mmap failed: %v\n", err)
	} else {
		// Run watcher in background
		watcher.Watch(func(p *Proposal) {
			// Trigger Authorization Pane
			choice, err := RunAuthPane(p)
			if err == nil {
				watcher.SetStatus(choice)
				fmt.Printf("\n[VSB] Proposal %d marked as %v\n", p.ID, choice)
			}
		})
	}

	// Register default sidecars
	registry.Register(&Sidecar{
		Name:       "atlas",
		BinaryPath: "./sidecar-atlas/target/release/sidecar-atlas",
		VramWeight: 0.5,
		State:      StateOffline,
	})

	// Top-level subcommand dispatch
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "start":
			mode := "full"
			headless := false
			
			// Simple flag parsing
			for _, arg := range os.Args[2:] {
				if arg == "--lite" {
					mode = "lite"
				} else if arg == "--full" {
					mode = "full"
				} else if arg == "--headless" {
					headless = true
				}
			}
			
			fmt.Printf("Initiating 50V3R31GN-M4CH1N4 Deck Igniter in %s mode", mode)
			if headless {
				fmt.Printf(" (HEADLESS)")
			}
			fmt.Println("...")

			// Auto-Unseal for Runtime
			key := os.Getenv("SOVEREIGN_KEY")
			if key != "" {
				fmt.Println("🔓 Auto-Unsealing runtime documentation...")
				openDirectory("../docs/", key)
				openDirectory("../data/vault/", key)
				openDirectory("../akashik_guides/", key)
				
				// Unseal root-level directive shards
				openDirectory("../CLAUDE.md.png", key)
				openDirectory("../GEMINI.md.png", key)
				openDirectory("../RED_RULES.md.png", key)
			} else {
				fmt.Println("⚠️  SOVEREIGN_KEY not found. Skipping auto-unseal.")
			}

			cmd := os.Getenv("PROJECT_ROOT")
			if cmd == "" {
				cwd, _ := os.Getwd()
				cmd = cwd
			}
			cmdPath := filepath.Join(cmd, "deck-igniter/deck-igniter")
			if _, err := os.Stat(cmdPath); err != nil {
				// Fallback to deck-igniter-cli in current directory
				cmdPath = filepath.Join(cmd, "deck-igniter-cli")
			}
			
			// Try to run the igniter directly
			execCmd := exec.Command(cmdPath)
			execCmd.Env = append(os.Environ(), "IGNITER_MODE="+mode)
			if headless {
				execCmd.Env = append(execCmd.Env, "HEADLESS=1", "AUTO_IGNITE=1")
			}
			execCmd.Stdin = os.Stdin
			execCmd.Stdout = os.Stdout
			execCmd.Stderr = os.Stderr
			
			if err := execCmd.Run(); err != nil {
				fmt.Printf("Error starting deck-igniter: %v\n", err)
				os.Exit(1)
			}
			return

		case "sovereign-mode":
			if len(os.Args) < 3 {
				fmt.Println("Usage: crush sovereign-mode [on|off]")
				return
			}
			on := os.Args[2] == "on"
			
			watcher, err := NewVsbWatcher("black_ice_state.mem")
			if err != nil {
				fmt.Printf("Error accessing Mmap: %v\n", err)
				os.Exit(1)
			}
			watcher.ToggleSovereignMode(on)
			if on {
				fmt.Println("👑 SOVEREIGN MODE: ON (Rules Oracle Bypassed)")
			} else {
				fmt.Println("⚖️  SOVEREIGN MODE: OFF (Physics Constitution Enforced)")
			}
			return

		case "radar":
			if len(os.Args) < 4 || os.Args[2] != "--public" {
				fmt.Println("Usage: crush radar --public [on|off]")
				return
			}
			on := os.Args[3] == "on"
			
			watcher, err := NewVsbWatcher("black_ice_state.mem")
			if err != nil {
				fmt.Printf("Error accessing Mmap: %v\n", err)
				os.Exit(1)
			}
			watcher.WriteRadar(true, 128, on) // Default heat to 128 for testing
			fmt.Printf("Tactical Radar Public: %v\n", on)
			return

		case "proxy":
			ctx, cancel := signal.NotifyContext(
				context.Background(), syscall.SIGINT, syscall.SIGTERM,
			)
			defer cancel()
			if err := runProxy(ctx); err != nil {
				logError("[CRUSH] proxy error: %v\n", err)
				os.Exit(1)
			}
			return

		case "wsa":
			os.Exit(runWSA(os.Args[2:]))

		case "shut-down":
			fmt.Println(critStyle.Render("!! EMERGENCY SHUTDOWN INITIATED !!"))
			fmt.Println(critStyle.Render("Purging all Node B renderer and sidecar processes..."))
			
			// Kill WSL processes
			_ = syscall.Kill(-1, syscall.SIGKILL) // Kill entire process group
			
			// Try to also send intent to Director for graceful-ish shutdown if possible
			runHack([]string{"shut-down", "node-b"})
			
			os.Exit(0)

		case "hack":
			os.Exit(runHack(os.Args[2:]))

		case "scan":
			os.Exit(runScan(os.Args[2:]))

		case "intent":
			os.Exit(runIntent(os.Args[2:]))

		case "crop-scan":
			os.Exit(runCropScan(os.Args[2:]))

		case "forge":
			os.Exit(runForge(os.Args[2:]))

		case "vault":
			if len(os.Args) < 3 {
				fmt.Println("Usage: crush vault [seal|open] <target_path>")
				return
			}
			key := os.Getenv("SOVEREIGN_KEY")
			if key == "" {
				fmt.Println("Error: SOVEREIGN_KEY not found in environment.")
				return
			}
			os.Exit(runVault(os.Args[2:], key))

		case "belt":
			if len(os.Args) > 2 {
				switch os.Args[2] {
				case "list":
					fmt.Println(headerStyle.Render("⟨ UTILITY BELT: ACTIVE SIDECARS ⟩"))
					for _, s := range registry.List() {
						statusColor := colorRed
						if s.State == StateOffline {
							statusColor = colorDim
						}
						fmt.Printf("  %s %s [%s] (Weight: %.1fGB)\n",
							lipgloss.NewStyle().Foreground(statusColor).Render("◈"),
							s.Name, s.State, s.VramWeight)
					}
					vram, _ := CheckVramHeadroom()
					fmt.Printf("\n  VRAM Headroom: %.2fGB\n", vram)
					return
				case "start":
					if len(os.Args) > 3 {
						name := os.Args[3]
						if err := registry.Start(name); err != nil {
							fmt.Printf("Error starting %s: %v\n", name, err)
						} else {
							fmt.Printf("Sidecar %s launched successfully.\n", name)
						}
						return
					}
				}
			}
		case "thought-stream":
			runThoughtStream()
			return

		case "terminal":
			if err := runTerminal(); err != nil {
				fmt.Printf("[TERMINAL] fatal: %v\n", err)
				os.Exit(1)
			}
			return

		case "devdom":
			if len(os.Args) < 3 {
				fmt.Println("Usage: crush devdom [corrupt-ui|ghost-play <file.ghost>]")
				return
			}

			dc, err := NewDevDomController(Cfg.ClawlinkSock)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				os.Exit(1)
			}
			defer dc.Close()

			switch os.Args[2] {
			case "corrupt-ui":
				intensity := 0.5
				cType := "leet"
				if len(os.Args) > 3 {
					fmt.Sscanf(os.Args[3], "%f", &intensity)
				}
				if len(os.Args) > 4 {
					cType = os.Args[4]
				}
				if err := dc.ForceCorruption(intensity, cType); err != nil {
					fmt.Printf("Error: %v\n", err)
					os.Exit(1)
				}

			case "ghost-play":
				if len(os.Args) < 4 {
					fmt.Println("Usage: crush devdom ghost-play <file.ghost>")
					os.Exit(1)
				}
				if err := dc.PlaybackSequence(os.Args[3]); err != nil {
					fmt.Printf("Error: %v\n", err)
					os.Exit(1)
				}
			}
			return

		case "nucleus":
			startNucleusServer()
			return

		case "dashboard-bridge":
			if err := runDashboardBridge(); err != nil {
				fmt.Printf("[BRIDGE] fatal: %v\n", err)
				os.Exit(1)
			}
			return

		case "chaos":
			if len(os.Args) < 3 || os.Args[2] != "network" {
				fmt.Println("Usage: crush chaos network --latency <ms> [--iface <iface>]")
				os.Exit(1)
			}
			var latencyMs int
			iface := "eth0"
			args := os.Args[3:]
			for i := 0; i < len(args); i++ {
				switch args[i] {
				case "--latency":
					if i+1 < len(args) {
						fmt.Sscanf(args[i+1], "%d", &latencyMs)
						i++
					}
				case "--iface":
					if i+1 < len(args) {
						iface = args[i+1]
						i++
					}
				}
			}
			if err := RunChaosNetwork(iface, latencyMs); err != nil {
				fmt.Printf("Error: %v\n", err)
				os.Exit(1)
			}
			return

		case "meeting":
			os.Exit(runMeeting(os.Args[2:]))

		case "reconstruct":
			Reconstruct()
			return

		case "profile":
			if len(os.Args) >= 3 && os.Args[2] == "watch" {
				manifestPath := "../SOVEREIGN-IDENTITY.md"
				fmt.Printf("◈ [ARTERY] Identity Watcher armed: %s\n", manifestPath)
				StartIdentityWatcher(manifestPath)
				sigCh := make(chan os.Signal, 1)
				signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
				<-sigCh
				fmt.Println("◈ [ARTERY] Identity Watcher stopped.")
			} else {
				if err := runProfileSwitch(os.Args[2:]); err != nil {
					fmt.Printf("Error: %v\n", err)
					os.Exit(1)
				}
			}
			return
		}
	}

	// Demo: render the 50V3R31GN-M4CH1N4 theme
	fmt.Println(applyCRTGlow("  ◈ 50V3R31GN-M4CH1N4 // CRU5H v3.8.0  "))
	fmt.Println(headerStyle.Render("  :/N16H7-C17Y-1N73RF4C3 // 50V3R31GN-H16HW4Y  "))
	fmt.Println()

	// Demo NPC cards
	npcs := []NPC{
		{Name: "Vido", HP: 32, MaxHP: 40, SP: 7, MaxSP: 11, Faction: "Maelstrom", Disposition: "hostile"},
		{Name: "Rogue", HP: 40, MaxHP: 40, SP: 11, MaxSP: 11, Faction: "Afterlife", Disposition: "neutral"},
		{Name: "V (Critical)", HP: 4, MaxHP: 40, SP: 2, MaxSP: 11, Faction: "Solo", Disposition: "friendly"},
	}

	for _, npc := range npcs {
		fmt.Println(renderNPCCard(npc))
		fmt.Println()
	}

	// Demo search result
	sr := SearchResult{
		Query: "DV Pistol close range",
		Results: []string{
			"DV 13 — Pistol, close range (CPRED p.148)",
			"DV 15 — Pistol, medium range (CPRED p.148)",
			"REF + Handgun + 1d10 vs DV",
		},
	}
	fmt.Println(renderSearchPane(sr))

	// Demo: Thought Stream panel
	thoughtLines := []string{
		"<think> Analyzing tactical position... </think>",
		"<think> Vido is at 40% HP — escalate threat. </think>",
		"Recommend: Suppressive fire from cover, 2 AP.",
	}
	var tsLines []string
	tsLines = append(tsLines, headerStyle.Render("⟨ THOUGHT STREAM ⟩"))
	for _, l := range thoughtLines {
		tsLines = append(tsLines, lipgloss.NewStyle().Foreground(colorRed).Italic(true).Render("  "+l))
	}
	fmt.Println(paneStyle.Render(strings.Join(tsLines, "\n")))
}

func runThoughtStream() {
	conn, err := net.Dial("unix", Cfg.ClawlinkSock)
	if err != nil {
		fmt.Printf("Failed to connect to proxy: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close()

	fmt.Println(headerStyle.Render("⟨ INCOMING THOUGHT STREAM ⟩"))
	fmt.Println(lipgloss.NewStyle().Foreground(colorDim).Italic(true).Render("  (Press Ctrl+C to disconnect)"))

	sc := bufio.NewScanner(conn)
	for sc.Scan() {
		var pkt struct {
			Type  string `json:"type"`
			Token string `json:"token"`
		}
		if err := json.Unmarshal(sc.Bytes(), &pkt); err != nil {
			continue
		}
		if pkt.Type == "token" {
			fmt.Print(lipgloss.NewStyle().Foreground(colorRed).Italic(true).Render(pkt.Token))
		}
	}
}

func runTerminal() error {
	conn, err := net.Dial("unix", Cfg.ClawlinkSock)
	if err != nil {
		return fmt.Errorf("connect to proxy: %w", err)
	}
	defer conn.Close()

	fmt.Println(applyCRTGlow("  ◈ 50V3R31GN-M4CH1N4 // IN73R4C71V3_73RM1N4L  "))
	fmt.Println(headerStyle.Render("  :/DIR3C7-L1NK // N0D3_B [12B_BR41N]  "))
	fmt.Println(lipgloss.NewStyle().Foreground(colorDim).Italic(true).Render("  (Type 'exit' to quit, commands start with /)\n"))

	// Background: Read tokens from Node B
	go func() {
		sc := bufio.NewScanner(conn)
		for sc.Scan() {
			var pkt struct {
				Type  string `json:"type"`
				Token string `json:"token"`
			}
			if err := json.Unmarshal(sc.Bytes(), &pkt); err != nil {
				continue
			}
			if pkt.Type == "token" {
				fmt.Print(lipgloss.NewStyle().Foreground(colorRed).Italic(true).Render(pkt.Token))
			}
		}
	}()

	// Main loop: Strategist Input
	reader := bufio.NewReader(os.Stdin)
	prompt := lipgloss.NewStyle().Foreground(colorRed).Bold(true).Render("STRATEGIST> ")

	for {
		fmt.Print(prompt)
		input, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		input = strings.TrimSpace(input)
		if input == "" {
			continue
		}
		if input == "exit" || input == "quit" {
			break
		}

		// Wrap input in an intent packet
		payload := map[string]interface{}{
			"command": "intent",
			"query":   input,
		}
		
		// If starts with /, treat as raw command
		if strings.HasPrefix(input, "/") {
			parts := strings.SplitN(input[1:], " ", 2)
			payload["command"] = parts[0]
			if len(parts) > 1 {
				payload["args"] = parts[1]
			}
		}

		packet := clawLinkPacket{
			TraceID: newTraceID(),
			Type:    "intent",
		}
		jsonPayload, _ := json.Marshal(payload)
		packet.Payload = string(jsonPayload)

		data, _ := json.Marshal(packet)
		_, _ = conn.Write(append(data, '\n'))
		
		// Small sleep to avoid prompt interleaving with immediate tokens
		time.Sleep(100 * time.Millisecond)
	}

	return nil
}
