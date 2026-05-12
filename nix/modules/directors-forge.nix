# Nix module for Director's Forge
{ config, lib, pkgs, ... }:

{
  options.services.directors-forge = {
    enable = lib.mkEnableOption "Enable Director's Forge tool factory";
    library-path = lib.mkOption {
      type = lib.types.path;
      default = "/var/lib/goat-tools";
      description = "Path for GOAT tool library";
    };
    output-path = lib.mkOption {
      type = lib.types.path;
      default = "/var/lib/hermes-tools";
      description = "Path for compiled Hermes tools";
    };
  };

  config = lib.mkIf config.services.directors-forge.enable {
    systemd.services.directors-forge = {
      description = "Director's Forge - Tool Factory";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];
      serviceConfig = {
        ExecStart = "${pkgs.directors-forge}/bin/directors-forge";
        Restart = "always";
        RestartSec = "10s";
      };
    };
  };
}
