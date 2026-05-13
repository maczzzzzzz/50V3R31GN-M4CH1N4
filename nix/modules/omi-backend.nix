{ config, pkgs, lib, ... }:

{
  # OMI Backend module - placeholder
  # TODO: implement OMI backend service
  options.services.omi-backend = {
    enable = lib.mkEnableOption "OMI backend service";
  };

  config = lib.mkIf config.services.omi-backend.enable {
    # No-op placeholder
  };
}
