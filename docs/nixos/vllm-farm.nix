{ config, pkgs, ... }:

{
  # SOVEREIGN vLLM FARM - NODE C (HARDENED_ORACLE)
  # Deploys three separate vLLM instances for multi-quant serving.

  systemd.services.vllm-q3 = {
    description = "vLLM Farm: Q3_K_M (Light Parsing)";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      ExecStart = "${pkgs.python311Packages.vllm}/bin/vllm serve --model /home/maczz/50V3R31GN-M4CH1N4/models/gemma-4-q3.gguf --port 8081 --max-model-len 16384";
      User = "maczz";
      Restart = "always";
    };
  };

  systemd.services.vllm-q4 = {
    description = "vLLM Farm: Q4_K_M (Medium Synthesis)";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      ExecStart = "${pkgs.python311Packages.vllm}/bin/vllm serve --model /home/maczz/50V3R31GN-M4CH1N4/models/gemma-4-q4.gguf --port 8082 --max-model-len 8192";
      User = "maczz";
      Restart = "always";
    };
  };

  systemd.services.vllm-q5 = {
    description = "vLLM Farm: Q5_K_M (Heavy Local Reasoning)";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      ExecStart = "${pkgs.python311Packages.vllm}/bin/vllm serve --model /home/maczz/50V3R31GN-M4CH1N4/models/gemma-4-q5.gguf --port 8083 --max-model-len 4096";
      User = "maczz";
      Restart = "always";
    };
  };
}
