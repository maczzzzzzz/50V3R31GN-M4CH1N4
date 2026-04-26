//go:build windows
package handlers

import (
	"fmt"
	"syscall"
	"unsafe"
)

var (
	user32                  = syscall.NewLazyDLL("user32.dll")
	procFindWindowW         = user32.NewProc("FindWindowW")
	procSetForegroundWindow = user32.NewProc("SetForegroundWindow")
)

func focusWindow(title string) error {
	tPtr, err := syscall.UTF16PtrFromString(title)
	if err != nil {
		return err
	}

	hwnd, _, _ := procFindWindowW.Call(0, uintptr(unsafe.Pointer(tPtr)))
	if hwnd == 0 {
		return fmt.Errorf("window not found: %s", title)
	}

	ret, _, _ := procSetForegroundWindow.Call(hwnd)
	if ret == 0 {
		return fmt.Errorf("failed to set foreground window: %s", title)
	}

	return nil
}
