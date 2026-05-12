# Nix module for Consensus Alignment
{ config, lib, pkgs, ... }:

{
  options.services.consensus-alignment = {
    enable = lib.mkEnableOption "Enable Consensus Alignment hook";
    node-a-url = lib.mkOption {
      type = lib.types.str;
      default = "http://10.0.0.10:8000";
      description = "URL for Node A state ledger";
    };
  };

  config = lib.mkIf config.services.consensus-alignment.enable {
    systemd.services.consensus-alignment = {
      description = "Consensus Alignment - Architectural Coordination";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];
      serviceConfig = {
        ExecStart = "${pkgs.consensus-alignment}/bin/consensus-alignment";
        Restart = "always";
        RestartSec = "10s";
        Environment = [ "NODE_A_URL=${config.services.consensus-alignment.node-a-url}" ];
      };
    };
  };
}
