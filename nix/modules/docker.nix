# Docker Infrastructure for Hybrid Sovereign Mesh
{ config, pkgs, lib, ... }:

with lib;
let
  cfg = config.sovereign.docker;
in
{
  options.sovereign.docker = {
    enable = mkEnableOption "Docker infrastructure for OCI container runtimes";

    enableNvidia = mkOption {
      type = types.bool;
      default = false;
      description = "Enable NVIDIA Container Toolkit for GPU passthrough";
    };
  };

  config = mkIf cfg.enable {
    virtualisation.docker = {
      enable = true;
      storageDriver = "overlay2";
    };

    virtualisation.docker.enableNvidia = cfg.enableNvidia;

    # Required for NVIDIA container toolkit to satisfy assertions
    hardware.graphics = mkIf cfg.enableNvidia {
      enable = true;
      enable32Bit = true;
    };

    # Add nixos user to docker group for non-root access
    users.users.nixos = {
      extraGroups = [ "docker" ];
    };
  };
}
