package main

import (
	"fmt"
	"os"
	"time"
)

const (
	mmapMagic      = "BLACK-ICE-RADAR\x00"
	mmapMagicLen   = 16
	defaultMemPath = "black_ice_state.mem"
)

func checkIntegrity(filePath string) {
	f, err := os.Open(filePath)
	if err != nil {
		fmt.Printf("◈ VSB Integrity: MISSING — %v\n", err)
		os.Exit(1)
	}
	defer f.Close()

	buf := make([]byte, mmapMagicLen)
	if _, err := f.ReadAt(buf, 0); err != nil {
		fmt.Printf("◈ VSB Integrity: READ_ERROR — %v\n", err)
		os.Exit(1)
	}

	if string(buf) == mmapMagic {
		fmt.Println("◈ VSB Integrity: VALID")
		os.Exit(0)
	} else {
		fmt.Printf("◈ VSB Integrity: CORRUPTED — magic mismatch (got: %q)\n", buf)
		os.Exit(1)
	}
}

func main() {
	// --check mode: validate magic bytes and exit
	for _, arg := range os.Args[1:] {
		if arg == "--check" {
			path := defaultMemPath
			// Allow: --check <path>
			for i, a := range os.Args[1:] {
				if a == "--check" && i+1 < len(os.Args[1:]) {
					path = os.Args[i+2]
				}
			}
			checkIntegrity(path)
			return
		}
	}

	filePath := defaultMemPath
	if len(os.Args) > 1 {
		filePath = os.Args[1]
	}

	f, err := os.OpenFile(filePath, os.O_RDWR, 0600)
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		os.Exit(1)
	}
	defer f.Close()

	// Blast garbage into the magic byte section (0-15) every 10ms for 2 seconds
	garbage := []byte("GARBAGE-BYTES!!\000")
	
	fmt.Println("[Corruptor] Starting Mmap magic byte corruption...")
	for i := 0; i < 200; i++ {
		_, err := f.WriteAt(garbage, 0)
		if err != nil {
			fmt.Printf("Error writing: %v\n", err)
		}
		
		// Write massive invalid count to cause buffer overflow if unhandled
		countGarbage := []byte{0xFF, 0xFF, 0xFF, 0xFF}
		f.WriteAt(countGarbage, 20)

		time.Sleep(10 * time.Millisecond)
	}
	fmt.Println("[Corruptor] Finished corruption sequence.")
}
