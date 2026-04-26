//go:build windows

package fsgate

import (
	"syscall"
)

func markHiddenSystem(path string) error {
	pathPtr, err := syscall.UTF16PtrFromString(path)
	if err != nil {
		return err
	}
	// FILE_ATTRIBUTE_HIDDEN = 0x02
	// FILE_ATTRIBUTE_SYSTEM = 0x04
	return syscall.SetFileAttributes(pathPtr, syscall.FILE_ATTRIBUTE_HIDDEN|syscall.FILE_ATTRIBUTE_SYSTEM)
}
