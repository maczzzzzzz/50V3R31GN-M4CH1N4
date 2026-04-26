package fsgate

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
)

const (
	DefaultRoot = `D:\Sovereign_Workspace`
	ScratchSub  = `scratch`
)

type Gate struct {
	Root string
}

func NewGate(root string) *Gate {
	if root == "" {
		root = DefaultRoot
	}
	return &Gate{Root: root}
}

func (g *Gate) ValidatePath(path string) (string, error) {
	// Clean the path and make it absolute if relative
	// Note: We might be running on Linux for testing, so we need to be careful with Windows paths.
	// But in production this runs on Windows.
	
	cleanPath := filepath.Clean(path)
	
	// If it's a relative path, join it with the root
	if !filepath.IsAbs(cleanPath) {
		cleanPath = filepath.Join(g.Root, cleanPath)
	}

	// Ensure it starts with the root
	if !strings.HasPrefix(strings.ToLower(cleanPath), strings.ToLower(g.Root)) {
		return "", errors.New("path traversal blocked: outside root")
	}

	// Option C: Block traversal/deletion outside /scratch/
	// For simplicity, we'll say most operations must be in scratch,
	// except maybe reading from the root if allowed.
	// The requirement says "Block traversal/deletion outside /scratch/".
	// This implies we can READ elsewhere but can't "traverse" (list?) or "delete".
	
	scratchPath := filepath.Join(g.Root, ScratchSub)
	if !strings.HasPrefix(strings.ToLower(cleanPath), strings.ToLower(scratchPath)) {
		// If it's not in scratch, check if it's the root itself or some allowed read-only area
		// For now, let's be strict: if it's not in scratch, we'll allow it ONLY if it's for reading
		// and we'll let the caller decide based on the operation.
		// But "Block traversal" usually means listing directories.
	}

	return cleanPath, nil
}

func (g *Gate) IsScratch(path string) bool {
	scratchPath := filepath.Join(g.Root, ScratchSub)
	return strings.HasPrefix(strings.ToLower(path), strings.ToLower(scratchPath))
}

// WriteScratchFile writes data to a file within the scratch directory.
func (g *Gate) WriteScratchFile(path string, data []byte) error {
	validatedPath, err := g.ValidatePath(path)
	if err != nil {
		return err
	}
	if !g.IsScratch(validatedPath) {
		return errors.New("fsgate: write blocked outside /scratch")
	}
	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(validatedPath), 0755); err != nil {
		return err
	}
	return os.WriteFile(validatedPath, data, 0644)
}

// DeleteScratchFile deletes a file within the scratch directory.
func (g *Gate) DeleteScratchFile(path string) error {
	validatedPath, err := g.ValidatePath(path)
	if err != nil {
		return err
	}
	if !g.IsScratch(validatedPath) {
		return errors.New("fsgate: delete blocked outside /scratch")
	}
	return os.Remove(validatedPath)
}

// MarkHiddenSystem marks a directory as Hidden and System.
// This is platform dependent.
func (g *Gate) MarkHiddenSystem(path string) error {
	return markHiddenSystem(path)
}
