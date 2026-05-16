{
  description = "Sovereign Machina - Beta v3 Quaternary Mesh";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
    nixos-wsl.url = "github:nix-community/NixOS-WSL/release-24.11";
    nixos-wsl.inputs.nixpkgs.follows = "nixpkgs";
    };

    outputs = { self, nixpkgs, nixos-wsl, nixpkgs-unstable, ... }:

    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;

      mkPkgs = system: import nixpkgs {
        inherit system;
        config.allowUnfree = true;
        config.allowUnsupportedSystem = true;
        overlays = [
          (final: prev: {
            # Access to unstable packages
            unstable = import nixpkgs-unstable {
              inherit system;
              config.allowUnfree = true;
            };

            # Sovereign Crates (validated)
            zeroboot-isolation = prev.callPackage ./crates/modules/zeroboot-isolation {};
            vibevoice-asr = prev.callPackage ./crates/modules/vibevoice-asr {};
            directors-forge = prev.callPackage ./crates/modules/directors-forge {};
            mirage-vfs = prev.callPackage ./crates/modules/mirage-vfs {};

            # Node B (AVX2) - Director, WSL2
            ik_llama_cpp_b = prev.callPackage ./nix/packages/ik-llama-node-b/default.nix { 
              stdenv = prev.gcc14Stdenv;
            };

            # Node D (CUDA) - Heavy-Hitter, Intel Core Ultra
            ik_llama_cpp_d = prev.callPackage ./nix/packages/ik-llama-node-d/default.nix { 
              stdenv = prev.gcc14Stdenv;
            };

            # Node D (OpenVINO) - Intel Core Ultra
            llama_cpp_openvino = prev.callPackage ./nix/packages/llama-cpp-openvino.nix { 
              stdenv = prev.gcc14Stdenv;
            };
          })
        ];
      };

      mkNode = hostName: system: modules: nixpkgs.lib.nixosSystem {
        inherit system;
        specialArgs = { inherit self; };
        modules = [
          { networking.hostName = hostName; }
          ./nix/hosts/shared/common.nix
          ./nix/modules/tailscale.nix
          ({ ... }: { nixpkgs.pkgs = mkPkgs system; })
        ] ++ modules;
      };

      # Helper to build sovereign crates with common settings
      # Usage in overlay: buildSovereignCrate prev "crate-name"
      buildSovereignCrate = prev: name:
        prev.callPackage ./crates/modules/${name} {};

    in {
      # Add Rust crates as packages
      # Note: buildSovereignCrate helper available for new crates.
      # Existing packages retain explicit definitions for cargo hash management.
      packages = forAllSystems (system: let pkgs = mkPkgs system; in {
        inherit (pkgs) zeroboot-isolation vibevoice-asr directors-forge 
          mirage-vfs;
        ik-llama-b = pkgs.ik_llama_cpp_b;
        ik-llama-d = pkgs.ik_llama_cpp_d;
        llama-cpp-openvino = pkgs.llama_cpp_openvino;
      });

      nixosConfigurations = {
        # Node A: Dedicated Memory Buffer (GTX 1050 Ti)
        node-a = mkNode "node-a" "x86_64-linux" [
          ./nix/hosts/shared/hardware-base.nix
          ./nix/hosts/node-a/default.nix
          ./nix/modules/hermes-lcm.nix
          ({ ... }: {
            services.hermes-lcm.syncNodes = [
              "100.66.173.31"   # Node B
              "100.102.109.81"  # Node C
              "100.120.225.12"  # Node D
            ];
          })
        ];

        # Node B: Developer Workspace (WSL2, 10.0.0.11)
        node-b = nixpkgs.lib.nixosSystem {
          system = "x86_64-linux";
          specialArgs = { inherit self nixos-wsl; };
          modules = [
            ./nix/hosts/node-b/default.nix
            { networking.firewall.allowedTCPPorts = [ 4000 8080 9119 ]; }
            ({ ... }: { nixpkgs.pkgs = mkPkgs "x86_64-linux"; })
          ];
        };

        # Node C: Voice Appendage (RTX 2060, 10.0.0.12)
        node-c = mkNode "node-c" "x86_64-linux" [
          ./nix/hosts/shared/hardware-base.nix
          ./nix/hosts/node-c/default.nix
          ./nix/modules/hermes-lcm.nix
          ({ ... }: {
            services.hermes-lcm = {
              enable = true;
              dbPath = "/var/lib/hermes-lcm/memory.db";
              isPrimary = false;
              primaryNode = "100.90.196.70";  # Node A
              sshUser = "nixos";
            };
          })
          { networking.firewall.allowedTCPPorts = [ 8080 9119 ]; }
        ];

        # Node D: The Heavy-Hitter (Intel Core Ultra, 10.0.0.13)
        node-d = mkNode "node-d" "x86_64-linux" [
          ./nix/hosts/shared/hardware-base.nix
          ./nix/hosts/node-d/default.nix
          { networking.firewall.allowedTCPPorts = [ 8000 8080 8642 9119 ]; }
        ];
      };

      devShells = forAllSystems (system:
        let 
          pkgs = mkPkgs system;
          pythonEnv = pkgs.python312.withPackages (ps: with ps; [
            pip
            discordpy
            python-dotenv
            openai
            anthropic
            fire
            httpx
            rich
            tenacity
            pyyaml
            requests
            jinja2
            pydantic
            prompt-toolkit
            fastapi
            uvicorn
          ]);
        in {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              git
              gnumake
              cmake
              pythonEnv
              nodejs_22
              cargo
              rustc
              gcc
              haproxy
            ];
            shellHook = ''
              export NPM_CONFIG_PREFIX=$PWD/.npm-global
              export PATH=$NPM_CONFIG_PREFIX/bin:$PATH
              export PATH=$HOME/.local/bin:$PATH

              if ! command -v droid &> /dev/null; then
                  echo ":: Downloading and installing Droid CLI to Nix environment..."     
                  npm install -g droid --silent
              fi

              echo ":: SOVEREIGN MACHINA BETA V3 DEV SHELL ACTIVE ::"
              echo ":: NODE B WORKSPACE READY ::"
            '';
          };
        }
      );
  };
}
