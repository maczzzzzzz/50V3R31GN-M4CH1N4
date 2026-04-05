{ pkgs ? import <nixpkgs> {} }:
pkgs.buildFHSEnv {
  name = "python-fhs";
  targetPkgs = pkgs: (with pkgs; [
    python3
    python3Packages.pip
    python3Packages.virtualenv
    zlib
    glib
    stdenv.cc.cc.lib
    
    # GPU / CUDA Support (Phase 25 WSL Native)
    linuxPackages.nvidia_x11
    libGLU
    libGL
    cudaPackages.cudatoolkit
  ]);
  runScript = "bash";
}