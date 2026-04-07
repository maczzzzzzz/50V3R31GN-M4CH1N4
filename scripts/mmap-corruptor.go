package main

import (
	"fmt"
	"os"
	"time"
)

func main() {
	filePath := "black_ice_state.mem"
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
