package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"syscall"
	"time"
)

// SidecarState represents the current lifecycle status of a sidecar.
type SidecarState string

const (
	StateOffline SidecarState = "OFFLINE"
	StateStarting SidecarState = "STARTING"
	StateOnline  SidecarState = "ONLINE"
	StateError   SidecarState = "ERROR"
)

// Sidecar represents a physical binary managed by the Utility Belt.
type Sidecar struct {
	Name       string
	BinaryPath string
	Args       []string
	VramWeight float64 // Estimated VRAM usage in GB
	State      SidecarState
	cmd        *exec.Cmd
	mu         sync.Mutex
}

// SidecarRegistry manages the collection of sidecars.
type SidecarRegistry struct {
	sidecars map[string]*Sidecar
	logFile  *os.File
	mu       sync.Mutex
}

func NewSidecarRegistry() (*SidecarRegistry, error) {
	logDir := ".crush/logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, err
	}

	f, err := os.OpenFile(filepath.Join(logDir, "sidecars.log"), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}

	return &SidecarRegistry{
		sidecars: make(map[string]*Sidecar),
		logFile:  f,
	}, nil
}

func (r *SidecarRegistry) Register(s *Sidecar) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sidecars[s.Name] = s
}

func (r *SidecarRegistry) Start(name string) error {
	r.mu.Lock()
	s, ok := r.sidecars[name]
	r.mu.Unlock()

	if !ok {
		return fmt.Errorf("sidecar '%s' not found", name)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.State == StateOnline {
		return nil
	}

	s.State = StateStarting
	fmt.Fprintf(r.logFile, "[%s] Initializing %s...\n", time.Now().Format(time.RFC3339), name)

	cmd := exec.Command(s.BinaryPath, s.Args...)
	cmd.Stdout = r.logFile
	cmd.Stderr = r.logFile
	
	// Ensure the process is killed if Crush exits
	cmd.SysProcAttr = &syscall.SysProcAttr{Pdeathsig: syscall.SIGTERM}

	if err := cmd.Start(); err != nil {
		s.State = StateError
		return err
	}

	s.cmd = cmd
	s.State = StateOnline
	return nil
}

func (r *SidecarRegistry) Stop(name string) error {
	r.mu.Lock()
	s, ok := r.sidecars[name]
	r.mu.Unlock()

	if !ok {
		return fmt.Errorf("sidecar '%s' not found", name)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cmd != nil && s.cmd.Process != nil {
		s.cmd.Process.Kill()
	}

	s.State = StateOffline
	return nil
}

func (r *SidecarRegistry) List() []*Sidecar {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	list := make([]*Sidecar, 0, len(r.sidecars))
	for _, s := range r.sidecars {
		s.mu.Lock()
		// Create a snapshot to avoid race conditions when reading from the list elsewhere.
		// We manually copy fields to avoid copying the sync.Mutex (lock-copy).
		scopy := &Sidecar{
			Name:       s.Name,
			BinaryPath: s.BinaryPath,
			Args:       s.Args,
			VramWeight: s.VramWeight,
			State:      s.State,
		}
		s.mu.Unlock()
		list = append(list, scopy)
	}
	return list
}

// CheckVramHeadroom returns the available VRAM in GB using nvidia-smi.
// This is critical for the "Consultant" tier scaling.
func CheckVramHeadroom() (float64, error) {
	// Check if nvidia-smi exists first
	_, err := exec.LookPath("nvidia-smi")
	if err != nil {
		return 0, fmt.Errorf("nvidia-smi not found")
	}

	// WSL/Linux check via nvidia-smi
	out, err := exec.Command("nvidia-smi", "--query-gpu=memory.free", "--format=csv,noheader,nounits").Output()
	if err != nil {
		return 0, err
	}

	var freeMiB float64
	fmt.Sscanf(string(out), "%f", &freeMiB)
	return freeMiB / 1024.0, nil
}
