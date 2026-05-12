{ config, pkgs, lib, ... }:

{
  # Node B Stagehand Runtime for Sovereign Sniffer
  # Browser-based discovery and API reverse-engineering

  environment.systemPackages = with pkgs; [
    # Node.js Runtime for Stagehand
    nodejs_22

    # Playwright System Dependencies
    # Required for headless browser automation
    alsa-lib
    at-spi2-atk
    at-spi2-core
    cups
    dbus
    expat
    gcc
    glib
    gtk3
    libdrm
    libxkbcommon
    mesa
    nspr
    nss
    pango
    xorg.libX11
    xorg.libXcomposite
    xorg.libXdamage
    xorg.libXfixes
    xorg.libXrandr
    xorg.libXScrnSaver
    xorg.libXtst
  ];

  # Create Nix FHS environment for Stagehand
  # This isolates Node.js dependencies and Playwright browsers
  environment.etc."stagehand-shell.nix".text = ''
    { pkgs ? import <nixpkgs> {} }:
    pkgs.mkShell {
      buildInputs = with pkgs; [
        nodejs_22
        python3
        stdenv.cc.cc
      ];

      shellHook = "
        # Set up npm local prefix
        export NPM_CONFIG_PREFIX=\$PWD/.npm-stagehand
        export PATH=\$NPM_CONFIG_PREFIX/bin:\$PATH

        # Install @browserbase/stagehand if not present
        if [ ! -d \"\$NPM_CONFIG_PREFIX/lib/node_modules/@browserbase/stagehand\" ]; then
          echo \":: Installing Stagehand SDK...\"
          npm install -g @browserbase/stagehand --silent
        fi

        echo \":: Stagehand Runtime Ready ::\"
      ";
    }
  '';

  # Network access for Stagehand browser sessions
  networking.firewall.allowedTCPPorts = [
    9222  # Chrome DevTools Protocol (if needed for debugging)
  ];
}
