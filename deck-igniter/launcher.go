package main

// launcher.go — Execution layer for all three orchestration tiers.
//
// Layer 1: Windows (Foundry VTT) — WSL interop via cmd.exe
// Layer 2: WSL   (Director + Sidecars) — nix develop --command
// Layer 3: Remote (Node A) — SSH (implemented in ssh.go / Task 3)

import (
	"fmt"
	"os"
	"os/exec"
	"sync"
	"syscall"
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

// ── Process Registry ──────────────────────────────────────────────────────────
// Stores live *exec.Cmd handles keyed by component name so that kill/restart
// can find and terminate processes without storing mutable state in the
// Bubble Tea model (which is value-copied on every Update).

var (
	procRegistry   = make(map[string]*exec.Cmd)
	procRegistryMu sync.Mutex
)

func registerProc(name string, cmd *exec.Cmd) {
	procRegistryMu.Lock()
	defer procRegistryMu.Unlock()
	procRegistry[name] = cmd
}

func killProc(name string) error {
	procRegistryMu.Lock()
	cmd, ok := procRegistry[name]
	delete(procRegistry, name)
	procRegistryMu.Unlock()
	if !ok || cmd == nil || cmd.Process == nil {
		return nil
	}
	// Send SIGTERM first; SIGKILL if it won't die.
	if err := cmd.Process.Signal(syscall.SIGTERM); err != nil {
		_ = cmd.Process.Kill()
	}
	return nil
}

// ── Project Root ───────────────────────────────────────────────────────────────

func projectRoot() string {
	if root := os.Getenv("PROJECT_ROOT"); root != "" {
		return root
	}
	// Fallback: walk up from the binary location.
	dir, err := os.Getwd()
	if err != nil {
		return "/home/nixos/50v3r31gn-m4ch1n4"
	}
	return dir
}

// ── Layer 1: Windows / Foundry VTT ────────────────────────────────────────────

const (
	foundryExe  = `D:\FoundryVTT\Foundry Virtual Tabletop\Foundry Virtual Tabletop.exe`
	foundryPort = 9222
	pixtralBat  = `D:\llama.cpp\start_pixtral.bat`
	cmdExe      = "/mnt/c/Windows/System32/cmd.exe"
)

// launchFoundry fires Foundry VTT via WSL interop cmd.exe.
// The process is detached (Foundry manages its own window); we track state
// by polling the CDP port (localhost:9222) rather than the PID.
func launchFoundry(c *Component) tea.Cmd {
	return func() tea.Msg {
		// Use cmd.exe /C start to launch a detached Windows process.
		startArg := fmt.Sprintf(`start "" "%s" --remote-debugging-port=%d`, foundryExe, foundryPort)
		cmd := exec.Command(cmdExe, "/C", startArg)
		// SysProcAttr: don't inherit WSL signals.
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("cmd.exe interop failed: %v", err),
			}
		}
		// Foundry is detached — we don't track its PID, just mark as Starting.
		// The heartbeat prober (Task 5) will transition it to Running once
		// localhost:9222 responds.
		return stateUpdateMsg{name: c.Name, state: StateStarting}
	}
}

// launchPixtral fires the Pixtral Windows Native Server via WSL interop cmd.exe.
func launchPixtral(c *Component) tea.Cmd {
	return func() tea.Msg {
		startArg := fmt.Sprintf(`start "" "%s"`, pixtralBat)
		cmd := exec.Command(cmdExe, "/C", startArg)
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("cmd.exe interop failed: %v", err),
			}
		}
		return stateUpdateMsg{name: c.Name, state: StateStarting}
	}
}

// ── Layer 2: WSL — Nix-Native Processes ──────────────────────────────────────

// nixCmd builds an exec.Cmd for `nix develop --command <args...>` rooted at dir.
func nixCmd(dir string, args ...string) *exec.Cmd {
	cmdArgs := append([]string{"develop", "--command"}, args...)
	cmd := exec.Command("nix", cmdArgs...)
	cmd.Dir = dir
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	return cmd
}

// launchDirector starts the Node B orchestrator via `nix develop --command pnpm start`.
func launchDirector(c *Component) tea.Cmd {
	return func() tea.Msg {
		root := projectRoot()
		cmd := nixCmd(root, "pnpm", "start")

		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("director launch failed: %v", err),
			}
		}
		registerProc(c.Name, cmd)

		// Watch for unexpected exit in background.
		go func() {
			_ = cmd.Wait()
		}()

		return stateUpdateMsg{name: c.Name, state: StateStarting, pid: cmd.Process.Pid}
	}
}

// launchSidecar starts a Rust sidecar via `nix develop --command cargo run --release`.
// dir is the sidecar's subdirectory (e.g. "sidecar-atlas").
func launchSidecar(c *Component, subdir string) tea.Cmd {
	return func() tea.Msg {
		root := projectRoot()
		dir := fmt.Sprintf("%s/%s", root, subdir)
		cmd := nixCmd(dir, "cargo", "run", "--release")

		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("sidecar %s launch failed: %v", c.Name, err),
			}
		}
		registerProc(c.Name, cmd)

		go func() { _ = cmd.Wait() }()

		return stateUpdateMsg{name: c.Name, state: StateStarting, pid: cmd.Process.Pid}
	}
}

// sidecarSubdir maps a component name to its source subdirectory.
var sidecarSubdir = map[string]string{
	"sidecar-atlas":      "sidecar-atlas",
	"sidecar-cyberdeck":  "sidecar-cyberdeck",
	"sidecar-netrunning": "sidecar-netrunning",
}

// launchDashboardBridge starts the VSB→WebSocket telemetry bridge via crush.
func launchDashboardBridge(c *Component) tea.Cmd {
	return func() tea.Msg {
		root := projectRoot()
		cmd := nixCmd(root, "./crush/crush", "dashboard-bridge")

		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("dashboard-bridge launch failed: %v", err),
			}
		}
		registerProc(c.Name, cmd)
		go func() { _ = cmd.Wait() }()
		return stateUpdateMsg{name: c.Name, state: StateStarting, pid: cmd.Process.Pid}
	}
}

// launchShadowDashboard starts the Next.js dev server for the Shadow Dashboard.
func launchShadowDashboard(c *Component) tea.Cmd {
	return func() tea.Msg {
		root := projectRoot()
		cmd := nixCmd(root+"/dashboard", "pnpm", "dev")

		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("shadow-dashboard launch failed: %v", err),
			}
		}
		registerProc(c.Name, cmd)
		go func() { _ = cmd.Wait() }()
		return stateUpdateMsg{name: c.Name, state: StateStarting, pid: cmd.Process.Pid}
	}
}

// launchVaultSync starts the Obsidian bidirectional sync daemon via tsx.
func launchVaultSync(c *Component) tea.Cmd {
	return func() tea.Msg {
		root := projectRoot()
		cmd := nixCmd(root, "pnpm", "exec", "tsx", "src/core/obsidian-sync-service.ts")

		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("vault-sync launch failed: %v", err),
			}
		}
		registerProc(c.Name, cmd)
		go func() { _ = cmd.Wait() }()
		return stateUpdateMsg{name: c.Name, state: StateStarting, pid: cmd.Process.Pid}
	}
}

// ── Boot Sequence ─────────────────────────────────────────────────────────────

// bootSequenceCmd implements the ctrl+i ignition: sequential boot across all
// layers.  Layer 3 (SSH / Node A) is appended by Task 3.
func bootSequenceCmd(components []*Component) tea.Cmd {
	var cmds []tea.Cmd

	for _, c := range components {
		comp := c // capture
		switch comp.Layer {
		case LayerWindows:
			switch comp.Name {
			case "foundry-vtt":
				cmds = append(cmds, launchFoundry(comp))
			case "pixtral":
				cmds = append(cmds, launchPixtral(comp))
			}

		case LayerWSL:
			switch comp.Name {
			case "director":
				cmds = append(cmds, launchDirector(comp))
			case "dashboard-bridge":
				cmds = append(cmds, launchDashboardBridge(comp))
			case "shadow-dashboard":
				cmds = append(cmds, launchShadowDashboard(comp))
			case "vault-sync":
				cmds = append(cmds, launchVaultSync(comp))
			default:
				if subdir, ok := sidecarSubdir[comp.Name]; ok {
					cmds = append(cmds, launchSidecar(comp, subdir))
				}
			}

		case LayerRemote:
			cmds = append(cmds, nodeABootCmd(comp))
		}
	}

	// Signal completion so the UI can re-arm ctrl+i if needed.
	cmds = append(cmds, func() tea.Msg { return bootCompleteMsg{} })

	// tea.Sequence ensures ordered delivery of messages.
	return tea.Sequence(cmds...)
}

// ── Restart & Kill ────────────────────────────────────────────────────────────

// restartComponent kills the current process (if any) and relaunches it.
func restartComponent(c *Component) tea.Cmd {
	return func() tea.Msg {
		_ = killProc(c.Name)
		// Short settle before relaunch.
		time.Sleep(500 * time.Millisecond)
		return nil
	}
}

// killComponent sends a hard kill to the component.
// Remote components (LayerRemote) are killed via SSH pkill; local processes
// are killed via the process registry.
func killComponent(c *Component) tea.Cmd {
	if c.Layer == LayerRemote {
		return killRemoteComponent(c.Name)
	}
	return func() tea.Msg {
		if err := killProc(c.Name); err != nil {
			return logMsg{text: fmt.Sprintf("[%s] kill error %s: %v",
				time.Now().Format("15:04:05"), c.Name, err)}
		}
		return stateUpdateMsg{name: c.Name, state: StateStopped}
	}
}

// shutdownCmd gracefully stops all components in reverse boot order, then quits.
func shutdownCmd(components []*Component) tea.Cmd {
	return func() tea.Msg {
		// Reverse order: remote → WSL → Windows
		for i := len(components) - 1; i >= 0; i-- {
			_ = killProc(components[i].Name)
		}
		return tea.Quit()
	}
}

// performPurge aggressively kills all project-related processes to prevent zombies.
func performPurge() tea.Cmd {
	return func() tea.Msg {
		targets := []string{
			"sidecar-cyberdeck",
			"sidecar-atlas",
			"sidecar-netrunning",
			"crush",
			"deck-igniter",
			"llama-server",
		}
		for _, t := range targets {
			// pkill -9 for maximum dominance over zombie processes
			_ = exec.Command("pkill", "-9", t).Run()
		}
		// Also kill the Windows-native pixtral server just in case
		_ = exec.Command(cmdExe, "/C", "taskkill /F /IM llama-server.exe").Run()
		// Settle time after purge
		time.Sleep(1 * time.Second)
		return logMsg{text: "⚡ PURGE C0MPL373: All zombie processes neutralized."}
	}
}
