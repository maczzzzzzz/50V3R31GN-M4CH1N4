package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strings"
	"time"
)

/**
 * SOVEREIGN ATOMIC PROFILE ENGINE — PHASE 76 TASK 1
 *
 * Structured YAML/Markdown parser, persistent file watcher,
 * idempotent Mooncake-KV sync, VSB IDENTITY_SWITCH emission,
 * and Deterministic Hardgate for permission_policy invariants.
 */

// Profile represents a SOVEREIGN-IDENTITY.md atomic context profile.
type Profile struct {
	Name                string `json:"name"`
	InferencePreference string `json:"inference_preference"`
	PermissionPolicy    string `json:"permission_policy"`
	VaultTarget         string `json:"vault_target"`
}

func runProfileSwitch(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: crush profile <profile_name> [--override-policy]")
	}
	targetProfile := args[0]
	overridePolicy := false
	for _, a := range args[1:] {
		if a == "--override-policy" {
			overridePolicy = true
		}
	}

	fmt.Printf("◈ [ARTERY] Initiating Atomic Switch to: %s...\n", targetProfile)

	// 1. Read Identity Manifest
	manifestPath := "../SOVEREIGN-IDENTITY.md"
	content, err := os.ReadFile(manifestPath)
	if err != nil {
		return fmt.Errorf("failed to read identity manifest: %w", err)
	}

	// 2. Deterministic Hardgate — block permission_policy changes without explicit override
	currentName := parseActiveProfile(string(content))
	if currentName != "" {
		current, cErr := parseProfileFromManifest(string(content), currentName)
		target, tErr := parseProfileFromManifest(string(content), targetProfile)
		if cErr == nil && tErr == nil && current.PermissionPolicy != target.PermissionPolicy {
			if !overridePolicy {
				return fmt.Errorf(
					"HARDGATE VIOLATION: permission_policy change '%s' → '%s' blocked.\n"+
						"  INVARIANT: manual Strategist intervention required (pass --override-policy).",
					current.PermissionPolicy, target.PermissionPolicy,
				)
			}
			fmt.Println("⚠️  [HARDGATE] Policy override authorized by Strategist.")
		}
	}

	// 3. Parse Target Profile
	profile, err := parseProfileFromManifest(string(content), targetProfile)
	if err != nil {
		return err
	}

	// 4. Update ACTIVE_PROFILE in Manifest (structured, no regex)
	updatedContent := updateActiveProfile(string(content), targetProfile)
	if err := os.WriteFile(manifestPath, []byte(updatedContent), 0644); err != nil {
		return fmt.Errorf("failed to update identity manifest: %w", err)
	}

	// 5. Push to Mooncake (Node A) — idempotent retry
	if err := pushProfileToMooncakeRetry(profile, 3); err != nil {
		fmt.Printf("⚠️  [ARTERY] Mooncake sync failed (Node A might be offline): %v\n", err)
	} else {
		fmt.Println("◈ [ARTERY] Mooncake-KV synchronized.")
	}

	// 6. Broadcast SIGUSR1 to Artery Manager
	cmd := exec.Command("pkill", "-SIGUSR1", "artery_manager")
	if err := cmd.Run(); err != nil {
		fmt.Printf("⚠️  [ARTERY] SIGUSR1 broadcast failed (artery_manager not running?): %v\n", err)
	} else {
		fmt.Println("◈ [ARTERY] SIGUSR1 broadcasted to Artery Manager.")
	}

	// 7. Emit VSB IDENTITY_SWITCH packet to update Dashboard HUD
	if vsb, vsbErr := NewVsbWatcher("black_ice_state.mem"); vsbErr == nil {
		vsb.EmitIdentitySwitch(targetProfile)
		fmt.Println("◈ [ARTERY] VSB IDENTITY_SWITCH emitted.")
	}

	fmt.Printf("✅ [ARTERY] Atomic Switch Complete: %s active.\n", targetProfile)
	return nil
}

// parseActiveProfile extracts the current ACTIVE_PROFILE name from the manifest.
func parseActiveProfile(content string) string {
	for _, line := range strings.Split(content, "\n") {
		trimmed := strings.TrimSpace(line)
		if !strings.HasPrefix(trimmed, "ACTIVE_PROFILE:") {
			continue
		}
		val := strings.TrimPrefix(trimmed, "ACTIVE_PROFILE:")
		// Strip inline comment
		if idx := strings.Index(val, "#"); idx >= 0 {
			val = val[:idx]
		}
		val = strings.TrimSpace(val)
		val = strings.Trim(val, "[]")
		return strings.ToLower(strings.TrimSpace(val))
	}
	return ""
}

// parseProfileFromManifest uses structured line-by-line parsing — no regex.
// Profiles are encoded in Markdown list syntax under "### <name>" subsections.
func parseProfileFromManifest(content, name string) (*Profile, error) {
	// Split on "### " to find profile subsections
	sections := strings.Split(content, "\n### ")
	for _, section := range sections {
		firstNL := strings.Index(section, "\n")
		if firstNL < 0 {
			continue
		}
		sectionName := strings.TrimSpace(section[:firstNL])
		if sectionName != name {
			continue
		}
		p := &Profile{Name: name}
		for _, line := range strings.Split(section[firstNL+1:], "\n") {
			line = strings.TrimSpace(line)
			// Stop at next section heading or blank block separator
			if strings.HasPrefix(line, "##") {
				break
			}
			if !strings.HasPrefix(line, "- ") {
				continue
			}
			kv := strings.TrimPrefix(line, "- ")
			idx := strings.Index(kv, ": ")
			if idx < 0 {
				continue
			}
			key := strings.TrimSpace(kv[:idx])
			val := strings.TrimSpace(strings.Trim(kv[idx+2:], "\""))
			switch key {
			case "inference_preference":
				p.InferencePreference = val
			case "permission_policy":
				p.PermissionPolicy = val
			case "vault_target":
				p.VaultTarget = val
			}
		}
		if p.InferencePreference == "" && p.PermissionPolicy == "" {
			return nil, fmt.Errorf("profile '%s' found but has no parseable fields", name)
		}
		return p, nil
	}
	return nil, fmt.Errorf("profile '%s' not found in manifest", name)
}

// updateActiveProfile rewrites the ACTIVE_PROFILE line without regex.
func updateActiveProfile(content, name string) string {
	lines := strings.Split(content, "\n")
	for i, line := range lines {
		if strings.HasPrefix(strings.TrimSpace(line), "ACTIVE_PROFILE:") {
			lines[i] = fmt.Sprintf(
				"ACTIVE_PROFILE: [%s] # [BOOT_INVARIANT] — do not change without explicit Strategist approval",
				strings.ToUpper(name),
			)
			break
		}
	}
	return strings.Join(lines, "\n")
}

// pushProfileToMooncakeRetry sends the profile with exponential backoff retry.
func pushProfileToMooncakeRetry(p *Profile, maxAttempts int) error {
	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		if err := pushProfileToMooncake(p); err != nil {
			lastErr = err
			if attempt < maxAttempts {
				time.Sleep(time.Duration(attempt*200) * time.Millisecond)
				continue
			}
		} else {
			return nil
		}
	}
	return fmt.Errorf("after %d attempts: %w", maxAttempts, lastErr)
}

func pushProfileToMooncake(p *Profile) error {
	masterAddr := os.Getenv("MOONCAKE_MASTER")
	if masterAddr == "" {
		masterAddr = "10.0.0.10:6789"
	}

	conn, err := net.DialTimeout("tcp", masterAddr, 3*time.Second)
	if err != nil {
		return err
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(5 * time.Second)) //nolint:errcheck

	payload, _ := json.Marshal(p)

	// Protocol: [4-byte LE LEN] [JSON PAYLOAD]
	jsonLen := uint32(len(payload))
	lenBuf := []byte{
		byte(jsonLen),
		byte(jsonLen >> 8),
		byte(jsonLen >> 16),
		byte(jsonLen >> 24),
	}
	if _, err := conn.Write(lenBuf); err != nil {
		return fmt.Errorf("write len: %w", err)
	}
	if _, err := conn.Write(payload); err != nil {
		return fmt.Errorf("write payload: %w", err)
	}
	return nil
}

// StartIdentityWatcher polls SOVEREIGN-IDENTITY.md for mtime changes
// and triggers a Mooncake-KV re-sync when the file is manually edited.
func StartIdentityWatcher(manifestPath string) {
	go func() {
		var lastMod time.Time
		for {
			time.Sleep(500 * time.Millisecond)
			info, err := os.Stat(manifestPath)
			if err != nil {
				continue
			}
			mod := info.ModTime()
			if !lastMod.IsZero() && mod.After(lastMod) {
				fmt.Println("◈ [WATCHER] SOVEREIGN-IDENTITY.md changed — triggering auto-sync...")
				raw, err := os.ReadFile(manifestPath)
				if err != nil {
					fmt.Printf("⚠️  [WATCHER] Read error: %v\n", err)
					lastMod = mod
					continue
				}
				activeName := parseActiveProfile(string(raw))
				if activeName == "" {
					lastMod = mod
					continue
				}
				profile, err := parseProfileFromManifest(string(raw), activeName)
				if err != nil {
					fmt.Printf("⚠️  [WATCHER] Parse error: %v\n", err)
					lastMod = mod
					continue
				}
				if err := pushProfileToMooncakeRetry(profile, 3); err != nil {
					fmt.Printf("⚠️  [WATCHER] Mooncake sync failed: %v\n", err)
				} else {
					fmt.Printf("◈ [WATCHER] Mooncake-KV re-synchronized (%s).\n", activeName)
				}
				// Emit VSB IDENTITY_SWITCH for HUD update
				if vsb, vsbErr := NewVsbWatcher("black_ice_state.mem"); vsbErr == nil {
					vsb.EmitIdentitySwitch(activeName)
				}
			}
			lastMod = mod
		}
	}()
}
