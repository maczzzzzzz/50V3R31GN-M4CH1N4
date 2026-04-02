{
  description = "ZeroClaw Rules Oracle — Hardware Vault (Phase 8.2)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true; # Required for NVIDIA CUDA
        };

        # ── Custom Grounded SQLite Derivation ──────────────────────────────────
        # Forces R*Tree and FTS5 for 100% spatial/lore determinism.
        sqlite-grounded = pkgs.sqlite.override {
          withRtree = true;
          withFts5 = true;
        };

        # ── Node A Development Shell ──────────────────────────────────────────
        # Defines the exact toolchain for the 1050 Ti Rules Authority.
      in
      {
        devShells.default = pkgs.mkShell {
          name = "zeroclaw-vault";

          buildInputs = with pkgs; [
            # Rust Toolchain (Locked to v1.0.3 baseline)
            rustc
            cargo
            pkg-config
            openssl

            # Inference & Hardware Acceleration
            ollama-cuda
            linuxPackages.nvidia_x11

            # Data Plane
            sqlite-grounded
          ];

          shellHook = ''
            echo "🌃 ZeroClaw Rules Vault (v1.0.3) Activated."
            echo "🛡️  Sandbox: Hardware-accelerated CUDA path enabled."
            echo "📦  Storage: SQLite R*Tree spatial indexing active."
            
            # Export paths for Rust builds
            export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig"
            export LD_LIBRARY_PATH="${pkgs.linuxPackages.nvidia_x11}/lib:${pkgs.libGL}/lib"
          '';
        };
      });
}
