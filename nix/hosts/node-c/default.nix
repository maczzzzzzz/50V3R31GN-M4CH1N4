{ config, pkgs, lib, ... }:

{
  imports = [
    ./../../modules/mesh-runtime.nix
    ./../../modules/docker.nix
  ];

  # Docker Infrastructure
  sovereign.docker = {
    enable = true;
    enableNvidia = true;
  };

  networking = {
    hostName = "node-c";
    # Note: Interface name should be verified for Node C if static mapping is needed.
    defaultGateway = "10.0.0.1";
    nameservers = [ "1.1.1.1" "8.8.8.8" ];
    useDHCP = lib.mkForce true;
  };

  # Physical Disk Mapping (Btrfs root + VFAT boot)
  fileSystems."/" = {
    device = "/dev/disk/by-uuid/72f37bb5-90d9-4269-913c-24af5b1ba29d";
    fsType = "btrfs";
    options = [ "subvol=@" ];
  };

  fileSystems."/home" = {
    device = "/dev/disk/by-uuid/72f37bb5-90d9-4269-913c-24af5b1ba29d";
    fsType = "btrfs";
    options = [ "subvol=@home" ];
  };

  fileSystems."/boot" = {
    device = "/dev/disk/by-uuid/93F8-EEE7";
    fsType = "vfat";
  };

  # Secondary Disk: SOVEREIGN_SOUL (500GB External SSD for Perception/Voice Cache)
  fileSystems."/mnt/sovereign_soul" = {
    device = "/dev/disk/by-uuid/511d1a67-a3c0-49f8-899d-e509eab53c1a";
    fsType = "ext4";
    # Essential for external drives to prevent boot locks if unplugged
    options = [ "nofail" "x-systemd.device-timeout=5s" ];
  };

  swapDevices = [ { device = "/dev/disk/by-uuid/eb66e61a-dca1-4a4c-876f-9daba5df76d8"; } ];

  # Tailscale Zero-Trust Artery
  sovereign.tailscale.enable = true;

  # Mesh Runtime (NVIDIA)
  sovereign.mesh-runtime = {
    enable = true;
    nodeType = "nvidia";
  };
}
