//go:build !windows

package fsgate

import "fmt"

func markHiddenSystem(path string) error {
	// No-op on Unix for testing
	fmt.Printf("[MOCK] Marking %s as Hidden/System\n", path)
	return nil
}
