{ config, pkgs, lib, ... }:

{
  # Node B Omi Backend for Sovereign Voice Layer
  # Localized FastAPI service with Artery-based storage

  environment.systemPackages = with pkgs; [
    # Python Runtime for Omi Backend
    python3
    python3Packages.pip

    # FastAPI Dependencies
    python3Packages.fastapi
    python3Packages.uvicorn
    python3Packages.pydantic
    python3Packages.pydantic-settings

    # Storage Dependencies
    python3Packages.aiosqlite
    python3Packages.httpx

    # STT/TTS Dependencies (redirected to Node D)
    python3Packages.websockets
  ];

  # Omi Backend Service
  systemd.services.omi-backend = {
    description = "Omi Backend - Sovereign Voice Layer Service";
    after = [ "network.target" "tailscale.service" ];
    wants = [ "network-online.target" ];

    serviceConfig = {
      Type = "simple";
      User = "nixos";
      Group = "nixos";
      WorkingDirectory = "/var/lib/omi-backend";
      ExecStart = "${pkgs.python3Packages.uvicorn}/bin/uvicorn omi_backend.main:app --host 0.0.0.0 --port 8000";
      Restart = "on-failure";
      RestartSec = "5s";

      # Environment Variables
      Environment = [
        # Node B Tailscale IP
        "OMI_HOST=100.66.173.31"

        # Redirect STT to Node D (Whisper)
        "STT_ENDPOINT=http://100.120.225.12:8080/stt"

        # Redirect Storage to Node A (Synapse)
        "STORAGE_ENDPOINT=http://100.90.196.70:8000/storage"

        # Enable Artery mode
        "ARTERY_MODE=true"
      ];

      # Security Hardening
      ProtectSystem = "strict";
      ProtectHome = "true";
      PrivateTmp = "true";
      NoNewPrivileges = "true";
      ReadOnlyPaths = "/";
      ReadWritePaths = "/var/lib/omi-backend /var/log/omi-backend";
    };
  };

  # Network Access
  networking.firewall.allowedTCPPorts = [
    8000  # Omi Backend API
  ];

  # Create Omi Backend Directory
  systemd.tmpfiles.rules = [
    "d /var/lib/omi-backend 0755 nixos nixos -"
    "d /var/log/omi-backend 0755 nixos nixos -"
  ];
}
