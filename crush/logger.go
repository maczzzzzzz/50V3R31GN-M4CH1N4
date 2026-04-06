package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func logError(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	
	// Print to stderr
	fmt.Fprint(os.Stderr, msg)
	
	// Append to file
	logDir := "../data/logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return
	}
	
	logFile := filepath.Join(logDir, "crush.log")
	f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	
	timestamp := time.Now().Format(time.RFC3339)
	fmt.Fprintf(f, "[%s] %s\n", timestamp, msg)
}
