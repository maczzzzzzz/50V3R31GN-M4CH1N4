{ config, pkgs, ... }:

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

  # Tailscale package provided by tailscale.nix module when enabled


  networking = {
    hostName = "node-a";
    interfaces.enp3s0f1.ipv4.addresses = [{
      address = "10.0.0.10";
      prefixLength = 24;
    }];
    defaultGateway = "10.0.0.1";
    nameservers = [ "1.1.1.1" "8.8.8.8" ];
  };

  # Hardware-specific identifier for Node A
  systemd.network.links."10-node-a-nic" = {
    matchConfig.MACAddress = "98:29:a6:33:2a:93";
    linkConfig.Name = "enp3s0f1";
  };

  # Physical Disk Mapping (Btrfs root + VFAT boot)
  fileSystems."/" = {
    device = "/dev/disk/by-uuid/8b806590-882d-44e7-b03d-0a8e52ded422";
    fsType = "btrfs";
    options = [ "subvol=@" ];
  };

  fileSystems."/home" = {
    device = "/dev/disk/by-uuid/8b806590-882d-44e7-b03d-0a8e52ded422";
    fsType = "btrfs";
    options = [ "subvol=@home" ];
  };

  fileSystems."/boot" = {
    device = "/dev/disk/by-uuid/F014-1CC5";
    fsType = "vfat";
  };

  swapDevices = [ { device = "/dev/disk/by-uuid/d4c38328-463c-4089-9aab-00a25196bc34"; } ];

  # Tailscale Zero-Trust Artery
  sovereign.tailscale.enable = true;

  # Mesh Runtime (NVIDIA)
  sovereign.mesh-runtime = {
    enable = true;
    nodeType = "nvidia";
  };

  # Hermes-LCM: Primary Storage Node (Synapse Cache)
  services.hermes-lcm = {
    enable = true;
    dbPath = "/var/lib/hermes-lcm/memory.db";
    isPrimary = true;
    syncNodes = [ "100.66.173.31" "100.120.225.12" ];  # Node B, Node D
    syncInterval = "*/5 * * * *";  # Every 5 minutes
    sshUser = "maczz";
  };

  # Laptop Power Management: No power off/suspend on lid close
  services.logind.extraConfig = ''
    HandleLidSwitch=ignore
    HandleLidSwitchExternalPower=ignore
    HandleLidSwitchDocked=ignore
  '';
}
