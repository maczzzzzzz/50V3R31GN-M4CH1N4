package main

import (
	"os"
	"testing"
)

func TestConfig_DefaultValues(t *testing.T) {
	os.Unsetenv("NODE_A_HOST")
	os.Unsetenv("CLAWLINK_PORT")
	os.Unsetenv("CLAWLINK_SOCK")
	os.Unsetenv("CLAWLINK_TIMEOUT")

	cfg := loadConfig()

	if cfg.NodeAHost != "10.0.0.10" {
		t.Errorf("NodeAHost = %q, want 10.0.0.10", cfg.NodeAHost)
	}
	if cfg.ClawlinkPort != "7878" {
		t.Errorf("ClawlinkPort = %q, want 7878", cfg.ClawlinkPort)
	}
	if cfg.ClawlinkSock != "/run/crush/clawlink.sock" {
		t.Errorf("ClawlinkSock = %q, want /run/crush/clawlink.sock", cfg.ClawlinkSock)
	}
	if cfg.ClawlinkTimeout != 15000 {
		t.Errorf("ClawlinkTimeout = %d, want 15000", cfg.ClawlinkTimeout)
	}
}

func TestConfig_EnvOverrides(t *testing.T) {
	os.Setenv("NODE_A_HOST", "10.0.0.1")
	os.Setenv("CLAWLINK_PORT", "9999")
	os.Setenv("CLAWLINK_SOCK", "/tmp/test.sock")
	os.Setenv("CLAWLINK_TIMEOUT", "3000")
	defer func() {
		os.Unsetenv("NODE_A_HOST")
		os.Unsetenv("CLAWLINK_PORT")
		os.Unsetenv("CLAWLINK_SOCK")
		os.Unsetenv("CLAWLINK_TIMEOUT")
	}()

	cfg := loadConfig()

	if cfg.NodeAHost != "10.0.0.1" {
		t.Errorf("NodeAHost = %q, want 10.0.0.1", cfg.NodeAHost)
	}
	if cfg.ClawlinkPort != "9999" {
		t.Errorf("ClawlinkPort = %q, want 9999", cfg.ClawlinkPort)
	}
	if cfg.ClawlinkSock != "/tmp/test.sock" {
		t.Errorf("ClawlinkSock = %q, want /tmp/test.sock", cfg.ClawlinkSock)
	}
	if cfg.ClawlinkTimeout != 3000 {
		t.Errorf("ClawlinkTimeout = %d, want 3000", cfg.ClawlinkTimeout)
	}
}
