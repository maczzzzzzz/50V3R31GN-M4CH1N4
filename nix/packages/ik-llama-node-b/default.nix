{ lib, stdenv, fetchFromGitHub, cmake, ninja }:

stdenv.mkDerivation rec {
  pname = "ik_llama.cpp";
  version = "latest";

  src = fetchFromGitHub {
    owner = "ikawrakow";
    repo = "ik_llama.cpp";
    rev = "refs/tags/t0002";
    sha256 = "0wdgk9gy907myj4bj89w79sk5ddv9db30racgbdkgkx6pay7s7h0";
  };

  nativeBuildInputs = [ cmake ninja ];

  NIX_CFLAGS_COMPILE = [
    "-fpermissive"
    "-mf16c"
    "-mavx"
    "-mavx2"
    "-mfma"
  ];

  postPatch = ''
    sed -i '1i #include <cstdint>\n#include <immintrin.h>' ggml/src/iqk/iqk_quantize.cpp
    sed -i '1i #include <cstdint>' ggml/src/iqk/iqk_common.h
  '';

  cmakeFlags = [
    "-DGGML_NATIVE=ON"
    "-DGGML_AVX2=ON"
    "-DGGML_FMA=ON"
  ];

  meta = with lib; {
    description = "Optimized llama.cpp fork for CPU inference with AVX2 (Node B)";
    homepage = "https://github.com/ikawrakow/ik_llama.cpp";
    license = licenses.mit;
    maintainers = [ ];
    platforms = [ "x86_64-linux" "aarch64-linux" ];
  };
}
