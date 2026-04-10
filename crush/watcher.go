package main

import (
	"fmt"
	"os"
	"syscall"
	"time"
	"unsafe"
)

const (
	VsbMapSize          = 4096
	Magic               = "BLACK-ICE-RADAR\x00" // 16 bytes
	ProposalOffset      = 1024
	ProposalSize        = 302 // Matches IntentPacket size for simplicity
	SovereignModeOffset = 2048

	// Phase 40: Tactical Heat Radar
	// Layout: active(1) | heat(1) | public(1) = 3 bytes
	RadarOffset = 3072

	// Phase 39: Transient biometric hover slot.
	// Layout: active(1) | id(16) | type(8) | x_f32(4) | y_f32(4) | imgPath(100) = 133 bytes
	HoveredUnitOffset = 3205
	HoveredUnitSize   = 133
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

// WriteRadar updates the tactical heat radar slot.
func (w *VsbWatcher) WriteRadar(active bool, heat uint8, public bool) {
	if active {
		w.mmap[RadarOffset] = 0x01
	} else {
		w.mmap[RadarOffset] = 0x00
	}
	w.mmap[RadarOffset+1] = heat
	if public {
		w.mmap[RadarOffset+2] = 0x01
	} else {
		w.mmap[RadarOffset+2] = 0x00
	}
}

// ReadHoveredUnit reads the Phase 39 transient biometric hover slot.
// Returns active=false if no unit is currently hovered.
func (w *VsbWatcher) ReadHoveredUnit() (active bool, id, unitType, imgPath string, x, y float32) {
	base := HoveredUnitOffset
	if int(base+HoveredUnitSize) > len(w.mmap) {
		return
	}
	active = w.mmap[base] == 0x01
	if !active {
		return
	}
	id       = nullStr(w.mmap[base+1 : base+17])
	unitType = nullStr(w.mmap[base+17 : base+25])
	xBytes   := [4]byte{w.mmap[base+25], w.mmap[base+26], w.mmap[base+27], w.mmap[base+28]}
	yBytes   := [4]byte{w.mmap[base+29], w.mmap[base+30], w.mmap[base+31], w.mmap[base+32]}
	imgPath  = nullStr(w.mmap[base+33 : base+133])
	// Reinterpret bytes as float32 via uint32
	xBits := uint32(xBytes[0]) | uint32(xBytes[1])<<8 | uint32(xBytes[2])<<16 | uint32(xBytes[3])<<24
	yBits := uint32(yBytes[0]) | uint32(yBytes[1])<<8 | uint32(yBytes[2])<<16 | uint32(yBytes[3])<<24
	x = float32FromBits(xBits)
	y = float32FromBits(yBits)
	return
}

func nullStr(b []byte) string {
	end := len(b)
	for i, c := range b {
		if c == 0 {
			end = i
			break
		}
	}
	return string(b[:end])
}

func float32FromBits(bits uint32) float32 {
	return *(*float32)(unsafe.Pointer(&bits))
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
