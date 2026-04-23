{ pkgs ? import <nixpkgs> { config.android_sdk.accept_license = true; config.allowUnfree = true; } }:

let
  androidComposition = pkgs.androidenv.composeAndroidPackages {
    buildToolsVersions = [ "34.0.0" "33.0.1" "30.0.3" ];
    platformVersions = [ "34" "33" "31" "28" ];
    abiVersions = [ "armeabi-v7a" "arm64-v8a" ];
    ndkVersions = [ "27.0.12077973" "28.2.13676358" ];
    includeSystemImages = false;
    includeEmulator = false;
  };
  androidSdk = androidComposition.androidsdk;
in
(pkgs.buildFHSEnv {
  name = "android-sdk-env";
  targetPkgs = pkgs: with pkgs; [
    androidSdk
    flutter
    jdk17
    glibc
    zlib
    ncurses
    xz
    libglvnd
  ];
  profile = ''
    export ANDROID_SDK_ROOT="${androidSdk}/libexec/android-sdk"
    export ANDROID_HOME="$ANDROID_SDK_ROOT"
    export JAVA_HOME="${pkgs.jdk17.home}"
  '';
  runScript = "bash";
}).env