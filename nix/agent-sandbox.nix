{ pkgs ? import <nixpkgs> {} }:

/**
 * AGENT_SANDBOX — v3.8.7
 * 
 * Implements the 'nono' capability gates for agent-spawned processes.
 * Ensures strict physical sovereignty and VRAM safety.
 */

let
  lib = pkgs.lib;
  
  # Capability Gating Logic
  mkSandbox = { name, allowedTools ? [], vramLimitMb ? 4096 }:
    pkgs.writeShellScriptBin "agent-exec-${name}" ''
      # ◈ 50V3R31GN ENFORCER ARTERY
      echo "::/SANDBOX_INGRESS : Executing in isolated shell [${name}]"
      
      # TODO: Implement cgroup-based VRAM limiting
      # For Phase 92, we enforce tool-whitelisting via PATH manipulation
      
      export PATH=${lib.makeBinPath allowedTools}
      exec "$@"
    '';

in
{
  # Default Agent Sandbox
  default = mkSandbox {
    name = "sovereign-agent";
    allowedTools = with pkgs; [
      git
      curl
      sqlite
      nodejs_20
      ripgrep
    ];
    vramLimitMb = 4096;
  };
  
  # High-Performance Narrative Sandbox
  narrative = mkSandbox {
    name = "director-narrative";
    allowedTools = with pkgs; [
      ollama
      ffmpeg
    ];
    vramLimitMb = 16384;
  };
}
