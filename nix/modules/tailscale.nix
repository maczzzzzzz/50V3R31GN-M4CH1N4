# Nix module for Tailscale (Zero-Trust Artery)
{ config, lib, pkgs, ... }:

{
  options.sovereign.tailscale = {
    enable = lib.mkEnableOption "Enable Tailscale for zero-trust mesh networking";
  };

  config = lib.mkIf config.sovereign.tailscale.enable {
    # Install Tailscale
    environment.systemPackages = [ pkgs.tailscale ];

    # Enable native Tailscale service
    services.tailscale.enable = true;

    # Allow Tailscale port (41641 UDP for key exchange)
    networking.firewall.allowedUDPPorts = [ 41641 ];

    # Interactive login mode (for manual tailnet join via SSH)
    networking.firewall.checkReversePath = false;

    # Trust all traffic on the Tailscale overlay interface
    networking.firewall.trustedInterfaces = [ "tailscale0" ];

    # Mesh service ports (required on all nodes for container workloads)
    # 8000: Docker container API (vLLM/llama.cpp inference)
    # 8642: Hermes Agent gateway
    # 9119: Hermes Workspace UI
    networking.firewall.allowedTCPPorts = [ 8000 8642 9119 ];

    # NOTE: No headless/autoconnect service - use interactive login via SSH
    # Run: sudo tailscale up -ssh (opens browser for authentication)
  };
}
