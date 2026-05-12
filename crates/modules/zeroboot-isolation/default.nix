{ lib, rustPlatform, fetchFromGitHub }:

rustPlatform.buildRustPackage rec {
  pname = "zeroboot-isolation";
  version = "1.0.0";

  src = ./.;

  cargoLock.lockFile = ./Cargo.lock;

  meta = with lib; {
    description = "KVM/Firecracker microVM isolation wrapper for Node D";
    homepage = "https://github.com/sovereign-machina/50V3R31GN-M4CH1N4";
    license = licenses.mit;
    maintainers = [ ];
    platforms = [ "x86_64-linux" "aarch64-linux" ];
  };
}
