{ config, pkgs, lib, self, ... }:

{
  imports = [
    ./../../modules/hermes-core.nix
    ./../../modules/hermes-lcm.nix
    ./../../modules/inference-engine.nix
    ./../../modules/mesh-runtime.nix
    ./../../modules/docker.nix
  ];

  # Docker Infrastructure (enabled via mesh-runtime.nix; no NVIDIA toolkit needed)
  # sovereign.docker.enable = true is set by mesh-runtime.nix

  # Enable the Sovereign Inference Engine with explicit model path
  services.ik-llama = {
    enable = true;
    package = pkgs.llama_cpp_openvino;
    memoryMax = "36G";
    port = 8080;
    modelPath = "/var/lib/hermes/models/qwen2.5-coder-14b-instruct-q6_k.gguf";
    ctxSize = 32000; # Can be expanded if VRAM allows
  };

  networking = {
    hostName = "node-d";
    defaultGateway = "10.0.0.1";
    nameservers = [ "1.1.1.1" "8.8.8.8" ];
    useDHCP = lib.mkForce true;
  };

  # Physical Disk Mapping (Btrfs root + VFAT boot)
  fileSystems."/" = {
    device = "/dev/disk/by-uuid/c7eb0360-359c-4491-956c-3436cdf50a06";
    fsType = "btrfs";
    options = [ "subvol=@" ];
  };

  fileSystems."/home" = {
    device = "/dev/disk/by-uuid/c7eb0360-359c-4491-956c-3436cdf50a06";
    fsType = "btrfs";
    options = [ "subvol=@home" ];
  };

  fileSystems."/boot" = {
    device = "/dev/disk/by-uuid/D7A2-FA7B";
    fsType = "vfat";
  };

  swapDevices = [ { device = "/dev/disk/by-uuid/ae178cd6-56da-44db-a844-deb3498e69c7"; } ];

  # Tailscale Zero-Trust Artery
  sovereign.tailscale.enable = true;

  # Mesh Runtime (Intel)
  sovereign.mesh-runtime = {
    enable = true;
    nodeType = "intel";
  };

  # Hermes-LCM: Sync Node (receives database from Node A)
  services.hermes-lcm = {
    enable = true;
    dbPath = "/var/lib/hermes-lcm/memory.db";
    isPrimary = false;
    primaryNode = "100.90.196.70";  # Node A
    sshUser = "nixos";
  };
}
