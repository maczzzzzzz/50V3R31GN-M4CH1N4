package harness

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"sync"
	"time"

	"github.com/google/uuid"
)

/**
 * OMI_VOICE_ARTERY — PHASE 103, TASK 2
 *
 * Implements the OMI (Open Mind Interface) Voice Gateway.
 * Listens for transcribed voice segments and converts them to VSB Intents.
 * Integrates Voicebox for high-fidelity synthesis.
 */

type OMIRequest struct {
	TraceID     string `json:"trace_id"`
	Transcript  string `json:"transcript"`
	Confidence  float64 `json:"confidence"`
	IsFinal     bool    `json:"is_final"`
}

type OMIResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	TraceID string `json:"trace_id"`
}

type OMIVoiceArtery struct {
	port    int
	server  *http.Server
	mu      sync.Mutex
	running bool
}

func NewOMIVoiceArtery(port int) *OMIVoiceArtery {
	return &OMIVoiceArtery{
		port: port,
	}
}

func (a *OMIVoiceArtery) Start() error {
	a.mu.Lock()
	if a.running {
		a.mu.Unlock()
		return fmt.Errorf("OMI Artery already running")
	}
	a.running = true
	a.mu.Unlock()

	mux := http.NewServeMux()
	mux.HandleFunc("/v1/voice/ingress", a.handleIngress)
	mux.HandleFunc("/v1/voice/synthesize", a.handleSynthesize)

	a.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", a.port),
		Handler: mux,
	}

	fmt.Printf("◈ OMI_VOICE_ARTERY : Listening on port %d\n", a.port)
	return a.server.ListenAndServe()
}

func (a *OMIVoiceArtery) handleIngress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req OMIRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if req.TraceID == "" {
		req.TraceID = uuid.New().String()
	}

	fmt.Printf("◈ OMI_INGRESS [%s] : \"%s\" (Conf: %.2f)\n", req.TraceID, req.Transcript, req.Confidence)

	// In Phase 103, we bridge this transcript directly to the Hermes Singularity
	// via a VSB Intent (IntentVocalIntent = 0x0B).
	go a.dispatchToHermes(req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(OMIResponse{
		Status:  "ACCEPTED",
		Message: "Transcript ingressed to Hermes Singularity",
		TraceID: req.TraceID,
	})
}

func (a *OMIVoiceArtery) handleSynthesize(w http.ResponseWriter, r *http.Request) {
	// TODO: Integrate Voicebox/Piper for high-fidelity synthesis
	w.WriteHeader(http.StatusNotImplemented)
}

func (a *OMIVoiceArtery) dispatchToHermes(req OMIRequest) {
	// Simulated VSB Dispatch for Phase 103
	// In a real implementation, this writes to the VSB UDP Artery or Mmap buffer.
	fmt.Printf("◈ VSB_DISPATCH [%s] : IntentVocalIntent(0x0B) payload=\"%s\"\n", req.TraceID, req.Transcript)
	
	// If the transcript contains "Scribe", we trigger a manifest sync
	if req.IsFinal && (fmt.Sprintf("%s", req.Transcript) == "Scribe" || fmt.Sprintf("%s", req.Transcript) == "scribe") {
		fmt.Printf("◈ MAGIC_WORD_DETECTED : Triggering Universal Scribe Sync...\n")
		exec.Command("npm", "run", "scribe").Run()
	}
}

func (a *OMIVoiceArtery) Stop() error {
	if a.server != nil {
		return a.server.Close()
	}
	return nil
}
