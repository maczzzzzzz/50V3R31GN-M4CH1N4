package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/charmbracelet/lipgloss"
)

/**
 * ◈ CRUSH_BRIDGE : Clean BASE
 *
 * Physical bridge for the Sovereign OS.
 * Manages sidecar orchestration and hardware-level intents.
 */

var (
	colorSovereign = lipgloss.Color("#376374")
	colorBg        = lipgloss.Color("#1A282F")
	colorAccent    = lipgloss.Color("#836A46")
	colorDim       = lipgloss.Color("#404040")
	colorWhite     = lipgloss.Color("#AFAB9C")
	colorRed       = lipgloss.Color("#6F5B3E")

	paneStyle = lipgloss.NewStyle().
			Border(lipgloss.NormalBorder()).
			BorderForeground(colorSovereign).
			Padding(0, 1).
			Background(colorBg)

	headerStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(colorSovereign).
			Background(colorBg).
			Padding(0, 2)

	labelStyle = lipgloss.NewStyle().
			Foreground(colorDim).
			Italic(true)
)

func applySovereignGlow(text string) string {
	return "\033[1;93m" + text + "\033[0m"
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
		watcher.Watch(func(p *Proposal) {
			choice, err := RunAuthPane(p)
			if err == nil {
				watcher.SetStatus(choice)
				fmt.Printf("\n[VSB] Proposal %d marked as %v\n", p.ID, choice)
			}
		})
	}

	// Register core sidecars
	registry.Register(&Sidecar{
		Name:       "atlas",
		BinaryPath: "./crates/sidecar-atlas/target/release/sidecar-atlas",
		VramWeight: 0.5,
		State:      StateOffline,
	})

	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "start":
			mode := "full"
			headless := true
			
			for _, arg := range os.Args[2:] {
				if arg == "--lite" {
					mode = "lite"
				} else if arg == "--full" {
					mode = "full"
				} else if arg == "--interactive" {
					headless = false
				}
			}
			
			if headless {
				fmt.Printf("::/CRUSH_ARTERY : Igniting headless sidecar [%s mode]...\n", mode)
			} else {
				fmt.Printf("Initiating 50V3R31GN-M4CH1N4 Deck Igniter in %s mode...\n", mode)
			}

			key := os.Getenv("SOVEREIGN_KEY")
			if key != "" {
				fmt.Println("🔓 Auto-Unsealing runtime documentation...")
				openDirectory("../docs/", key)
				openDirectory("../data/vault/", key)
				openDirectory("../akashik_guides/", key)
				
				openDirectory("../CLAUDE.md.png", key)
				openDirectory("../GEMINI.md.png", key)
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
				cmdPath = filepath.Join(cmd, "deck-igniter-cli")
			}
			
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
				fmt.Println("👑 SOVEREIGN MODE: ON (Verification Bypassed)")
			} else {
				fmt.Println("⚖️  SOVEREIGN MODE: OFF (Artery Verification Enforced)")
			}
			return

		case "proxy":
			ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
			defer cancel()
			if err := runProxy(ctx); err != nil {
				fmt.Printf("[CRUSH] proxy error: %v\n", err)
				os.Exit(1)
			}
			return

		case "wsa":
			os.Exit(runWSA(os.Args[2:]))

		case "shut-down":
			fmt.Println(paneStyle.Render("!! EMERGENCY SHUTDOWN INITIATED !!"))
			_ = syscall.Kill(-1, syscall.SIGKILL)
			os.Exit(0)

		case "hack":
			os.Exit(runHack(os.Args[2:]))

		case "scan":
			os.Exit(runScan(os.Args[2:]))

		case "intent":
			os.Exit(runIntent(os.Args[2:]))

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

	fmt.Println(applySovereignGlow("  ◈ 50V3R31GN-M4CH1N4 // CRU5H v3.8.23  "))
	fmt.Println(headerStyle.Render("  :/50V3R31GN-05 // CLEAN-B453-1N73RF4C3  "))
	fmt.Println()
}
