// crush/nucleus.go
// Phase 50: Nucleus Artery — Protobuf-over-WebSocket bridge for the CL4W Command Deck.
// Streams VSB Mmap state as Protobuf binary frames at ~60fps; receives JSON commands.
package main
import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
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
	mu           sync.RWMutex
	clients      map[*websocket.Conn]bool
	logs         []string
	narrative    []string
	maxBuffer    int
	unixConn     net.Conn
	unixPath     string
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

func (h *nucleusHub) appendLog(line string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.logs = append(h.logs, line)
	if len(h.logs) > h.maxBuffer {
		h.logs = h.logs[1:]
	}
}

func (h *nucleusHub) appendNarrative(line string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.narrative = append(h.narrative, line)
	if len(h.narrative) > h.maxBuffer {
		h.narrative = h.narrative[1:]
	}
}

func (h *nucleusHub) connectUnix() {
	for {
		conn, err := net.Dial("unix", h.unixPath)
		if err != nil {
			time.Sleep(2 * time.Second)
			continue
		}
		h.unixConn = conn
		fmt.Printf("[NUCLEUS] Connected to proxy: %s\n", h.unixPath)

		sc := bufio.NewScanner(conn)
		for sc.Scan() {
			var pkt clawLinkPacket
			if err := json.Unmarshal(sc.Bytes(), &pkt); err == nil {
				if pkt.Type == "broadcast" {
					var payload struct {
						Type    string `json:"type"`
						Content string `json:"content"`
					}
					if json.Unmarshal([]byte(pkt.Payload), &payload) == nil {
						if payload.Type == "log" {
							h.appendLog(payload.Content)
						} else if payload.Type == "narrative" {
							h.appendNarrative(payload.Content)
						}
					}
				}
			}
		}
		h.unixConn = nil
		time.Sleep(2 * time.Second)
	}
}

func (h *nucleusHub) sendToUnix(pkt clawLinkPacket) {
	h.mu.RLock()
	conn := h.unixConn
	h.mu.RUnlock()
	if conn != nil {
		b, _ := json.Marshal(pkt)
		conn.Write(append(b, '\n'))
	}
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
	unixPath := Cfg.ClawlinkSock

	watcher, err := NewVsbWatcher(memPath)
	if err != nil {
		fmt.Printf("[NUCLEUS] VSB watcher unavailable: %v (state stream disabled)\n", err)
	}

	hub := &nucleusHub{
		clients:   make(map[*websocket.Conn]bool),
		maxBuffer: 50,
		unixPath:  unixPath,
	}

	go hub.connectUnix()

	// State broadcast goroutine — ~60fps, Protobuf binary frames
	go func() {
		for {
			hub.mu.RLock()
			state := &nucleuspb.NucleusState{
				Timestamp: time.Now().UnixMilli(),
				Logs:      hub.logs,
				Narrative: hub.narrative,
			}
			hub.mu.RUnlock()

			// Fetch live data from SQLite (High-speed pulse every 5 seconds)
			if time.Now().Unix()%5 == 0 {
				dbPath := filepath.Join(root, "data", "Akashik.db")

				// Fetch Markets
				out, err := exec.Command("sqlite3", dbPath, "-json", "SELECT id, district_id, vendor_npc_id, json_array_length(inventory_json) FROM night_markets ORDER BY rowid DESC LIMIT 5;").Output()
				if err == nil {
					var markets []struct {
						ID         string `json:"id"`
						DistrictID string `json:"district_id"`
						VendorID   string `json:"vendor_npc_id"`
						Length     uint32 `json:"json_array_length(inventory_json)"`
					}
					if json.Unmarshal(out, &markets) == nil {
						for _, m := range markets {
							state.RecentMarkets = append(state.RecentMarkets, &nucleuspb.Market{
								Id:         m.ID,
								DistrictId: m.DistrictID,
								VendorName: m.VendorID,
								ItemCount:  m.Length,
							})
						}
					}
				}

				// Fetch Items
				out, err = exec.Command("sqlite3", dbPath, "-json", "SELECT id, name, cost, type FROM items ORDER BY RANDOM() LIMIT 5;").Output()
				if err == nil {
					var items []struct {
						ID   string `json:"id" `
						Name string `json:"name"`
						Cost uint32 `json:"cost"`
						Type string `json:"type"`
					}
					if json.Unmarshal(out, &items) == nil {
						for _, item := range items {
							state.LexiconItems = append(state.LexiconItems, &nucleuspb.Item{
								Id:   item.ID,
								Name: item.Name,
								Cost: item.Cost,
								Type: item.Type,
							})
						}
					}
				}
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
			handleNucleusCommand(hub, cmd, watcher)
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

func handleNucleusCommand(hub *nucleusHub, cmd NucleusCommand, w *VsbWatcher) {
	root := nucleusProjectRoot()
	crushBin := filepath.Join(root, "crush", "crush")
	if _, err := os.Stat(crushBin); err != nil {
		// Fallback to project root if not in crush/
		crushBin = filepath.Join(root, "crush-cli")
	}

	switch cmd.Action {
	case "CHAT_INPUT":
		// Wrap the chat input as a broadcast intent for the Orchestrator (Node B)
		payload, _ := json.Marshal(map[string]interface{}{
			"command": "chat",
			"method":  "narrative_query",
			"text":    cmd.Arg,
		})
		pkt := clawLinkPacket{
			TraceID:  newTraceID(),
			Payload:  string(payload),
			Type:     "broadcast",
		}
		hub.sendToUnix(pkt)
		// Add to logs for immediate visual feedback
		hub.appendLog("> " + cmd.Arg)
	case "VIEW_LEXICON":
		pkt := clawLinkPacket{TraceID: newTraceID(), Type: "broadcast", Payload: `{"action":"TOGGLE_VIEW","target":"LEXICON"}`}
		hub.sendToUnix(pkt)
	case "VIEW_ECONOMY":
		pkt := clawLinkPacket{TraceID: newTraceID(), Type: "broadcast", Payload: `{"action":"TOGGLE_VIEW","target":"ECONOMY"}`}
		hub.sendToUnix(pkt)
	case "GHOST_BOOT":
		_ = exec.Command(crushBin, "start", "--lite", "--headless").Start()
	case "FULL_ENGAGE":
		_ = exec.Command(crushBin, "start", "--full", "--headless").Start()
	case "LITE_MODE":
		_ = exec.Command(crushBin, "start", "--lite", "--headless").Start()
	case "VAULT_OPEN":
		key := os.Getenv("SOVEREIGN_KEY")
		if key != "" {
			openDirectory(filepath.Join(root, "docs", "superpowers"), key)
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
		_ = exec.Command(crushBin, "shut-down").Start()
	}
}
