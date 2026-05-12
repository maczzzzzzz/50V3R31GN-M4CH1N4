{ config, lib, pkgs, ... }:

{
  # Unified filesystem mapping for mesh nodes (Node A, C, D use Btrfs)
  fileSystems."/" = {
    device = lib.mkDefault "/dev/disk/by-label/nixos";
    fsType = "btrfs";
  };

  fileSystems."/boot" = {
    device = lib.mkDefault "/dev/disk/by-label/boot";
    fsType = "vfat";
  };

  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Set the state version to suppress warnings.
  system.stateVersion = "25.05"; 
}
