{ lib, rustPlatform }:

rustPlatform.buildRustPackage rec {
  pname = "pretext-core";
  version = "1.0.0";

  src = ./.;

  cargoLock.lockFile = ./Cargo.lock;

  meta = with lib; {
    description = "High-fidelity kinetic typography engine (Layout & ASCII)";
    homepage = "https://github.com/sovereign-machina/50V3R31GN-M4CH1N4";
    license = licenses.mit;
    platforms = [ "x86_64-linux" "aarch64-linux" ];
  };
}
