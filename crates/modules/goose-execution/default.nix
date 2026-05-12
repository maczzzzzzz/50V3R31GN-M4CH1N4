{ lib, rustPlatform, fetchFromGitHub }:

rustPlatform.buildRustPackage rec {
  pname = "goose-execution";
  version = "1.0.0";

  src = ./.;

  cargoLock.lockFile = ./Cargo.lock;

  meta = with lib; {
    description = "Multi-language execution layer for Node B (Director)";
    homepage = "https://github.com/sovereign-machina/50V3R31GN-M4CH1N4";
    license = licenses.mit;
    maintainers = [ ];
    platforms = [ "x86_64-linux" "aarch64-linux" ];
  };
}
