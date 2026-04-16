// crush/nucleus.go
// Phase 50: Nucleus Artery — Protobuf-over-WebSocket bridge for the CL4W Command Deck.
// Streams VSB Mmap state as Protobuf binary frames at ~60fps; receives JSON commands.
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"google.golang.org/protobuf/proto"

	"github.com/50v3r31gn-m4ch1n4/crush/nucleuspb"
)

var nucleusUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// NucleusCommand is a JSON command dispatched from the Nucleus Deck UI.
// Commands flow UI → server; state flows server → UI as Protobuf binary.
type NucleusCommand struct {
	Action string `json:"action"`
	Arg    string `json:"arg,omitempty"`
}

// nucleusHub manages the set of active WebSocket connections.
type nucleusHub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]bool
}

func (h *nucleusHub) broadcast(data []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients {
		_ = c.WriteMessage(websocket.BinaryMessage, data)
	}
}

func (h *nucleusHub) add(c *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = true
}

func (h *nucleusHub) remove(c *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, c)
}

// nucleusProjectRoot resolves the project root directory.
func nucleusProjectRoot() string {
	if r := os.Getenv("PROJECT_ROOT"); r != "" {
		return r
	}
	cwd, _ := os.Getwd()
	return cwd
}

// startNucleusServer launches the Nucleus Artery on :3030.
// State broadcasts are Protobuf binary (websocket.BinaryMessage).
// Command messages from the UI are JSON text (websocket.TextMessage).
func startNucleusServer() {
	root := nucleusProjectRoot()
	memPath := filepath.Join(root, "black_ice_state.mem")

	watcher, err := NewVsbWatcher(memPath)
	if err != nil {
		fmt.Printf("[NUCLEUS] VSB watcher unavailable: %v (state stream disabled)\n", err)
	}

	hub := &nucleusHub{clients: make(map[*websocket.Conn]bool)}

	// State broadcast goroutine — ~60fps, Protobuf binary frames
	go func() {
		for {
			state := &nucleuspb.NucleusState{
				Timestamp: time.Now().UnixMilli(),
			}

			if watcher != nil {
				if p := watcher.GetProposal(); p != nil {
					state.Proposal = &nucleuspb.Proposal{
						Id:     uint32(p.ID),
						Status: uint32(p.Status),
					}
				}
				active, id, unitType, imgPath, x, y := watcher.ReadHoveredUnit()
				state.HoveredUnit = &nucleuspb.HoveredUnit{
					Active:   active,
					Id:       id,
					UnitType: unitType,
					ImgPath:  imgPath,
					X:        x,
					Y:        y,
				}
			}

			if data, marshalErr := proto.Marshal(state); marshalErr == nil {
				hub.broadcast(data)
			}
			time.Sleep(16 * time.Millisecond)
		}
	}()

	mux := http.NewServeMux()

	// WebSocket endpoint: binary out (Protobuf), text in (JSON commands)
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := nucleusUpgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		hub.add(conn)
		defer func() {
			hub.remove(conn)
			conn.Close()
		}()

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			var cmd NucleusCommand
			if jsonErr := json.Unmarshal(msg, &cmd); jsonErr != nil {
				continue
			}
			handleNucleusCommand(cmd, watcher)
		}
	})

	// Serve the built SPA from dashboard/cl4w-nucleus/dist
	distPath := filepath.Join(root, "dashboard", "cl4w-nucleus", "dist")
	mux.Handle("/", http.FileServer(http.Dir(distPath)))

	fmt.Printf("[NUCLEUS] Artery online — http://localhost:3030  ws://localhost:3030/ws\n")
	if err := http.ListenAndServe(":3030", mux); err != nil {
		fmt.Printf("[NUCLEUS] Fatal: %v\n", err)
		os.Exit(1)
	}
}

// handleNucleusCommand dispatches a system command received from the Deck UI.
func handleNucleusCommand(cmd NucleusCommand, w *VsbWatcher) {
	switch cmd.Action {
	case "GHOST_BOOT":
		_ = exec.Command("crush", "start", "--lite", "--headless").Start()
	case "FULL_ENGAGE":
		_ = exec.Command("crush", "start", "--full", "--headless").Start()
	case "LITE_MODE":
		_ = exec.Command("crush", "start", "--lite", "--headless").Start()
	case "VAULT_OPEN":
		key := os.Getenv("SOVEREIGN_KEY")
		if key != "" {
			openDirectory("../docs/superpowers/", key)
		}
	case "SOVEREIGN_MODE_ON":
		if w != nil {
			w.ToggleSovereignMode(true)
		}
	case "SOVEREIGN_MODE_OFF":
		if w != nil {
			w.ToggleSovereignMode(false)
		}
	case "FLUSH_ACKNOWLEDGE":
		if w != nil {
			w.SetStatus(StatusApproved)
		}
	case "FLUSH_VETO":
		if w != nil {
			w.SetStatus(StatusRejected)
		}
	case "REBOOT_NODE_A":
		_ = exec.Command("crush", "shut-down").Start()
	}
}
