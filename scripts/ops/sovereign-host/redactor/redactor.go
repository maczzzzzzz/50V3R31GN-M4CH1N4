package redactor

import (
	"strings"
)

var ProtectedProcesses = []string{
	"Code.exe",
	"cursor.exe",
	"windsurf.exe",
	"chrome.exe",
	"msedge.exe",
	"firefox.exe",
}

type Redactor struct{}

func NewRedactor() *Redactor {
	return &Redactor{}
}

func (r *Redactor) ShouldRedact(windowTitle string, processName string) bool {
	// Check if process name is in the protected list
	for _, p := range ProtectedProcesses {
		if strings.EqualFold(processName, p) {
			return true
		}
	}

	// Check window title for sensitive keywords
	titleLower := strings.ToLower(windowTitle)
	keywords := []string{"password", "secret", "private", "key", ".env"}
	for _, k := range keywords {
		if strings.Contains(titleLower, k) {
			return true
		}
	}

	return false
}

type Rect struct {
	X, Y, W, H int
}

func (r *Redactor) GetRedactionMask(windowRect Rect) Rect {
	// Simple logic: mask the whole window area if it should be redacted.
	// In a more advanced implementation, this could return specific regions (e.g. text areas).
	return windowRect
}
