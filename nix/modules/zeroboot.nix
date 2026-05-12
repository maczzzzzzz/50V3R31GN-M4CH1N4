# Nix module for Zeroboot Isolation
{ config, lib, pkgs, ... }:

{
  options.services.zeroboot = {
    enable = lib.mkEnableOption "Enable Zeroboot microVM isolation";
    workspace-path = lib.mkOption {
      type = lib.types.path;
      default = "/tmp/zeroboot";
      description = "Path for microVM workspaces";
    };
  };

  config = lib.mkIf config.services.zeroboot.enable {
    environment.systemPackages = [ pkgs.firecracker ];

    # Create workspace directory
    systemd.tmpfiles.rules = [
      "d ${config.services.zeroboot.workspace-path} 0755 root root -"
    ];
  };
}
