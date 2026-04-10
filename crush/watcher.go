package main

import (
	"fmt"
	"os"
	"syscall"
	"time"
	"unsafe"
)

const (
	VsbMapSize      = 4096
	Magic           = "BLACK-ICE-RADAR\x00" // 16 bytes
	ProposalOffset  = 1024
	ProposalSize    = 302 // Matches IntentPacket size for simplicity
	SovereignModeOffset = 2048
)

// ProposalStatus mirrors the VSB schema.
type ProposalStatus uint8

const (
	StatusPending  ProposalStatus = 0x00
	StatusApproved ProposalStatus = 0x01
	StatusRejected ProposalStatus = 0x02
	StatusCommitted ProposalStatus = 0x03
)

// Proposal mirrors the binary layout in VSB.
type Proposal struct {
	ID         uint32
	Origin     uint8
	ActionType uint8
	Status     ProposalStatus
	Reserved   uint8
	Payload    [256]byte
}

type VsbWatcher struct {
	mmap []byte
}

func NewVsbWatcher(path string) (*VsbWatcher, error) {
	// Check if file exists to decide if we need to init magic
	_, statErr := os.Stat(path)
	isNew := os.IsNotExist(statErr)

	// Enforce 0600 permissions
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0600)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	// Ensure file is large enough
	if err := f.Truncate(int64(VsbMapSize)); err != nil {
		return nil, err
	}

	data, err := syscall.Mmap(int(f.Fd()), 0, VsbMapSize, syscall.PROT_READ|syscall.PROT_WRITE, syscall.MAP_SHARED)
	if err != nil {
		return nil, err
	}

	if isNew {
		// Initialize magic bytes for new file
		copy(data[:len(Magic)], Magic)
	} else {
		// Validate magic bytes
		if string(data[:len(Magic)]) != Magic {
			syscall.Munmap(data)
			return nil, fmt.Errorf("invalid VSB magic bytes — unauthorized or corrupted shared memory")
		}
	}

	return &VsbWatcher{mmap: data}, nil
}

func (w *VsbWatcher) GetProposal() *Proposal {
	// Simple pointer arithmetic to read the struct from mmap
	return (*Proposal)(unsafe.Pointer(&w.mmap[ProposalOffset]))
}

func (w *VsbWatcher) SetStatus(status ProposalStatus) {
	p := w.GetProposal()
	p.Status = status
	// Clear the ID after commitment/rejection to prevent the watcher from 
	// re-triggering the same proposal if the loop speed is faster than the status sync.
	if status == StatusApproved || status == StatusRejected {
		p.ID = 0
	}
}

func (w *VsbWatcher) ToggleSovereignMode(on bool) {
	if on {
		w.mmap[SovereignModeOffset] = 0x01
	} else {
		w.mmap[SovereignModeOffset] = 0x00
	}
}

// Watch runs a background loop to detect PENDING proposals.
func (w *VsbWatcher) Watch(onPending func(*Proposal)) {
	go func() {
		for {
			p := w.GetProposal()
			if p.Status == StatusPending && p.ID != 0 {
				onPending(p)
			}
			time.Sleep(100 * time.Millisecond)
		}
	}()
}
