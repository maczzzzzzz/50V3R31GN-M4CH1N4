package main

import (
	"bufio"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Config holds all runtime configuration for crush, sourced from env vars.
type Config struct {
	NodeAHost       string // NODE_A_HOST — IP of Node A (ZeroClaw)
	ClawlinkPort    string // CLAWLINK_PORT — ZeroClaw TCP port
	ClawlinkSock    string // CLAWLINK_SOCK — Unix socket path for proxy
	ClawlinkTimeout int    // CLAWLINK_TIMEOUT — per-request timeout in ms
	DashboardPort   string // DASHBOARD_PORT — WebSocket port for telemetry broadcast
	RedModeActive   bool   // RED_MODE_ACTIVE — if true, allows Akashik.db queries
}

// Cfg is the package-level config loaded at startup.
var Cfg Config

func init() {
	LoadEnv()
	Cfg = loadConfig()
}

func loadConfig() Config {
	return Config{
		NodeAHost:       getEnv("NODE_A_HOST", "100.102.95.43"),
		ClawlinkPort:    getEnv("CLAWLINK_PORT", "7878"),
		ClawlinkSock:    getEnv("CLAWLINK_SOCK", "/run/crush/clawlink.sock"),
		ClawlinkTimeout: getEnvInt("CLAWLINK_TIMEOUT", 15000),
		DashboardPort:   getEnv("DASHBOARD_PORT", "9090"),
		RedModeActive:   getEnvBool("RED_MODE_ACTIVE", false),
	}
}

// LoadEnv reads .env from the project root and injects into process environment.
func LoadEnv() {
	envPath := findEnvFile()
	if envPath == "" {
		return
	}

	f, err := os.Open(envPath)
	if err != nil {
		return
	}
	defer f.Close()

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
		if key != "" {
			if _, exists := os.LookupEnv(key); !exists {
				os.Setenv(key, val)
			}
		}
	}
}

func findEnvFile() string {
	candidates := []string{".env", "../.env", "../../.env"}
	if root := os.Getenv("PROJECT_ROOT"); root != "" {
		candidates = append(candidates, filepath.Join(root, ".env"))
	}
	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultVal
}

func getEnvBool(key string, defaultVal bool) bool {
	if v := os.Getenv(key); v != "" {
		v = strings.ToLower(v)
		return v == "true" || v == "1" || v == "on"
	}
	return defaultVal
}
