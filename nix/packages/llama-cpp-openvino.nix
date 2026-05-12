{ lib, stdenv, fetchFromGitHub, cmake, ninja, openvino, pkg-config
, accelerate ? null, CoreGraphics ? null, CoreVideo ? null }:

stdenv.mkDerivation rec {
  pname = "llama-cpp-openvino";
  version = "4676"; # Recent tag b4676

  src = fetchFromGitHub {
    owner = "ggml-org";
    repo = "llama.cpp";
    rev = "refs/tags/b${version}";
    sha256 = "sha256-Pa1Xxyr1zSGGKf9jw64VhqRXjhoC5WVCGWpbwY4lGEc=";
  };

  nativeBuildInputs = [ cmake ninja pkg-config pkgs.git ];
  buildInputs = [ openvino ] 
    ++ lib.optionals stdenv.isDarwin [ accelerate CoreGraphics CoreVideo ];

  cmakeFlags = [
    "-DGGML_OPENVINO=ON"
    "-DGGML_NATIVE=OFF"
    "-DLLAMA_BUILD_SERVER=ON"
  ];

  installPhase = ''
    runHook preInstall
    mkdir -p $out/bin
    cp bin/llama-server $out/bin/
    cp bin/llama-cli $out/bin/
    runHook postInstall
  '';

  meta = with lib; {
    description = "llama.cpp with OpenVINO acceleration for Intel NPU/iGPU";
    homepage = "https://github.com/ggml-org/llama.cpp";
    license = licenses.mit;
    platforms = platforms.linux ++ platforms.darwin;
  };
}
