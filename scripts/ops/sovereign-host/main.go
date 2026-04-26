package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"sovereign-host/fsgate"
	"sovereign-host/handlers"
	"sovereign-host/protocol"
	"sovereign-host/server"
)

func main() {
	port := flag.Int("port", 7878, "UDP port to listen on")
	root := flag.String("root", `D:\Sovereign_Workspace`, "Root directory for fsgate")
	flag.Parse()

	fmt.Println("◈ INITIALIZING MACHINA-HOST SIDECAR")
	fmt.Printf("◈ PHASE: 81 // IDENTITY: SOVEREIGN_HOST\n")

	gate := fsgate.NewGate(*root)

	// Ensure scratch directory exists and is marked as Hidden/System
	scratchDir := filepath.Join(gate.Root, fsgate.ScratchSub)
	if err := os.MkdirAll(scratchDir, 0755); err == nil {
		if err := gate.MarkHiddenSystem(scratchDir); err != nil {
			fmt.Printf("◈ FSGATE: Warning - Failed to mark scratch as hidden: %v\n", err)
		}
	}

	srv, err := server.NewServer(*port)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creating server: %v\n", err)
		os.Exit(1)
	}

	// Register Handlers
	srv.RegisterHandler(protocol.IntentGetProcessList, handlers.GetProcessList)
	srv.RegisterHandler(protocol.IntentFocusWindow, handlers.FocusWindow)
	srv.RegisterHandler(protocol.IntentWriteFile, handlers.MakeWriteFileHandler(gate))
	srv.RegisterHandler(protocol.IntentDeleteFile, handlers.MakeDeleteFileHandler(gate))
	srv.RegisterHandler(protocol.IntentCaptureScreen, handlers.CaptureScreen)

	fmt.Printf("◈ FSGATE ROOT: %s\n", gate.Root)
	fmt.Printf("◈ FSGATE SCRATCH: %s\n", scratchDir)
	
	if err := srv.Start(); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}
