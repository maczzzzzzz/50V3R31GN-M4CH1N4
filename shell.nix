{ pkgs ? import (fetchTarball "https://github.com/nixos/nixpkgs/archive/nixos-unstable.tar.gz") {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_22
    pnpm
    go
    sqlite
    git
    ripgrep
  ];

  shellHook = ''
    export PROJECT_ROOT=$(pwd)
    export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
    export CRUSH_DB_PATH="$PROJECT_ROOT/.crush/crush.db"
    
    echo "◈ ASP.GM-Agent: Node B (NixOS/WSL) Environment Loaded via shell.nix"
    echo "◈ Node.js: $(node --version)"
    echo "◈ Go: $(go version)"
  '';
}
