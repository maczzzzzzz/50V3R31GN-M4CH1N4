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
      # Phase 73.2 — Obscura Stealth Browser (CDP sidecar, ~30MB RAM)
      # Deploy: nix build .#obscura && sudo cp result/bin/obscura /usr/local/bin/
      # On first build nix will print the correct hash — replace the fakeHash values.
      packages.${system}.obscura = 
        let
          v8_archive = pkgs.fetchurl {
            url = "https://github.com/denoland/rusty_v8/releases/download/v137.3.0/librusty_v8_release_x86_64-unknown-linux-gnu.a.gz";
            hash = "sha256-omgf3lMBir0zZgGPEyYX3VmAAt948VbHvG0v9gi1ZWc=";
          };
        in
        pkgs.rustPlatform.buildRustPackage {
        pname = "obscura";
        version = "0.1.0";
        src = pkgs.fetchFromGitHub {
          owner = "h4ckf0r0day";
          repo = "obscura";
          rev = "main";
          hash = "sha256-aqhZ7nVOdcGNfKjRTDyzpYfqMrVA4KbK4XyAvyPUPj0=";
        };
        cargoHash = "sha256-+q7KeXr69wv3SoJ5qTQOxomCGpA+JdoZ04Hv9jExiZU=";
        buildFeatures = [ "stealth" ];
        cargoBuildFlags = [ "--package" "obscura-cli" ];
        nativeBuildInputs = with pkgs; [ pkg-config perl cmake gcc go binutils ninja clang nasm git python3 curl ];
        buildInputs = with pkgs; [ openssl zlib ];
        dontUseNinjaBuild = true;
        dontUseNinjaInstall = true;
        dontUseNinjaCheck = true;
        dontUseCmakeConfigure = true;
        LIBCLANG_PATH = "${pkgs.llvmPackages.libclang.lib}/lib";
        RUSTY_V8_ARCHIVE = v8_archive;
        meta.description = "Rust headless CDP browser with stealth fingerprinting";
      };

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
            alacritty

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

            # Machina Hub HUD (Flutter SDK)
            flutter
            android-tools
            jdk17

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
          nativeBuildInputs = with pkgs; [
            python312
            python312Packages.pip
            python312Packages.setuptools
            python312Packages.wheel
            cudaPackages.cudatoolkit
            cudaPackages.libcublas
            cudaPackages.libcusolver
            cudaPackages.libcusparse
            git
            go
            cmake
            ninja
            mpich
            gcc
          ];

          shellHook = ''
            export PROJECT_ROOT=$(pwd)
            export AKASHIK_DB_PATH="$PROJECT_ROOT/data/Akashik.db"
            export NIXPKGS_ALLOW_UNFREE=1
            
            # Absolute Python Artery
            export PATH="${pkgs.python312}/bin:${pkgs.python312Packages.pip}/bin:$PATH"
            alias python="python3"
            alias pip="python3 -m pip"
            
            # CUDA Invariants
            export CUDA_HOME="${pkgs.cudaPackages.cudatoolkit}"
            
            # ◈ HARDENED_ARTERY: Support both WSL and Native Linux CUDA paths
            WSL_LIB="/usr/lib/wsl/lib"
            NIX_LIBS="${pkgs.lib.makeLibraryPath (with pkgs; [ 
              cudaPackages.cudatoolkit
              cudaPackages.libcublas
              cudaPackages.libcusolver
              cudaPackages.libcusparse
              stdenv.cc.cc.lib
            ])}"
            
            if [ -d "$WSL_LIB" ]; then
                export LD_LIBRARY_PATH="$WSL_LIB:$NIX_LIBS:$LD_LIBRARY_PATH"
            else
                export LD_LIBRARY_PATH="$NIX_LIBS:$LD_LIBRARY_PATH"
            fi
            
            echo "◈ 50V3R31GN-M4CH1N4: Node C (HARDENED_ORACLE) Environment Loaded."
          '';
        };
      };
    };
}
