package main

import (
	"os"
	"strconv"
)

// Config holds all runtime configuration for crush, sourced from env vars.
type Config struct {
	NodeAHost       string // NODE_A_HOST — IP of Node A (ZeroClaw)
	ClawlinkPort    string // CLAWLINK_PORT — ZeroClaw TCP port
	ClawlinkSock    string // CLAWLINK_SOCK — Unix socket path for proxy
	ClawlinkTimeout int    // CLAWLINK_TIMEOUT — per-request timeout in ms
	DashboardPort   string // DASHBOARD_PORT — WebSocket port for telemetry broadcast
}

// Cfg is the package-level config loaded at startup.
var Cfg = loadConfig()

func loadConfig() Config {
	return Config{
		NodeAHost:       getEnv("NODE_A_HOST", "192.168.0.50"),
		ClawlinkPort:    getEnv("CLAWLINK_PORT", "7878"),
		ClawlinkSock:    getEnv("CLAWLINK_SOCK", "/run/crush/clawlink.sock"),
		ClawlinkTimeout: getEnvInt("CLAWLINK_TIMEOUT", 5000),
		DashboardPort:   getEnv("DASHBOARD_PORT", "9090"),
	}
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
