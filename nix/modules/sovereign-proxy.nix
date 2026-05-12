{ config, pkgs, lib, ... }:

with lib;
let
  cfg = config.services.sovereign-proxy;
in
{
  options.services.sovereign-proxy = {
    enable = mkEnableOption "Sovereign Proxy (LiteLLM)";

    port = mkOption {
      type = types.port;
      default = 4000;
      description = "Port for the LiteLLM proxy.";
    };

    configPath = mkOption {
      type = types.str;
      default = "${./litellm-mesh.yaml}";
      description = "Path to the LiteLLM configuration file.";
    };

    masterKey = mkOption {
      type = types.str;
      default = "sk-sovereign-mesh-proxy";
      description = "Master key for the LiteLLM proxy.";
    };
  };

  config = mkIf cfg.enable {
    # Open the configured proxy port in the firewall
    networking.firewall.allowedTCPPorts = [ cfg.port ];

    systemd.services.litellm = {
      description = "Sovereign Proxy (LiteLLM Container)";
      wantedBy = [ "multi-user.target" ];
      after = [ "docker.service" ];
      requires = [ "docker.service" ];

      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        WorkingDirectory = "/home/nixos/50V3R31GN-M4CH1N4/sidecars/mesh";
        ExecStart = "${pkgs.docker}/bin/docker compose -f proxy.yml up -d";
        ExecStop = "${pkgs.docker}/bin/docker compose -f proxy.yml down";
        User = "nixos";
      };
    };

    # Note: The HAProxy implementation is retained as a commented-out backup in the 
    # nix/modules/sovereign-proxy.nix file history for emergency rollback.
  };
}