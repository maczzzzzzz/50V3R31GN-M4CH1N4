{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.voxcpm-tts;
in {
  options.services.voxcpm-tts = {
    enable = mkEnableOption "VoxCPM2 High-Fidelity TTS Artery";
    
    model = mkOption {
      type = types.str;
      default = "openbmb/VoxCPM2";
      description = "HuggingFace model ID or local path to ONNX weights.";
    };

    gguf_enabled = mkOption {
      type = types.bool;
      default = true;
      description = "Use VoxCPM.cpp GGUF quants for low-VRAM efficiency.";
    };

    streaming = mkOption {
      type = types.bool;
      default = true;
      description = "Enable real-time 48kHz audio streaming.";
    };

    sample_rate = mkOption {
      type = types.int;
      default = 48000;
      description = "Output audio sample rate (Hz).";
    };
  };

  config = mkIf cfg.enable {
    systemd.services.voxcpm-tts = {
      description = "◈ SOVEREIGN_VOXCPM_TTS : Voice Artery";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];

      serviceConfig = {
        ExecStart = "${pkgs.voxcpm-tts}/bin/voxcpm-tts";
        Restart = "always";
        Environment = [
          "MODEL_ID=${cfg.model}"
          "GGUF_ENABLED=${if cfg.gguf_enabled then "1" else "0"}"
          "STREAMING=${if cfg.streaming then "1" else "0"}"
          "SAMPLE_RATE=${toString cfg.sample_rate}"
        ];
      };
    };
  };
}
