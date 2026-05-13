{ config, pkgs, lib, self, nixos-wsl, ... }:

{
  imports = [
    nixos-wsl.nixosModules.default
    ./../shared/common.nix
    ./../../modules/inference-engine.nix
    ./../../modules/sovereign-proxy.nix
    ./../../modules/network-optimization.nix
    ./../../modules/stagehand-env.nix
    ./../../modules/omi-backend.nix
    ./../../modules/hermes-lcm.nix
    ./../../modules/directors-forge.nix
    ./../../modules/zeroboot.nix
    ./../../modules/mesh-runtime.nix
    ./../../modules/docker.nix
    ./../../modules/tailscale.nix
  ];

  # WSL specific configuration
  wsl.enable = true;
  wsl.defaultUser = "nixos";
  wsl.useWindowsDriver = true;

  # Docker Infrastructure
  # (enabled via mesh-runtime.nix; no NVIDIA toolkit needed)
  # sovereign.docker.enable = true is set by mesh-runtime.nix

  # Disable firewall on WSL to avoid kernel module errors
  networking.firewall.enable = false;
  networking.networkmanager.enable = lib.mkForce false;

  # Enable Sovereign services
  services.directors-forge.enable = true;
  services.zeroboot.enable = true;

  # Node B Inference (Instant Responsiveness)
  services.ik-llama = {
    enable = true;
    # Carnice-9B Q8_0: Qwen3.5-9B fine-tuned for Hermes Agent traces
    package = pkgs.unstable.llama-cpp;
    modelPath = "/var/lib/hermes/models/Carnice-9b-Q8_0.gguf";
    port = 8080;
    ctxSize = 32000;
    cacheTypeK = "q8_0";
    gpuLayers = 99; # Offload all layers to AMD Vulkan
    memoryMax = "12G"; # Bounded for 16GB VRAM system
  };

  # Sovereign Proxy (LiteLLM Routing)
  services.sovereign-proxy = {
    enable = true;
    configPath = "${./../../modules/litellm-mesh.yaml}";
    port = 4000;
  };

  # Enable nix-ld for generic binaries (e.g. Droid CLI, Electron)
  programs.nix-ld.enable = true;
  programs.nix-ld.libraries = with pkgs; [
    stdenv.cc.cc
    zlib
    openssl
    curl
    glib
  ];

  environment.systemPackages = with pkgs; [
    docker
    docker-compose
    git
    vim
    curl
    wget
  ];

  # Hermes-LCM: Sync Node (receives database from Node A)
  services.hermes-lcm = {
    enable = true;
    dbPath = "/var/lib/hermes-lcm/memory.db";
    isPrimary = false;
    primaryNode = "100.90.196.70";  # Node A
    sshUser = "maczz";
  };

  # Tailscale Zero-Trust Artery
  sovereign.tailscale.enable = true;

  # Docker Infrastructure
  sovereign.docker.enable = true;

  # Mesh Runtime (AMD) - DISABLED until hardware bridge is fixed
  sovereign.mesh-runtime = {
    enable = false;
    nodeType = "amd";
  };

  system.stateVersion = "25.11";
}
