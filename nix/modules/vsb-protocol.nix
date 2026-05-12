# Nix module for VSB Protocol (Sovereign Model Bus)
{ config, lib, pkgs, ... }:

{
  options.services.vsb-protocol = {
    enable = lib.mkEnableOption "Enable VSB Model Router";
    mesh-nodes = lib.mkOption {
      type = lib.types.listOf (lib.types.attrsOf lib.types.str);
      default = [];
      description = "List of mesh nodes {id, ip, port, models}";
    };
    pulse-port = lib.mkOption {
      type = lib.types.int;
      default = 7878;
      description = "UDP pulse port for state sync";
    };
  };

  config = lib.mkIf config.services.vsb-protocol.enable {
    # VSB Router is deployed as Python plugin (submodule)
    # This module manages deployment config only

    networking.firewall.allowedUDPPorts = [ config.services.vsb-protocol.pulse-port ];

    # Mesh node discovery
    environment.etc."vsb-nodes.json".text = builtins.toJSON config.services.vsb-protocol.mesh-nodes;
  };
}
