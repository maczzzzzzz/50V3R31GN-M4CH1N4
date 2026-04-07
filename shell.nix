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
  ];

  shellHook = ''
    export PROJECT_ROOT=$(pwd)
    export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
    export CRUSH_DB_PATH="$PROJECT_ROOT/.crush/crush.db"
    
    # Fix for libstdc++, libz, and libzstd missing in some python extensions
    export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib}/lib:${pkgs.zlib}/lib:${pkgs.zstd.out}/lib''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
    
    echo "◈ ASP.GM-Agent: Node B (NixOS/WSL) Environment Loaded via shell.nix"
    echo "◈ Node.js: $(node --version)"
    echo "◈ Go: $(go version)"
  '';
}
