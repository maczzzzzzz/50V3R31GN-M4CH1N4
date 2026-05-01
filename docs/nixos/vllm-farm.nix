{ config, pkgs, ... }:

{
  # SOVEREIGN vLLM FARM - NODE C (HARDENED_ORACLE)
  # Consolidated single-model Oracle serving Qwen 9B DeepSeek V4 Flash.

  systemd.services.vllm-oracle = {
    description = "vLLM Farm: Qwen-9B-DeepSeek-V4-Flash (Oracle)";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      ExecStart = "${pkgs.python311Packages.vllm}/bin/vllm serve --model /home/maczz/50V3R31GN-M4CH1N4/models/qwen3.5-9b-deepseek-v4-flash-q3_k_m.gguf --port 7339 --max-model-len 16384";
      User = "maczz";
      Restart = "always";
    };
  };
}
