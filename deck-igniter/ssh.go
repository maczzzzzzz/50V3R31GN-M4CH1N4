package main

// ssh.go — Layer 3: Remote Node A orchestration via SSH.
//
// Uses golang.org/x/crypto/ssh to connect to Node A with the confirmed identity
// key at ~/win_id_ed25519.  The two-stage boot sequence:
//   1. setup-resident-models.sh  — starts llama-server with 1.5B Reasoner
//   2. zeroclaw                  — starts the Rust rules engine / VSB server

import (
	"fmt"
	"net"
	"os"
	"path/filepath"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"golang.org/x/crypto/ssh"
)

// ── Node A Connection Config ───────────────────────────────────────────────────

const (
	nodeAHost       = "node-a"        // resolvable hostname or IP
	nodeAPort       = "22"
	nodeAUser       = "nixos"
	nodeAIdentity   = "~/win_id_ed25519"
	nodeASetupScript = "~/setup-resident-models.sh"
	nodeAZeroclaw   = "zeroclaw"
	sshDialTimeout  = 30 * time.Second
)

// expandHome replaces a leading "~" with the actual home directory.
func expandHome(path string) string {
	if len(path) > 0 && path[0] == '~' {
		home, err := os.UserHomeDir()
		if err != nil {
			return path
		}
		return filepath.Join(home, path[1:])
	}
	return path
}

// ── SSH Client Helpers ─────────────────────────────────────────────────────────

// newNodeAClient dials Node A and returns an authenticated *ssh.Client.
func newNodeAClient() (*ssh.Client, error) {
	keyPath := expandHome(nodeAIdentity)
	keyBytes, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, fmt.Errorf("read identity key %s: %w", keyPath, err)
	}

	signer, err := ssh.ParsePrivateKey(keyBytes)
	if err != nil {
		return nil, fmt.Errorf("parse identity key: %w", err)
	}

	cfg := &ssh.ClientConfig{
		User:            nodeAUser,
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // replace with known_hosts in prod
		Timeout:         sshDialTimeout,
	}

	addr := net.JoinHostPort(nodeAHost, nodeAPort)
	client, err := ssh.Dial("tcp", addr, cfg)
	if err != nil {
		return nil, fmt.Errorf("ssh dial %s: %w", addr, err)
	}
	return client, nil
}

// runRemote opens a new session on an existing SSH client and runs cmd.
// Returns combined stdout+stderr and any error.
func runRemote(client *ssh.Client, cmd string) (string, error) {
	sess, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("new ssh session: %w", err)
	}
	defer sess.Close()

	out, err := sess.CombinedOutput(cmd)
	return string(out), err
}

// startRemote opens a session and starts cmd in the background (no wait).
func startRemote(client *ssh.Client, cmd string) error {
	sess, err := client.NewSession()
	if err != nil {
		return fmt.Errorf("new ssh session: %w", err)
	}
	// Start the command and detach; we'll probe health via HTTP.
	if err := sess.Start(cmd); err != nil {
		sess.Close()
		return fmt.Errorf("ssh start %q: %w", cmd, err)
	}
	// Intentionally NOT calling sess.Wait() — the process runs on Node A.
	// Session will be garbage-collected after the goroutine exits.
	go func() {
		_ = sess.Wait()
		sess.Close()
	}()
	return nil
}

// ── Launch Commands ────────────────────────────────────────────────────────────

// launchLlamaServer runs setup-resident-models.sh on Node A, which starts
// llama-server with the 1.5B Reasoner (and Falcon-0.3B as needed).
func launchLlamaServer(c *Component) tea.Cmd {
	return func() tea.Msg {
		client, err := newNodeAClient()
		if err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("ssh connect: %v", err),
			}
		}
		defer client.Close()

		script := expandHome(nodeASetupScript)
		if err := startRemote(client, fmt.Sprintf("bash %s", script)); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("llama-server boot: %v", err),
			}
		}

		return stateUpdateMsg{name: c.Name, state: StateStarting}
	}
}

// launchZeroclaw starts the zeroclaw binary on Node A.
// It depends on llama-server already being resident (guaranteed by sequential boot).
func launchZeroclaw(c *Component) tea.Cmd {
	return func() tea.Msg {
		client, err := newNodeAClient()
		if err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("ssh connect: %v", err),
			}
		}
		defer client.Close()

		if err := startRemote(client, nodeAZeroclaw); err != nil {
			return stateUpdateMsg{
				name:  c.Name,
				state: StateError,
				err:   fmt.Sprintf("zeroclaw boot: %v", err),
			}
		}

		return stateUpdateMsg{name: c.Name, state: StateStarting}
	}
}

// killRemoteComponent sends a pkill over SSH to stop a named process on Node A.
func killRemoteComponent(name string) tea.Cmd {
	return func() tea.Msg {
		client, err := newNodeAClient()
		if err != nil {
			return logMsg{text: fmt.Sprintf("[%s] SSH kill failed for %s: %v",
				time.Now().Format("15:04:05"), name, err)}
		}
		defer client.Close()

		_, _ = runRemote(client, fmt.Sprintf("pkill -f %s", name))
		return stateUpdateMsg{name: name, state: StateStopped}
	}
}

// ── Boot Sequence Patch ───────────────────────────────────────────────────────
// nodeABootCmds returns the two-stage Node A sequence:
//   1. llama-server via setup-resident-models.sh
//   2. zeroclaw
//
// Called by launcher.go's bootSequenceCmd when it encounters a LayerRemote
// component.  This function is wired in via init() to avoid circular
// dependencies between launcher.go and ssh.go.

func nodeABootCmd(c *Component) tea.Cmd {
	switch c.Name {
	case "llama-server":
		return launchLlamaServer(c)
	case "zeroclaw":
		// Add a brief settle to let llama-server finish loading before zeroclaw
		// attempts its first VSB handshake.
		return tea.Sequence(
			waitCmd(3*time.Second),
			launchZeroclaw(c),
		)
	default:
		return func() tea.Msg {
			return logMsg{text: fmt.Sprintf("[%s] unknown remote component: %s",
				time.Now().Format("15:04:05"), c.Name)}
		}
	}
}

// waitCmd returns a command that sleeps for d then produces nil.
func waitCmd(d time.Duration) tea.Cmd {
	return func() tea.Msg {
		time.Sleep(d)
		return nil
	}
}
