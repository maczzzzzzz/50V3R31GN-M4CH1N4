// crush/nucleus.go
// Phase 50: Nucleus Artery — Protobuf-over-WebSocket bridge for the CL4W Command Deck.
// Streams VSB Mmap state as Protobuf binary frames at ~60fps; receives JSON commands.
// Phase 114.5: Interactive PTY Terminal, Deep Memory Integration, and OMI Voice Artery.
package main
import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
	"google.golang.org/protobuf/proto"

	"github.com/50v3r31gn-m4ch1n4/crush/nucleuspb"
)

var nucleusUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// NucleusCommand is a JSON command dispatched from the Nucleus Deck UI.
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

func nucleusProjectRoot() string {
	if r := os.Getenv("PROJECT_ROOT"); r != "" {
		return r
	}
	cwd, _ := os.Getwd()
	return cwd
}

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

	// State broadcast loop
	go func() {
		for {
			hub.mu.RLock()
			state := &nucleuspb.NucleusState{
				Timestamp: time.Now().UnixMilli(),
				Logs:      hub.logs,
				Narrative: hub.narrative,
			}
			hub.mu.RUnlock()

			if Cfg.RedModeActive && time.Now().Unix()%5 == 0 {
				akashikPath := filepath.Join(root, "data", "Akashik.db")
				out, err := exec.Command("sqlite3", akashikPath, "-json", "SELECT id, district_id, vendor_npc_id, json_array_length(inventory_json) FROM night_markets ORDER BY rowid DESC LIMIT 5;").Output()
				if err == nil {
					var markets []struct {
						ID string `json:"id"`; DistrictID string `json:"district_id"`; VendorID string `json:"vendor_npc_id"`; Length uint32 `json:"json_array_length(inventory_json)"`
					}
					if json.Unmarshal(out, &markets) == nil {
						for _, m := range markets {
							state.RecentMarkets = append(state.RecentMarkets, &nucleuspb.Market{Id: m.ID, DistrictId: m.DistrictID, VendorName: m.VendorID, ItemCount: m.Length})
						}
					}
				}
			}

			if data, marshalErr := proto.Marshal(state); marshalErr == nil {
				hub.broadcast(data)
			}
			time.Sleep(16 * time.Millisecond)
		}
	}()

	mux := http.NewServeMux()

	// ◈ PRIMARY WS ARTERY (Dashboard)
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := nucleusUpgrader.Upgrade(w, r, nil)
		if err != nil { return }
		hub.add(conn)
		defer func() { hub.remove(conn); conn.Close() }()
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil { return }
			var cmd NucleusCommand
			if json.Unmarshal(msg, &cmd) == nil {
				handleNucleusCommand(hub, cmd, watcher)
			}
		}
	})

	// ◈ PHASE 114.5: INTERACTIVE ARTERY SHELL (PTY)
	mux.HandleFunc("/terminal/ws", handleTerminalWS)

	// ◈ PHASE 114.5: OMI VOICE ARTERY (PCM-16)
	mux.HandleFunc("/ws/audio", handleVoiceWS)

	// ◈ PHASE 114.5: DEEP MEMORY ARTERY (TRIPLETS & FTS5)
	mux.HandleFunc("/api/memories", handleMemoriesAPI)
	mux.HandleFunc("/api/memories/search", handleMemoriesSearchAPI)

	distPath := filepath.Join(root, "dashboard", "cl4w-nucleus", "dist")
	mux.Handle("/", http.FileServer(http.Dir(distPath)))

	logMessage("INFO", "NUCLEUS", "internal", "Artery online — http://localhost:3030  ws://localhost:3030/ws", nil)
	if err := http.ListenAndServe(":3030", mux); err != nil {
		logMessage("ERROR", "NUCLEUS", "internal", fmt.Sprintf("Fatal: %v", err), nil)
		os.Exit(1)
	}
}

func handleTerminalWS(w http.ResponseWriter, r *http.Request) {
	conn, err := nucleusUpgrader.Upgrade(w, r, nil)
	if err != nil { return }
	defer conn.Close()
	c := exec.Command("bash")
	c.Env = append(os.Environ(), "TERM=xterm-256color")
	f, err := pty.Start(c)
	if err != nil { return }
	defer f.Close()
	go func() {
		buf := make([]byte, 1024); for {
			n, err := f.Read(buf); if err != nil { return }
			if conn.WriteMessage(websocket.BinaryMessage, buf[:n]) != nil { return }
		}
	}()
	for {
		mt, msg, err := conn.ReadMessage(); if err != nil { return }
		if mt == websocket.BinaryMessage || mt == websocket.TextMessage {
			if len(msg) > 8 && string(msg[:7]) == "RESIZE:" {
				var size struct { Cols, Rows uint16 }
				if json.Unmarshal(msg[7:], &size) == nil { _ = pty.Setsize(f, &pty.Winsize{Rows: size.Rows, Cols: size.Cols}) }
				continue
			}
			_, _ = f.Write(msg)
		}
	}
}

func handleVoiceWS(w http.ResponseWriter, r *http.Request) {
	conn, err := nucleusUpgrader.Upgrade(w, r, nil)
	if err != nil { return }
	defer conn.Close()

	logMessage("INFO", "VOICE", "internal", "OMI_VOICE_ARTERY : Connection Established", nil)
	
	var lastPacketID uint64
	epoch := time.Now().Unix()

	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil { return }
		
		if mt == websocket.TextMessage {
			logMessage("DEBUG", "VOICE", "internal", fmt.Sprintf("OMI_HANDSHAKE : %s", string(msg)), nil)
			conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"handshake_ack"}`))
		} else if mt == websocket.BinaryMessage {
			// ◈ PHASE 116: OMI_RESILIENCE_LOGIC
			// Extract Packet ID and Timestamp (simulated from binary header)
			// In production, we'd parse the first 12 bytes.
			packetID := lastPacketID + 1
			lastPacketID = packetID

			// ◈ PHASE 116: VIBEVOICE_BCF_FILTER
			// Simulated Bone Conduction Filter to mask environmental noise.
			// Logic: use vibrational reference to isolate voice frequency.
			if len(msg) > 0 {
				msg[0] = msg[0] ^ 0xFF // Dummy DSP transformation
			}

			// Mock: Occasionally trigger a 'Live Override'
			if time.Now().Unix()%15 == 0 {
				transcription := "Hey Machina, unseal the research shard for Phase 115."
				
				// 1. Send feedback to UI with Sequence Data
				feedback := map[string]interface{}{
					"type": "TRANSCRIPTION",
					"text": transcription,
					"seq":  packetID,
					"epoch": epoch,
				}
				fbData, _ := json.Marshal(feedback)
				conn.WriteMessage(websocket.TextMessage, fbData)
				
				logMessage("INFO", "VOICE", "live-override", fmt.Sprintf("[%d:%d] %s", epoch, packetID, transcription), nil)
			}
		}
	}
}

func handleMemoriesAPI(w http.ResponseWriter, r *http.Request) {
	root := nucleusProjectRoot()
	dbPath := filepath.Join(root, "data", "SovereignIntelligence.db")
	out, err := exec.Command("sqlite3", dbPath, "-json", "SELECT id, content, captured_at AS timestamp FROM synapse_captures ORDER BY captured_at DESC LIMIT 50;").Output()
	if err != nil { http.Error(w, "Artery Failure", 500); return }
	w.Header().Set("Content-Type", "application/json"); w.Write(out)
}

func handleMemoriesSearchAPI(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q"); if query == "" { http.Error(w, "Missing query", 400); return }
	
	if !Cfg.RedModeActive {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
		return
	}

	root := nucleusProjectRoot(); dbPath := filepath.Join(root, "data", "Akashik.db")
	out, err := exec.Command("sqlite3", dbPath, "-json", fmt.Sprintf("SELECT name, sector, content FROM shard_fts WHERE content MATCH '%s' LIMIT 20;", query)).Output()
	if err != nil { http.Error(w, "Search Failure", 500); return }
	w.Header().Set("Content-Type", "application/json"); w.Write(out)
}

func handleNucleusCommand(hub *nucleusHub, cmd NucleusCommand, w *VsbWatcher) {
	root := nucleusProjectRoot()
	crushBin := filepath.Join(root, "crush", "crush")
	if _, err := os.Stat(crushBin); err != nil { crushBin = filepath.Join(root, "crush-cli") }
	switch cmd.Action {
	case "CHAT_INPUT":
		payload, _ := json.Marshal(map[string]interface{}{"command": "chat", "method": "narrative_query", "text": cmd.Arg})
		hub.sendToUnix(clawLinkPacket{TraceID: newTraceID(), Payload: string(payload), Type: "broadcast"})
		hub.appendLog("> " + cmd.Arg)
	case "GHOST_BOOT": _ = exec.Command(crushBin, "start", "--lite", "--headless").Start()
	case "FULL_ENGAGE": _ = exec.Command(crushBin, "start", "--full", "--headless").Start()
	case "RED_MODE_ON":
		Cfg.RedModeActive = true
		hub.appendLog("::/ARTERY : RED_MODE_ACTIVE (Lore Unlocked)")
	case "RED_MODE_OFF":
		Cfg.RedModeActive = false
		hub.appendLog("::/ARTERY : RED_MODE_OFFLINE (Clean BASE Enforced)")
	case "VAULT_OPEN":
		if key := os.Getenv("SOVEREIGN_KEY"); key != "" { openDirectory(filepath.Join(root, "docs", "superpowers"), key) }
	case "REBOOT_NODE_A": _ = exec.Command(crushBin, "shut-down").Start()
	}
}
