{ config, pkgs, lib, ... }:

{
  services.openssh = {
    enable = true;
    settings = {
      # Password auth disabled — use SSH keys only.
      # For initial bootstrap, temporarily re-enable and deploy keys via:
      #   ssh-copy-id nixos@<node-ip>
      PasswordAuthentication = false;
      KbdInteractiveAuthentication = false;
      PermitRootLogin = "no";
    };
  };

  users.users.nixos = {
    isNormalUser = true;
    extraGroups = [ "wheel" "networkmanager" "docker" ];
  };

  users.users.maczz = {
    isNormalUser = true;
    extraGroups = [ "wheel" "networkmanager" "docker" ];
  };

  # Safety assertion: prevent accidental defaultUser changes that cause lockout
  assertions = [{
    assertion = config.wsl.enable -> config.wsl.defaultUser == "nixos";
    message = "BLOCKED: wsl.defaultUser must be 'nixos'. Changing it breaks WSL auto-login and locks out the primary user.";
  }];

  networking.networkmanager.enable = true;
  networking.useDHCP = lib.mkDefault true;

  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  
  environment.variables = {
    RUST_LOG = "info";
    GSETTINGS_SCHEMA_DIR = "${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}";
  };

  environment.extraInit = ''
    export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"
  '';
  
  environment.systemPackages = with pkgs; [
    vim
    git
    htop
    netcat
    pciutils
  ];
}
