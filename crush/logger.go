package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

/**
 * ◈ CRUSH_LOGGER — v3.8.8
 * 
 * Implements structured JSON logging for headless arteries.
 * Mirrors the TS Logger schema for cross-node correlation.
 */

type LogEntry struct {
	Timestamp string                 `json:"timestamp"`
	Severity  string                 `json:"severity"`
	Context   string                 `json:"context"`
	TraceID   string                 `json:"traceId"`
	Message   string                 `json:"message"`
	NodeID    string                 `json:"nodeId"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

func logMessage(severity, context, traceId, message string, data map[string]interface{}) {
	entry := LogEntry{
		Timestamp: time.Now().Format(time.RFC3339),
		Severity:  severity,
		Context:   context,
		TraceID:   traceId,
		Message:   message,
		NodeID:    "NODE-A", // Go proxy is usually Node A
		Data:      data,
	}

	jsonData, err := json.Marshal(entry)
	if err != nil {
		fmt.Fprintf(os.Stderr, "::/LOG_MARSHAL_ERROR : %v\n", err)
		return
	}

	// 1. Console Output
	fmt.Println(string(jsonData))

// 2. Physical Persistence (Shared artery log)
	logDir := os.Getenv("ARTERY_LOG_DIR")
	if logDir == "" {
		logDir = "../data/logs"
	}
	_ = os.MkdirAll(logDir, 0755)
	
	// Primary persistent log
	logFile := filepath.Join(logDir, "artery.json")
	f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err == nil {
		_, _ = f.Write(append(jsonData, '\n'))
		f.Close()
	}

	// Secondary session log (Temp Artery)
	sessionLogDir := "/home/nixos/.gemini/tmp/50v3r31gn-m4ch1n4/logs"
	_ = os.MkdirAll(sessionLogDir, 0755)
	sessionLogFile := filepath.Join(sessionLogDir, "session_artery.json")
	sf, err := os.OpenFile(sessionLogFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err == nil {
		_, _ = sf.Write(append(jsonData, '\n'))
		sf.Close()
	}
}

// Legacy wrapper for error-only logging
func logError(format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	logMessage("ERROR", "CRUSH", "internal", msg, nil)
}
