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
	NodeCHost       string // NODE_C_HOST
	NodeCPort       string // NODE_C_PORT
	NodeDHost       string // NODE_D_HOST
	NodeDPort       string // NODE_D_PORT
	ClawlinkPort    string // CLAWLINK_PORT (VSB UDP port)
	SetupScriptPath string // full path to setup-resident-models.sh on Node A
	WindowsHostIP   string // WINDOWS_HOST_IP — override WSL2 auto-detection (default: empty = auto)
}

// defaults are the fallback values if the .env key is absent.
var defaultConfig = Config{
	NodeAHost:       "10.0.0.10",
	NodeAUser:       "maczz",
	NodeASSHPort:    "22",
	NodeALlamaURL:   "http://10.0.0.10:8080/v1",
	NodeCHost:       "10.0.0.12",
	NodeCPort:       "7339",
	NodeDHost:       "10.0.0.13",
	NodeDPort:       "8080",
	ClawlinkPort:    "7878",
	SetupScriptPath: "~/50V3R31GN-M4CH1N4/scripts/ops/node-a-mooncake-ignite.sh",
	WindowsHostIP:   "",
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
	if v, ok := env["NODE_C_HOST"]; ok && v != "" {
		Cfg.NodeCHost = v
	}
	if v, ok := env["NODE_C_PORT"]; ok && v != "" {
		Cfg.NodeCPort = v
	}
	if v, ok := env["NODE_D_HOST"]; ok && v != "" {
		Cfg.NodeDHost = v
	}
	if v, ok := env["NODE_D_PORT"]; ok && v != "" {
		Cfg.NodeDPort = v
	}
	if v, ok := env["CLAWLINK_PORT"]; ok && v != "" {
		Cfg.ClawlinkPort = v
	}
	if v, ok := env["NODE_A_SETUP_SCRIPT"]; ok && v != "" {
		Cfg.SetupScriptPath = v
	}
	if v, ok := env["WINDOWS_HOST_IP"]; ok && v != "" {
		Cfg.WindowsHostIP = v
	}
}

// ResolveWindowsHostIP returns the Windows host IP for WSL2 cross-boundary
// connections. If WINDOWS_HOST_IP is set in config it is used directly;
// otherwise the WSL2 default gateway (which IS the Windows host) is read
// from /etc/resolv.conf nameserver line.
func ResolveWindowsHostIP() string {
	if Cfg.WindowsHostIP != "" {
		return Cfg.WindowsHostIP
	}
	data, err := os.ReadFile("/etc/resolv.conf")
	if err != nil {
		return "localhost"
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "nameserver ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "nameserver "))
		}
	}
	return "localhost"
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
