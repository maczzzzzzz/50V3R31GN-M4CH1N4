package main

// config.go — Load runtime config from the project .env file.
//
// Reads KEY=VALUE pairs from $PROJECT_ROOT/.env (falling back to "../.env"
// relative to the binary). Values override the compiled-in defaults so that
// the operator can change Node A's IP without recompiling.

import (
	"bufio"
	"os"
	"strings"
)

// Config holds all environment-derived connection parameters.
type Config struct {
	NodeAHost       string // NODE_A_HOST
	NodeAUser       string // NODE_A_USER  (SSH login)
	NodeASSHPort    string // NODE_A_SSH_PORT (default "22")
	NodeALlamaURL   string // NODE_A_LLAMA_URL
	ClawlinkPort    string // CLAWLINK_PORT (VSB UDP port)
	SetupScriptPath string // full path to setup-resident-models.sh on Node A
}

// defaults are the fallback values if the .env key is absent.
var defaultConfig = Config{
	NodeAHost:       "192.168.0.50",
	NodeAUser:       "maczz",
	NodeASSHPort:    "22",
	NodeALlamaURL:   "http://192.168.0.50:8080/v1",
	ClawlinkPort:    "7878",
	SetupScriptPath: "~/asp-gm-agent-v0.9.1/zeroclaw/scripts/setup-resident-models.sh",
}

// Cfg is the global runtime config, populated by LoadConfig() at startup.
var Cfg = defaultConfig

// LoadConfig reads .env from the project root and overwrites Cfg.
// Missing file or missing keys are silently ignored — defaults stand.
func LoadConfig() {
	envPath := findEnvFile()
	if envPath == "" {
		return
	}

	f, err := os.Open(envPath)
	if err != nil {
		return
	}
	defer f.Close()

	env := parseEnv(f)

	if v, ok := env["NODE_A_HOST"]; ok && v != "" {
		Cfg.NodeAHost = v
	}
	if v, ok := env["NODE_A_USER"]; ok && v != "" {
		Cfg.NodeAUser = v
	}
	if v, ok := env["NODE_A_SSH_PORT"]; ok && v != "" {
		Cfg.NodeASSHPort = v
	}
	if v, ok := env["NODE_A_LLAMA_URL"]; ok && v != "" {
		Cfg.NodeALlamaURL = v
	}
	if v, ok := env["CLAWLINK_PORT"]; ok && v != "" {
		Cfg.ClawlinkPort = v
	}
	if v, ok := env["NODE_A_SETUP_SCRIPT"]; ok && v != "" {
		Cfg.SetupScriptPath = v
	}
}

// findEnvFile searches for a .env file relative to PROJECT_ROOT or the binary.
func findEnvFile() string {
	candidates := []string{}

	if root := os.Getenv("PROJECT_ROOT"); root != "" {
		candidates = append(candidates, root+"/.env")
	}

	// Try sibling directories (deck-igniter lives one level below the project root)
	if cwd, err := os.Getwd(); err == nil {
		candidates = append(candidates,
			cwd+"/.env",
			cwd+"/../.env",
			cwd+"/../../.env",
		)
	}

	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// parseEnv reads a KEY=VALUE file, stripping comments and blank lines.
func parseEnv(f *os.File) map[string]string {
	result := make(map[string]string)
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		idx := strings.IndexByte(line, '=')
		if idx < 0 {
			continue
		}
		key := strings.TrimSpace(line[:idx])
		val := strings.TrimSpace(line[idx+1:])
		// Strip inline comments.
		if ci := strings.Index(val, " #"); ci >= 0 {
			val = strings.TrimSpace(val[:ci])
		}
		result[key] = val
	}
	return result
}
