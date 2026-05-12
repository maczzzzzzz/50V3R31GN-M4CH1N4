{ config, pkgs, lib, self, ... }:

with lib;
let
  cfg = config.services.ik-llama;
in
{
  options.services.ik-llama = {
    enable = mkEnableOption "Sovereign Inference Engine (ik-llama)";

    package = mkOption {
      type = types.package;
      default = self.packages.${pkgs.system}.ik-llama-d;
      description = "The ik-llama package variant to use (e.g., node-b for AVX2, node-d for CUDA).";
    };

    user = mkOption {
      type = types.str;
      default = "nixos";
      description = "User to run the inference engine as.";
    };

    modelPath = mkOption {
      type = types.str;
      default = "/var/lib/hermes/models/default.gguf";
      description = "Absolute path to the GGUF model file.";
    };
    
    port = mkOption {
      type = types.port;
      default = 8080;
      description = "Port for the llama-server.";
    };

    ctxSize = mkOption {
      type = types.int;
      default = 32000;
      description = "Context size for the inference engine.";
    };

    flashAttn = mkOption {
      type = types.bool;
      default = true;
      description = "Enable flash attention.";
    };

    cacheTypeK = mkOption {
      type = types.enum [ "f16" "q8_0" "q4_0" "q4_1" "q5_0" "q5_1" "iq4_nl" ];
      default = "q8_0";
      description = "Cache type for KV quantization";
    };

    memoryMax = mkOption {
      type = types.str;
      default = "36G";
      description = "Maximum memory allowed for the inference engine to prevent hardware runaway.";
    };
  };

  config = mkIf cfg.enable {
    # Open the configured inference port in the firewall
    networking.firewall.allowedTCPPorts = [ cfg.port ];

    systemd.services.ik-llama = {
      description = "Sovereign Inference Engine";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];

      serviceConfig = {
        Type = "simple";
        User = cfg.user;
        Group = "users";
        ExecStart = "${cfg.package}/bin/llama-server -m ${cfg.modelPath} --host 0.0.0.0 --port ${toString cfg.port} --ctx-size ${toString cfg.ctxSize} --cache-type-k ${cfg.cacheTypeK}";
        
        # Hard Resource Constraints to Prevent Hardware Runaway
        MemoryMax = cfg.memoryMax;
        MemorySwapMax = "0";
        OOMScoreAdjust = 500; # Make it a prime target for the OOM killer if system is stressed

        Restart = "always";
        RestartSec = "10s";
      };
    };
  };
}
