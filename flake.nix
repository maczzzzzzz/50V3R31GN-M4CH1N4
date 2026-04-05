{
  description = "ASP.GM-Agent: Node B (The Director) Development Shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      
      # Hardware-Optimized llama-cpp (Phase 25)
      llama-cpp-vulkan = pkgs.llama-cpp.override {
        vulkanSupport = true;
      };
      
      llama-cpp-cuda = pkgs.llama-cpp.override {
        cudaSupport = true;
      };
    in
    {
      devShells.${system} = {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js Stack (Node B Core)
            nodejs_22
            typescript
            pnpm
            bun
            
            # Database (RKG / Akashik.db)
            sqlite
            
            # CLI Management (Crush CLI)
            go
            
            # Sidecar Build Requirements (Rust)
            cargo
            rustc
            pkg-config
            openssl
            libxcb
            libxkbcommon
            wayland
            cmake
            clang
            python3
            python311Packages.pip

            # Hybrid v2 (NAPI-RS / Interop)
            napi-rs-cli
            protobuf

            # AI/Inference & GPU (Phase 25)
            llama-cpp-vulkan
            vulkan-loader
            vulkan-headers
            
            # Utilities
            ripgrep
            fd
            git
          ];

          shellHook = ''
            export PROJECT_ROOT=$(pwd)
            export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
            export CRUSH_DB_PATH="$PROJECT_ROOT/.crush/crush.db"
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath (with pkgs; [ openssl libxcb libxkbcommon wayland vulkan-loader ])}:$LD_LIBRARY_PATH"
            export OPENSSL_DIR="${pkgs.openssl.dev}"
            export OPENSSL_LIB_DIR="${pkgs.openssl.out}/lib"
            export OPENSSL_INCLUDE_DIR="${pkgs.openssl.dev}/include"
            
            # llama.cpp Vulkan Config
            export GGML_VULKAN=1
            
            echo "◈ ASP.GM-Agent: Node B (NixOS/WSL) Environment Loaded [GPU: Vulkan]."
            echo "◈ RKG Path: $AKASHIK_DB_PATH"
            echo "◈ Node.js: $(node --version)"
            echo "◈ Go: $(go version)"
          '';
        };

        cuda = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js Stack
            nodejs_22
            typescript
            pnpm
            
            # Database
            sqlite
            
            # CLI Management
            go
            
            # Sidecar Build Requirements (Rust)
            cargo
            rustc
            pkg-config
            openssl
            
            # AI/Inference & GPU (CUDA for Node A)
            llama-cpp-cuda
            cudatoolkit
            linuxPackages.nvidia_x11
            
            # Utilities
            ripgrep
            fd
            git
          ];

          shellHook = ''
            export PROJECT_ROOT=$(pwd)
            export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
            export CRUSH_DB_PATH="$PROJECT_ROOT/.crush/crush.db"
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath (with pkgs; [ openssl linuxPackages.nvidia_x11 cudatoolkit ])}:$LD_LIBRARY_PATH"
            export OPENSSL_DIR="${pkgs.openssl.dev}"
            export OPENSSL_LIB_DIR="${pkgs.openssl.out}/lib"
            export OPENSSL_INCLUDE_DIR="${pkgs.openssl.dev}/include"
            
            echo "◈ ASP.GM-Agent: Node A (NixOS/Ubuntu) Environment Loaded [GPU: CUDA]."
            echo "◈ RKG Path: $AKASHIK_DB_PATH"
          '';
        };
      };
    };
}
