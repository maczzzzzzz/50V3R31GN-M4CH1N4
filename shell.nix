{ pkgs ? import (fetchTarball "https://github.com/nixos/nixpkgs/archive/nixos-unstable.tar.gz") {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_22
    pnpm
    go
    sqlite
    git
    ripgrep
    llama-cpp
    python312
    python312Packages.pip
    python312Packages.huggingface-hub
    zlib
    zstd
    # GPU / RADV Tools
    vulkan-tools
    vulkan-loader
    mesa-demos
    mesa
    pciutils
    usbutils
    rocmPackages.rocminfo
    rocmPackages.clr
  ];

  shellHook = ''
    export PROJECT_ROOT=$(pwd)
    export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
    export CRUSH_DB_PATH="$PROJECT_ROOT/.crush/crush.db"

    # Driver paths for WSL
    export LD_LIBRARY_PATH="/usr/lib/wsl/lib:${pkgs.stdenv.cc.cc.lib}/lib:${pkgs.zlib}/lib:${pkgs.zstd.out}/lib:${pkgs.vulkan-loader}/lib:${pkgs.mesa}/lib''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
    
    echo "◈ ASP.GM-Agent: Node B (NixOS/WSL) Environment Loaded [GPU: RADV/Vulkan]."
    echo "◈ Node.js: $(node --version)"
    echo "◈ Go: $(go version)"
    echo "◈ GPU Search: $(ls /dev/dxg 2>/dev/null || echo 'NOT FOUND')"
  '';
}
