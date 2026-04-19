{
  description = "50V3R31GN-M4CH1N4: Node B (The Director) Development Shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        config = {
          allowUnfree = true;
          vulkanSupport = true;
          rocmSupport = true;
        };
      };
      identities = import ./nix/identities.nix { lib = pkgs.lib; };
      
      # Hardware-Optimized llama-cpp
      llama-cpp-vulkan = pkgs.llama-cpp.override {
        vulkanSupport = true;
        cudaSupport = false;
      };
      
      llama-cpp-rocm = pkgs.llama-cpp.override {
        rocmSupport = true;
        cudaSupport = false;
      };
      
      llama-cpp-cuda = pkgs.llama-cpp.override {
        cudaSupport = true;
      };

      # Specialized build for Pascal (GTX 1050 Ti)
      llama-cpp-pascal = llama-cpp-cuda.overrideAttrs (old: {
        cmakeFlags = (old.cmakeFlags or [ ]) ++ [
          "-DCMAKE_CUDA_ARCHITECTURES=61"
          "-DGGML_CUDA_F16=OFF"
        ];
      });
    in
    {
      devShells.${system} = {
        default = pkgs.mkShell {
          # REQUIRED: Set NIXPKGS_ALLOW_UNFREE=1 and pass --impure to use steam-run/cuda
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
            
            # generic linux binary support (for Droid / Factory AI)
            steam-run
            xdg-utils

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
            python312
            python312Packages.pip

            # R3D_V01D Theme Fonts (WSLg X-server / Obsidian / VS Code)
            hack-font
            jetbrains-mono

            # Hybrid v2 (NAPI-RS / Interop)
            napi-rs-cli
            protobuf

            # File utilities (required by reconstruct-palace.sh + mcp-daemon)
            rsync
            ripgrep

            # AI/Inference & GPU (RADV for AMD Vulkan)
            llama-cpp-vulkan
            vulkan-loader
            vulkan-headers
            vulkan-tools
            mesa-demos
            clinfo
            pciutils
            usbutils
            mesa
          ];

          shellHook = ''
            export PROJECT_ROOT=$(pwd)
            export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
            export CRUSH_DB_PATH="$PROJECT_ROOT/.crush/crush.db"

            # Phase 48: Sovereign Triad — Impure/Unfree mandates
            export NIXPKGS_ALLOW_UNFREE=1

            # Phase 51: Declarative Identity Forge — manifest SOUL and AGENTS on shell entry
            export SOVEREIGN_SOUL=${pkgs.lib.escapeShellArg identities.soul}
            export SOVEREIGN_AGENTS=${pkgs.lib.escapeShellArg identities.agents}
            printf '%s' "$SOVEREIGN_SOUL"   > "$PROJECT_ROOT/SOUL.md"
            printf '%s' "$SOVEREIGN_AGENTS" > "$PROJECT_ROOT/AGENTS.md"

            # WSL Performance Logic: AMD Radeon RX 9060 XT (D3D12/Vulkan Mapping)
            # In WSL, we use the Microsoft D3D12 loader for Vulkan
            export MESA_D3D12_DEFAULT_ADAPTER_NAME="AMD"

            # R3D_V01D Font Config — expose Hack + JetBrains Mono to WSLg X-server
            export FONTCONFIG_FILE="${pkgs.makeFontsConf { fontDirectories = [ pkgs.hack-font pkgs.jetbrains-mono ]; }}"

            # Mapped WSL Driver Path + Nix Store libs
            export LD_LIBRARY_PATH="/usr/lib/wsl/lib:${pkgs.lib.makeLibraryPath (with pkgs; [
              openssl
              libxcb
              libxkbcommon
              wayland
              vulkan-loader
              stdenv.cc.cc.lib
              mesa
            ])}:$LD_LIBRARY_PATH"

            export OPENSSL_DIR="${pkgs.openssl.dev}"
            export OPENSSL_LIB_DIR="${pkgs.openssl.out}/lib"
            export OPENSSL_INCLUDE_DIR="${pkgs.openssl.dev}/include"

            # DROID_FACTORY: Wrapped execution via steam-run for NixOS compatibility
            alias droid="steam-run /home/nixos/.local/bin/droid"

            # Phase 48: Sovereign Triad MCP Bridge — spawn background sidecar
            mkdir -p /run/crush 2>/dev/null || true
            MCP_PID_FILE="$PROJECT_ROOT/.gemini/tmp/mcp-daemon.pid"
            if [ ! -f "$MCP_PID_FILE" ] || ! kill -0 "$(cat "$MCP_PID_FILE")" 2>/dev/null; then
              mkdir -p "$PROJECT_ROOT/.gemini/tmp" "$PROJECT_ROOT/data/logs"
              npx tsx "$PROJECT_ROOT/scripts/dev/mcp-daemon.ts" \
                >> "$PROJECT_ROOT/data/logs/mcp-bridge.log" 2>&1 &
              disown $!
            fi

            echo "◈ 50V3R31GN-M4CH1N4: Node B (NixOS/WSL) Environment Loaded [GPU: RADV/Vulkan]."
            echo "◈ RKG Path: $AKASHIK_DB_PATH"
            echo "◈ DROID FACTORY: Enabled via 'droid' alias."
            echo "◈ MCP Bridge: .gemini/tmp/sovereign-mcp.sock"
          '';
        };

        # Phase 65: Optical Artery — Docling / ColPali PDF ingestion environment
        optical = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core runtime
            python312
            python312Packages.pip
            python312Packages.numpy
            python312Packages.pillow
            python312Packages.requests
            python312Packages.tqdm
            python312Packages.pyyaml

            # PDF utilities (native layer — poppler for page-to-image export)
            poppler-utils

            # Node.js (for LoreHarmonizer.ts integration)
            nodejs_22
            typescript

            # Database
            sqlite

            # Compression
            zstd

            # File utilities
            rsync
            ripgrep
          ];

          shellHook = ''
            export PROJECT_ROOT=$(pwd)
            export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
            export NIXPKGS_ALLOW_UNFREE=1

            # Mapped WSL Driver Path + Nix Store libs for AMD GPU
            export LD_LIBRARY_PATH="/usr/lib/wsl/lib:${pkgs.lib.makeLibraryPath (with pkgs; [
              vulkan-loader
              mesa
              zstd
              stdenv.cc.cc.lib
            ])}:$LD_LIBRARY_PATH"

            # PDF shard output directory
            export PDF_SHARD_DIR="$PROJECT_ROOT/data/ingest/pdf_shards"
            export PDF_SOURCE_DIR="$PROJECT_ROOT/docs/raw_data/core_rules"
            mkdir -p "$PDF_SHARD_DIR"

            # Install Docling + ColPali into a local venv if not already present
            VENV_DIR="$PROJECT_ROOT/.optical-venv"
            if [ ! -d "$VENV_DIR" ]; then
              echo "◈ [optical] Creating Python venv and installing Docling + ColPali (ROCm/GPU)..."
              python3 -m venv "$VENV_DIR"
              "$VENV_DIR/bin/pip" install --quiet --upgrade pip
              # Use the ROCm-enabled PyTorch index for AMD GPU support
              "$VENV_DIR/bin/pip" install --quiet \
                "docling>=2.0" \
                "colpali-engine>=0.3" \
                "chromadb>=0.5" \
                "fastapi" \
                "uvicorn" \
                "python-multipart" \
                "torch" "torchvision" "torchaudio" --index-url https://download.pytorch.org/whl/rocm6.1
              echo "◈ [optical] Venv ready."
            fi
            export OPTICAL_PYTHON="$VENV_DIR/bin/python"
            export PATH="$VENV_DIR/bin:$PATH"

            echo "◈ 50V3R31GN-M4CH1N4: OPTICAL ARTERY environment loaded."
            echo "◈ PDF Source: $PDF_SOURCE_DIR"
            echo "◈ Shard Output: $PDF_SHARD_DIR"
            echo "◈ Python: $OPTICAL_PYTHON"
          '';
        };

        cuda = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js Stack
            nodejs_22
            typescript
            pnpm
            steam-run
            xdg-utils
            
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
            llama-cpp-pascal
            cudaPackages.cudatoolkit
            cudaPackages.libcublas
            cudaPackages.libcufft
            cudaPackages.libcurand
            cudaPackages.libcusolver
            cudaPackages.libcusparse
            
            # Utilities
            ripgrep
            fd
            git
          ];

          shellHook = ''
            export PROJECT_ROOT=$(pwd)
            export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
            export CRUSH_DB_PATH="$PROJECT_ROOT/.crush/crush.db"
            export NIXPKGS_ALLOW_UNFREE=1
            
            # Driver-Sovereignty: Use surgical path for host drivers to avoid GLIBC mismatches
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath (with pkgs; [ 
              openssl 
              cudaPackages.cudatoolkit
              cudaPackages.libcublas
              cudaPackages.libcufft
              cudaPackages.libcurand
              cudaPackages.libcusolver
              cudaPackages.libcusparse
            ])}:/home/maczz/50V3R31GN-M4CH1N4/.gemini/lib/nvidia:/usr/lib/wsl/lib:$LD_LIBRARY_PATH"
            
            export OPENSSL_DIR="${pkgs.openssl.dev}"
            export OPENSSL_LIB_DIR="${pkgs.openssl.out}/lib"
            export OPENSSL_INCLUDE_DIR="${pkgs.openssl.dev}/include"

            # DROID_FACTORY: Wrapped execution via steam-run for NixOS compatibility
            alias droid="steam-run /home/nixos/.local/bin/droid"
            
            echo "◈ 50V3R31GN-M4CH1N4: Node A (NixOS/Ubuntu) Environment Loaded [GPU: AUTO/CUDA]."
            echo "◈ RKG Path: $AKASHIK_DB_PATH"
          '';
        };
      };
    };
}
