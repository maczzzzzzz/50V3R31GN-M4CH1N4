{
  description = "ASP.GM-Agent: Node B (The Director) Development Shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          # Node.js Stack (Node B Core)
          nodejs_22
          nodePackages.typescript
          nodePackages.tsx
          nodePackages.pnpm
          
          # Database (RKG / Akashik.db)
          sqlite
          
          # CLI Management (Crush CLI)
          go_1_22
          
          # Sidecar Build Requirements (Rust)
          cargo
          rustc
          pkg-config
          libxcb
          libxkbcommon
          wayland
          
          # Utilities
          ripgrep
          fd
          git
        ];

        shellHook = ''
          export PROJECT_ROOT=$(pwd)
          export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
          export CRUSH_DB_PATH="$PROJECT_ROOT/.crush/crush.db"
          export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath (with pkgs; [ libxcb libxkbcommon wayland ])}:$LD_LIBRARY_PATH"
          
          echo "◈ ASP.GM-Agent: Node B (NixOS/WSL) Environment Loaded."
          echo "◈ RKG Path: $AKASHIK_DB_PATH"
          echo "◈ Node.js: $(node --version)"
          echo "◈ Go: $(go version)"
        '';
      };
    };
}
