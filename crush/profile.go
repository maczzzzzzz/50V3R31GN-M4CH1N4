package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"regexp"
	"strings"
)

/**
 * SOVEREIGN ATOMIC PROFILE ENGINE - CRUSH INTEGRATION
 * 
 * Manages the /profile command to trigger real-time context switching.
 */

type Profile struct {
	Name                string `json:"name"`
	InferencePreference string `json:"inference_preference"`
	PermissionPolicy    string `json:"permission_policy"`
	VaultTarget         string `json:"vault_target"`
}

func runProfileSwitch(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: crush profile <profile_name>")
	}
	targetProfile := args[0]

	fmt.Printf("◈ [ARTERY] Initiating Atomic Switch to: %s...\n", targetProfile)

	// 1. Read Identity Manifest
	manifestPath := "../SOVEREIGN-IDENTITY.md"
	content, err := os.ReadFile(manifestPath)
	if err != nil {
		return fmt.Errorf("failed to read identity manifest: %w", err)
	}

	// 2. Parse Profile Data
	profile, err := parseProfileFromManifest(string(content), targetProfile)
	if err != nil {
		return err
	}

	// 3. Update ACTIVE_PROFILE in Manifest
	updatedContent := updateActiveProfile(string(content), targetProfile)
	if err := os.WriteFile(manifestPath, []byte(updatedContent), 0644); err != nil {
		return fmt.Errorf("failed to update identity manifest: %w", err)
	}

	// 4. Push to Mooncake (Node A)
	if err := pushProfileToMooncake(profile); err != nil {
		fmt.Printf("⚠️  [ARTERY] Mooncake sync failed (Node A might be offline): %v\n", err)
	} else {
		fmt.Println("◈ [ARTERY] Mooncake-KV synchronized.")
	}

	// 5. Broadcast SIGUSR1 to Artery Manager
	cmd := exec.Command("pkill", "-SIGUSR1", "artery_manager")
	if err := cmd.Run(); err != nil {
		fmt.Printf("⚠️  [ARTERY] SIGUSR1 broadcast failed (artery_manager not running?): %v\n", err)
	} else {
		fmt.Println("◈ [ARTERY] SIGUSR1 broadcasted to Artery Manager.")
	}

	fmt.Printf("✅ [ARTERY] Atomic Switch Complete: %s active.\n", targetProfile)
	return nil
}

func parseProfileFromManifest(content, name string) (*Profile, error) {
	// Simple regex-based parsing for this pass
	re := regexp.MustCompile(fmt.Sprintf("### %s\\n- inference_preference: \"(.*?)\"\\n- permission_policy: \"(.*?)\"\\n- vault_target: \"(.*?)\"", name))
	matches := re.FindStringSubmatch(content)
	if len(matches) < 4 {
		return nil, fmt.Errorf("profile '%s' not found or malformed in manifest", name)
	}

	return &Profile{
		Name:                name,
		InferencePreference: matches[1],
		PermissionPolicy:    matches[2],
		VaultTarget:         matches[3],
	}, nil
}

func updateActiveProfile(content, name string) string {
	re := regexp.MustCompile(`ACTIVE_PROFILE: \[.*?\]`)
	return re.ReplaceAllString(content, fmt.Sprintf("ACTIVE_PROFILE: [%s]", strings.ToUpper(name)))
}

func pushProfileToMooncake(p *Profile) error {
	masterAddr := os.Getenv("MOONCAKE_MASTER")
	if masterAddr == "" {
		masterAddr = "10.0.0.10:6789"
	}

	conn, err := net.Dial("tcp", masterAddr)
	if err != nil {
		return err
	}
	defer conn.Close()

	payload, _ := json.Marshal(p)
	
	// Protocol: [4-byte LEN] [JSON PAYLOAD]
	lenBuf := make([]byte, 4)
	jsonLen := uint32(len(payload))
	lenBuf[0] = byte(jsonLen)
	lenBuf[1] = byte(jsonLen >> 8)
	lenBuf[2] = byte(jsonLen >> 16)
	lenBuf[3] = byte(jsonLen >> 24)

	conn.Write(lenBuf)
	conn.Write(payload)

	return nil
}
