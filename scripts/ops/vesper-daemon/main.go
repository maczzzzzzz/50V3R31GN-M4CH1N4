package main

/**
 * VESPER DAEMON — PHASE 78, TASK 1
 *
 * Central orchestrator of background persistence for the Sovereign Intelligence OS.
 * Runs silently in the background, activating only during user idle windows.
 *
 * Components:
 *   Watchdog     — monitors vsb-traffic.log; hibernates if user session active
 *   FlushGate    — polls SovereignIntelligence.db for approved background proposals
 *
 * Usage:
 *   vesper-daemon [--vsb-log <path>] [--db <path>]
 *
 * Defaults:
 *   vsb-log: data/logs/vsb-traffic.log
 *   db:      data/SovereignIntelligence.db
 */

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	vsbLog := flag.String("vsb-log", "data/logs/vsb-traffic.log", "Path to VSB traffic log")
	dbPath := flag.String("db", "data/SovereignIntelligence.db", "Path to SovereignIntelligence.db")
	flag.Parse()

	fmt.Println("◈ [V3SP3R] Daemon initializing — Phase 78 // 50V3R31GN-M4CH1N4")
	fmt.Printf("  vsb-log : %s\n", *vsbLog)
	fmt.Printf("  db      : %s\n", *dbPath)

	// Verify DB exists before starting (fail fast rather than silent loop).
	if _, err := os.Stat(*dbPath); err != nil {
		fmt.Printf("⚠️  [V3SP3R] DB not found at %s — flush gate disabled.\n", *dbPath)
	}

	// Start subsystems
	watchdog := NewWatchdog(*vsbLog)
	watchdog.Start()

	flushGate := NewFlushGateClient(*dbPath)
	flushGate.Start()

	// Block until SIGINT or SIGTERM
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	sig := <-sigCh

	fmt.Printf("\n◈ [V3SP3R] Signal received (%s) — hibernating.\n", sig)
	watchdog.Stop()
	flushGate.Stop()
	fmt.Println("◈ [V3SP3R] Daemon shutdown complete.")
}
