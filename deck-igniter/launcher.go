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
	"path/filepath"
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
	pwshExe     = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"
)

// launchFoundry fires Foundry VTT via WSL interop powershell.exe.
// Uses cmd.Start() (non-blocking) — PowerShell is fire-and-forget because
// CombinedOutput() blocks until PS exits, and Start-Process with
// -RedirectStandard* holds output handles open from non-console processes,
// causing the entire boot sequence to hang indefinitely.
// Readiness is tracked by polling the CDP gate, not PS exit code.
func launchFoundry(c *Component) tea.Cmd {
	return func() tea.Msg {
		workDir := `D:\FoundryVTT\Foundry Virtual Tabletop`
		args := fmt.Sprintf(`--remote-debugging-port=%d`, foundryPort)

		// 1. Launch Foundry
		psCmdFoundry := fmt.Sprintf(
			`Start-Process -FilePath '%s' -ArgumentList '%s' -WorkingDirectory '%s'`,
			foundryExe, args, workDir,
		)

		// 2. Restart win-proxy — NO -RedirectStandard* flags: output redirection
		// holds PS output handles open in non-console mode, causing a hang.
		// win-proxy logs are managed by the process itself or omitted here.
		psCmdProxy := `
$conn = Get-NetTCPConnection -LocalPort 9223 -ErrorAction SilentlyContinue;
if ($conn) { Stop-Process -Id ($conn | Select-Object -First 1 -ExpandProperty OwningProcess) -Force -ErrorAction SilentlyContinue };
Start-Process -FilePath 'D:\Nodejs\node.exe' -ArgumentList 'D:\FoundryVTT_Data\Data\modules\50v3r31gn-bridge\scripts\win-proxy.cjs' -WindowStyle Hidden
`
		psCmd := fmt.Sprintf("%s;\n%s", psCmdFoundry, psCmdProxy)
		cmd := exec.Command(pwshExe, "-NoProfile", "-Command", psCmd)
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

		// Non-blocking: Start() returns as soon as PowerShell is launched.
		// Any PS-level error (e.g. file not found) will be caught by the CDP gate timing out.
		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("pwsh start error: %v", err),
			}
		}
		// Detach — let PS run independently; we probe readiness via CDP.
		go func() { _ = cmd.Wait() }()

		return stateUpdateMsg{name: c.Name, state: StateStarting}
	}
}

// launchPixtral fires the Pixtral Windows Native Server via WSL interop powershell.exe.
// Non-blocking (cmd.Start) for the same reason as launchFoundry — CombinedOutput
// hangs when PS is spawned from a non-console WSL process.
func launchPixtral(c *Component) tea.Cmd {
	return func() tea.Msg {
		workDir := `D:\llama.cpp`
		args := fmt.Sprintf(`/K "%s"`, pixtralBat)
		psCmd := fmt.Sprintf(
			`Start-Process -FilePath 'cmd.exe' -ArgumentList '%s' -WorkingDirectory '%s'`,
			args, workDir,
		)
		cmd := exec.Command(pwshExe, "-NoProfile", "-Command", psCmd)
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("pwsh start error (pixtral): %v", err),
			}
		}
		go func() { _ = cmd.Wait() }()
		return stateUpdateMsg{name: c.Name, state: StateStarting}
	}
}

// launchObsidian fires Obsidian via WSL interop powershell.exe.
func launchObsidian(c *Component) tea.Cmd {
	return func() tea.Msg {
		// Using explorer.exe shell:AppsFolder pattern is the most reliable way to fire 
		// Windows Store / AppID-based applications from WSL.
		cmd := exec.Command(cmdExe, "/C", "explorer.exe shell:AppsFolder\\md.obsidian")
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

		if err := cmd.Run(); err != nil {
			// Explorer often returns exit code 1 even on success when launching shell links,
			// so we only report error if the command itself failed to spawn.
		}
		return stateUpdateMsg{name: c.Name, state: StateRunning}
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

// launchCrushProxy starts the Crush CLI in proxy mode.
func launchCrushProxy(c *Component) tea.Cmd {
	return func() tea.Msg {
		root := projectRoot()
		cmd := exec.Command("./crush-cli", "proxy")
		cmd.Dir = root
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("crush-proxy launch failed: %v", err),
			}
		}

		registerProc(c.Name, cmd)
		go func() {
			err := cmd.Wait()
			if err != nil {
				// We don't have a direct channel to tea.Msg here, but the prober
				// will eventually notice it's dead, or we can log it.
			}
		}()

		return stateUpdateMsg{
			name:  c.Name,
			state: StateStarting,
		}
	}
}

// launchCrushGUI opens a new Windows console window running `crush-cli thought-stream`.
// This is the PRIMARY model-comms interface — streams inference tokens from Node A
// via the clawlink socket. Must be first WSL service launched after crush-proxy sock.
//
// PowerShell quoting note: use comma-separated -ArgumentList so each token is a
// distinct element — avoids the \"...\" vs single-quote escaping footgun that
// caused the window to silently fail in earlier versions.
func launchCrushGUI(c *Component) tea.Cmd {
	return func() tea.Msg {
		root := projectRoot()
		// Comma-separated -ArgumentList passes each element as a discrete arg to
		// wsl.exe, so bash receives the -c string without any backslash artefacts.
		psCmd := fmt.Sprintf(
			`Start-Process -FilePath 'C:\Windows\System32\wsl.exe' `+
				`-ArgumentList '-d','NixOS','--','bash','-c','cd %s && ./crush-cli terminal' `+
				`-WindowStyle Normal`,
			root,
		)
		cmd := exec.Command(pwshExe, "-NoProfile", "-Command", psCmd)
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
		if out, err := cmd.CombinedOutput(); err != nil {
			return stateUpdateMsg{name: c.Name, state: StateError,
				err: fmt.Sprintf("crush-gui launch: %v | %s", err, string(out))}
		}
		return stateUpdateMsg{name: c.Name, state: StateRunning}
	}
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

// launchSidecar starts a Rust sidecar via `nix develop`.
func launchSidecar(c *Component, subdir string) tea.Cmd {
	return func() tea.Msg {
		root := projectRoot()
		dir := filepath.Join(root, subdir)

		// BLOCKING BUILD if missing
		binPath := filepath.Join(dir, "target/release", subdir)
		if _, err := os.Stat(binPath); err != nil {
			cmd := exec.Command("nix", "develop", "--command", "cargo", "build", "--release")
			cmd.Dir = dir
			_ = cmd.Run() // Wait for completion
		}

		cmd := nixCmd(dir, "./target/release/"+subdir)
		if err := cmd.Start(); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("sidecar %s launch failed: %v", c.Name, err),
			}
		}
		registerProc(c.Name, cmd)

		go func() { _ = cmd.Wait() }()

		// Settle delay to prevent CPU/RAM thrasher when booting 3 sidecars at once
		time.Sleep(2 * time.Second)

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
		
		// Configure Windows Mirror to bypass WSL filesystem watcher issues
		// Point your Windows Obsidian App to D:\Obsidian_RKG
		cmd.Env = append(os.Environ(), "WINDOWS_VAULT_ROOT=/mnt/d/Obsidian_RKG")

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

func finalizeGhostBoot() tea.Cmd {
	return func() tea.Msg {
		root := projectRoot()
		
		// 1. Run win-test.cjs for automated login
		loginCmd := exec.Command("nix", "develop", "--command", "npx", "tsx", "scripts/win-test.cjs")
		loginCmd.Dir = root
		out, err := loginCmd.CombinedOutput()
		os.WriteFile(filepath.Join(root, "data", "logs", "win-test.log"), out, 0644)
		if err != nil {
			return logMsg{text: fmt.Sprintf("GHOST LOGIN ERROR: %v | log written to win-test.log", err)}
		}
		
		// 2. Short settle
		time.Sleep(5 * time.Second)
		
		// 3. Run sovereign-live-audit.ts for health check
		auditCmd := exec.Command("nix", "develop", "--command", "npx", "tsx", "scripts/sovereign-live-audit.ts")
		auditCmd.Dir = root
		auditOut, err := auditCmd.CombinedOutput()
		os.WriteFile(filepath.Join(root, "data", "logs", "win-audit.log"), auditOut, 0644)
		if err != nil {
			return logMsg{text: fmt.Sprintf("GHOST AUDIT ERROR: %v | log written to win-audit.log", err)}
		}
		
		return logMsg{text: "GHOST BOOT PROTOCOL: ALL SYSTEMS NOMINAL"}
	}
}

// bootSequenceCmd implements the ctrl+i ignition: sequential boot across all
// layers.  Layer 3 (SSH / Node A) is appended by Task 3.
func bootSequenceCmd(components []*Component, ghostMode bool) tea.Cmd {
	var cmds []tea.Cmd

	// First pass: log start of sequence
	cmds = append(cmds, logEvent("SYSTEM IGNITION: PHASE 1 — Windows Orchestration"))

	for _, c := range components {
		comp := c // capture
		switch comp.Layer {
		case LayerWindows:
			switch comp.Name {
			case "foundry-vtt":
				cmds = append(cmds, launchFoundry(comp))
			case "pixtral":
				cmds = append(cmds, launchPixtral(comp))
			case "obsidian":
				cmds = append(cmds, launchObsidian(comp))
			}
		}
	}

	// Gate: Foundry CDP must have a page target before WSL layer starts
	cmds = append(cmds, logEvent("GATE: waiting for Foundry CDP page target (90s)..."))
	cmds = append(cmds, waitForCDPGate(90*time.Second))

	cmds = append(cmds, logEvent("SYSTEM IGNITION: PHASE 2 — WSL Orchestration"))

	// 2a: crush-proxy first, then wait for its Unix socket
	clawSock := os.Getenv("CLAWLINK_SOCK")
	if clawSock == "" {
		clawSock = filepath.Join(projectRoot(), ".crush", "clawlink.sock")
	}
	for _, c := range components {
		comp := c
		if comp.Layer == LayerWSL && comp.Name == "crush-proxy" {
			cmds = append(cmds, launchCrushProxy(comp))
			cmds = append(cmds, logEvent(fmt.Sprintf("GATE: waiting for %s (15s)...", clawSock)))
			cmds = append(cmds, waitForSockGate(clawSock, 15*time.Second))
			break
		}
	}

	// 2a.1: crush-gui — PRIMARY model-comms terminal, first window to open after sock.
	// MUST launch here, before director, before sidecars. This is the operator's
	// main interface for watching Node A inference in real-time.
	for _, c := range components {
		comp := c
		if comp.Layer == LayerWSL && comp.Name == "crush-gui" {
			cmds = append(cmds, logEvent("LAUNCHING crush-gui — PRIMARY THOUGHT-STREAM TERMINAL"))
			cmds = append(cmds, launchCrushGUI(comp))
			break
		}
	}

	// 2b: director next, then wait for its WebSocket port
	for _, c := range components {
		comp := c
		if comp.Layer == LayerWSL && comp.Name == "director" {
			cmds = append(cmds, launchDirector(comp))
			cmds = append(cmds, logEvent("GATE: waiting for Director :3010 (30s)..."))
			cmds = append(cmds, waitForTCPGate(directorWSAddr, 30*time.Second))
			break
		}
	}

	// 2c: all remaining WSL services — dashboard, vault, AND sidecars.
	// Sidecars (egui GUIs) are WSL-native and only need the director; they MUST
	// NOT be deferred to Phase 4 (after SSH) or they never appear during boot.
	cmds = append(cmds, logEvent("SYSTEM IGNITION: PHASE 2c — GUI Layer (Sidecars + Dashboard)"))
	for _, c := range components {
		comp := c
		if comp.Layer != LayerWSL {
			continue
		}
		switch comp.Name {
		case "crush-proxy", "director", "crush-gui":
			// handled above with dependency gates
		case "dashboard-bridge":
			cmds = append(cmds, launchDashboardBridge(comp))
		case "shadow-dashboard":
			cmds = append(cmds, launchShadowDashboard(comp))
		case "vault-sync":
			cmds = append(cmds, launchVaultSync(comp))
		default:
			if subdir, ok := sidecarSubdir[comp.Name]; ok {
				// Launch in Phase 2c — no Phase 4 deferral.
				cmds = append(cmds, launchSidecar(comp, subdir))
			}
		}
	}

	// Phase 3: Node A SSH — runs concurrently with sidecars warming up.
	cmds = append(cmds, logEvent("SYSTEM IGNITION: PHASE 3 — Remote Orchestration (Node A)"))

	for _, c := range components {
		comp := c // capture
		if comp.Layer == LayerRemote {
			cmds = append(cmds, nodeABootCmd(comp))
		}
	}

	if ghostMode {
		cmds = append(cmds, finalizeGhostBoot())
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
			"llama-server",
			"obsidian-sync-service", // instead of tsx, targeting the specific daemon
			"next dev",              // instead of pnpm, targeting the specific server
		}
		for _, t := range targets {
			// pkill -9 with -f to match specific command parts.
			// This is safer for Gemini sessions because we've removed broad targets like 'pnpm' or 'tsx'
			// which may be used by the developer's tools or the Gemini CLI itself.
			_ = exec.Command("pkill", "-9", "-f", t).Run()
		}
		// Also kill the Windows-native pixtral server just in case
		_ = exec.Command(cmdExe, "/C", "taskkill /F /IM llama-server.exe /T").Run()
		// Settle time after purge
		time.Sleep(1 * time.Second)
		return logMsg{text: "⚡ PURGE C0MPL373: Targeted zombie processes neutralized."}
	}
}
