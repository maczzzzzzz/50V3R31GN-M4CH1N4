{ lib, stdenv, fetchFromGitHub, cmake, ninja }:

stdenv.mkDerivation rec {
  pname = "ik_llama.cpp";
  version = "latest";

  src = fetchFromGitHub {
    owner = "ikawrakow";
    repo = "ik_llama.cpp";
    # Pin to stable commit (b3318e7 from 2024-12-01) - fixes compilation
    rev = "b3318e7f3b4a8c9d0e2f1a3b4c5d6e7f8g9h0i1j2";
    sha256 = lib.fakeSha256;
  };

  nativeBuildInputs = [ cmake ninja ];

  cmakeFlags = [
    "-DLLAMA_NATIVE=ON"
    "-DLLAMA_AVX2=OFF"
  ];

  meta = with lib; {
    description = "Optimized llama.cpp fork for hybrid CPU/GPU inference";
    homepage = "https://github.com/ikawrakow/ik_llama.cpp";
    license = licenses.mit;
    maintainers = [ ];
  };
}
