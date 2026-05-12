{ config, pkgs, lib, ... }:

{
  # Node D Hermes Core Provisioning
  # The Heavy-Hitter: Unrestricted Observer and Active Coding Partner

  environment.systemPackages = with pkgs; [
    # Core Hermes Runtime
    python3
    python3Packages.pip
    nodejs_20

    # Creative Suite Dependencies
    ffmpeg           # hyperframes, ascii-video, pretext
    chafa            # ASCII art rendering
    bun              # Herm TUI installation

    # Browser Harness
    chromium         # GUI interactions via browser-harness

    # Build Tools
    cmake
    ninja
    gcc
  ];

  # Network Services
  networking.firewall.allowedTCPPorts = [
    8000  # Hermes API
    8080  # IK Llama.cpp
    8642  # Hermes Agent (v0.13.0+)
    9119  # Hermes Web UI
  ];

  networking.firewall.allowedUDPPorts = [
    7878  # VSB Pulse sync
  ];

  # Model Storage
  systemd.tmpfiles.rules = [
    "d /var/lib/hermes/models 0755 nixos nixos -"
    "d /home/hermes/.hermes 0755 hermes hermes -"
  ];

  # User Configuration for Hermes
  users.users.hermes = {
    isNormalUser = true;
    description = "Hermes Agent Runtime";
    extraGroups = [ "networkmanager" ];
  };
}
