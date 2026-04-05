package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// Black-Ice Theme constants
// Primary:    #00f3ff (cyan)
// Background: #080810 (near-black)
// Accent:     #ff003c (red for critical)
// Dim:        #1a1a2e (dark panel bg)
// White:      #e0e0e0

var (
	colorCyan   = lipgloss.Color("#00f3ff")
	colorBg     = lipgloss.Color("#080810")
	colorAccent = lipgloss.Color("#ff003c")
	colorDim    = lipgloss.Color("#1a1a2e")
	colorWhite  = lipgloss.Color("#e0e0e0")

	// Bordered pane style
	paneStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(colorCyan).
			Padding(0, 1).
			Background(colorDim)

	// Header style
	headerStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(colorCyan).
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
		barStr = lipgloss.NewStyle().Foreground(colorCyan).Render(bar)
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
	factionLine := labelStyle.Render("Faction: ") + lipgloss.NewStyle().Foreground(colorCyan).Render(npc.Faction)
	dispLine := labelStyle.Render("Stance: ") + lipgloss.NewStyle().Foreground(colorWhite).Render(npc.Disposition)

	content := strings.Join([]string{title, hpBar, spBar, factionLine, dispLine}, "\n")
	return paneStyle.Render(content)
}

// applyCRTGlow wraps text with ANSI sequences for a subtle terminal glow effect.
// Uses bold + bright cyan for the "glow" simulation.
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
			lipgloss.NewStyle().Foreground(colorCyan).Render(fmt.Sprintf("[%02d]", i+1)),
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

	// Handle simple CLI flags/args
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "belt":
			if len(os.Args) > 2 {
				switch os.Args[2] {
				case "list":
					fmt.Println(headerStyle.Render("⟨ UTILITY BELT: ACTIVE SIDECARS ⟩"))
					for _, s := range registry.List() {
						statusColor := colorCyan
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
		}
	}

	// Demo: render the Black-Ice theme
	fmt.Println(applyCRTGlow("  ◈ CRUSH CLI v1.2.0 — ASP.GM-Agent  "))
	fmt.Println(headerStyle.Render("  Night City Interface — Black-Ice Edition  "))
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
}
