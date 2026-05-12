# Mesh Runtime: Systemd-managed Docker Compose for AI inference containers
{ config, pkgs, lib, ... }:

with lib;
let
  cfg = config.sovereign.mesh-runtime;

  composeMap = {
    nvidia = ./../../sidecars/mesh/nvidia.yml;
    amd = ./../../sidecars/mesh/amd.yml;
    intel = ./../../sidecars/mesh/intel.yml;
  };

  composeFile = composeMap.${cfg.nodeType} or null;
in
{
  options.sovereign.mesh-runtime = {
    enable = mkEnableOption "Mesh runtime container orchestration";

    nodeType = mkOption {
      type = types.enum [ "nvidia" "amd" "intel" ];
      description = "GPU vendor type for this node's container runtime";
    };

    composePath = mkOption {
      type = types.str;
      default = "/etc/mesh/compose.yml";
      description = "Path to the deployed Docker Compose file (set by module)";
    };
  };

  config = mkIf cfg.enable {
    # Ensure Docker is enabled
    sovereign.docker.enable = true;

    # Deploy compose file to /etc/mesh/
    environment.etc."mesh/compose.yml" = {
      source = composeFile;
    };

    # Systemd service to manage docker-compose
    systemd.services.mesh-runtime = {
      description = "Sovereign Mesh Runtime (Docker Compose)";
      wantedBy = [ "multi-user.target" ];
      after = [ "docker.service" "network-online.target" ];
      wants = [ "docker.service" "network-online.target" ];
      requires = [ "docker.service" ];

      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        ExecStart = "${pkgs.docker}/bin/docker compose -f ${cfg.composePath} up -d";
        ExecStop = "${pkgs.docker}/bin/docker compose -f ${cfg.composePath} down";
        Restart = "on-failure";
        RestartSec = "15s";
      };
    };
  };
}
