{ lib, stdenv, fetchFromGitHub, cmake, ninja, cudaPackages }:

stdenv.mkDerivation rec {
  pname = "ik_llama.cpp";
  version = "latest";

  src = fetchFromGitHub {
    owner = "ikawrakow";
    repo = "ik_llama.cpp";
    rev = "refs/tags/t0002";
    sha256 = "0wdgk9gy907myj4bj89w79sk5ddv9db30racgbdkgkx6pay7s7h0";
  };

  nativeBuildInputs = [ cmake ninja cudaPackages.cuda_nvcc ];
  buildInputs = [ 
    cudaPackages.cuda_cudart 
    cudaPackages.libcublas
    cudaPackages.cuda_cccl
  ];

  postPatch = ''
    sed -i '1i #include <cstdint>\n#include <immintrin.h>' ggml/src/iqk/iqk_quantize.cpp
    sed -i '1i #include <cstdint>' ggml/src/iqk/iqk_common.h
  '';

  cmakeFlags = [
    "-DGGML_NATIVE=OFF"
    "-DGGML_CUDA=ON"
    "-DGGML_AVX2=ON"
    "-DGGML_FMA=ON"
    "-DCMAKE_CXX_FLAGS=-fpermissive"
  ];

  meta = with lib; {
    description = "Optimized llama.cpp fork for hybrid CPU/GPU inference (CUDA enabled for Node D)";
    homepage = "https://github.com/ikawrakow/ik_llama.cpp";
    license = licenses.mit;
    maintainers = [ ];
    # CUDA-specific platforms
    platforms = [ "x86_64-linux" ];
  };
}
