package main

/**
 * VESPER HEARTBEAT WATCHDOG — PHASE 78, TASK 1
 *
 * Monitors vsb-traffic.log for user activity.
 * If activity is detected, Vesper hibernates (sends SIGTERM to itself)
 * to surrender VRAM headroom to the primary session.
 * After the activity window passes, the parent process manager restarts it.
 *
 * Invariant: Vesper MUST NOT compete with the Strategic Oracle kernel
 * for VRAM. Active user → Vesper sleeps. Idle > 30 min → Vesper wakes.
 */

import (
	"fmt"
	"os"
	"syscall"
	"time"
)

const (
	// idleThreshold is how long the log must be quiet before Vesper runs.
	idleThreshold = 30 * time.Minute
	// pollInterval is how often the watchdog checks the log mtime.
	pollInterval = 60 * time.Second
)

// Watchdog monitors a log file for write activity.
// If the file is touched more recently than idleThreshold, it signals
// the process to hibernate by sending SIGTERM to itself.
type Watchdog struct {
	logPath string
	quit    chan struct{}
}

func NewWatchdog(logPath string) *Watchdog {
	return &Watchdog{
		logPath: logPath,
		quit:    make(chan struct{}),
	}
}

// Start launches the watchdog in a background goroutine.
func (w *Watchdog) Start() {
	go func() {
		fmt.Printf("◈ [VESPER/WATCHDOG] Monitoring %s (idle threshold: %s)\n", w.logPath, idleThreshold)
		for {
			select {
			case <-w.quit:
				fmt.Println("◈ [VESPER/WATCHDOG] Stopped.")
				return
			case <-time.After(pollInterval):
				w.check()
			}
		}
	}()
}

func (w *Watchdog) Stop() {
	close(w.quit)
}

func (w *Watchdog) check() {
	info, err := os.Stat(w.logPath)
	if err != nil {
		// Log file absent — no user activity. Vesper safe to run.
		return
	}
	age := time.Since(info.ModTime())
	if age < idleThreshold {
		fmt.Printf("⚠️  [VESPER/WATCHDOG] User activity detected (log age: %s < %s) — hibernating.\n", age.Round(time.Second), idleThreshold)
		// Send SIGTERM to self — the process manager (systemd/supervisor) handles restart.
		if err := syscall.Kill(os.Getpid(), syscall.SIGTERM); err != nil {
			fmt.Printf("⚠️  [VESPER/WATCHDOG] SIGTERM self-send failed: %v\n", err)
		}
	}
}
