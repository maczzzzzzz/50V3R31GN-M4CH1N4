{ config, lib, pkgs, ... }:

{
  imports = [
    <nixos-wsl/modules>
  ];

  wsl.enable = true;
  wsl.defaultUser = "nixos";
  wsl.useWindowsDriver = true;

  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  # Enable Hardware Acceleration (RADV for AMD)
  hardware.graphics = {
    enable = true;
    enable32Bit = true;
  };

  environment.systemPackages = with pkgs; [
    nodejs
    pnpm
    git
    pciutils
    usbutils
    vulkan-tools
    mesa-demos
    mesa
    rocmPackages.rocminfo
  ];

  environment.sessionVariables = {
    MESA_LOADER_DRIVER_OVERRIDE = "zink";
    GALLIUM_DRIVER = "zink";
  };

  system.stateVersion = "25.11";
}
