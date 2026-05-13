# NVIDIA Driver Module for Mesh Nodes (headless CUDA compute)
# Supports: RTX 2060 (Turing), GTX 1050 Ti (Pascal)
{ config, pkgs, lib, ... }:

with lib;
let
  cfg = config.sovereign.nvidia;
in
{
  options.sovereign.nvidia = {
    enable = mkEnableOption "NVIDIA proprietary driver for headless CUDA compute";

    package = mkOption {
      type = types.package;
      default = config.boot.kernelPackages.nvidiaPackages.stable;
      description = "NVIDIA driver package. Defaults to stable branch.";
    };

    open = mkOption {
      type = types.bool;
      default = false;
      description = "Use open-source NVIDIA kernel module (Turing+ only. RTX 2060 works with both but proprietary is more stable for compute).";
    };
  };

  config = mkIf cfg.enable {
    # Blacklist nouveau -- conflicts with proprietary driver
    boot.blacklistedKernelModules = [ "nouveau" "nvidiafb" ];

    # Load NVIDIA kernel modules
    boot.kernelModules = [ "nvidia" "nvidia_uvm" "nvidia_drm" "nvidia_modeset" ];

    # NVIDIA driver configuration
    hardware.nvidia = {
      modesetting.enable = true;
      open = cfg.open;
      package = cfg.package;
      nvidiaSettings = false;  # headless -- no GUI needed
    };

    # OpenGL/Vulkan support (required for CUDA interop and container passthrough)
    hardware.graphics = {
      enable = true;
      enable32Bit = true;
    };

    # nvidia-smi and utilities in PATH
    environment.systemPackages = [ cfg.package ];

    # Ensure NVIDIA persists across reboots (needed for CUDA)
    services.udev.extraRules = ''
      KERNEL=="nvidia_uvm", RUN+="${pkgs.kmod}/bin/modprobe nvidia_uvm"
      KERNEL=="nvidia_drm", RUN+="${pkgs.kmod}/bin/modprobe nvidia_drm"
    '';
  };
}
