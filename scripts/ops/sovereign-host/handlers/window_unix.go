//go:build !windows
package handlers

import (
	"fmt"
)

func focusWindow(title string) error {
	// NOP for non-windows
	fmt.Printf("◈ [MOCK] FocusWindow: %s\n", title)
	return nil
}
