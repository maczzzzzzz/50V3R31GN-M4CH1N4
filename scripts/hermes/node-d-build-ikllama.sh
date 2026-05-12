#!/usr/bin/env bash
# Node D IK Llama.cpp Build Script
# Builds IK Llama.cpp with CUDA support for Node D

set -e

echo ":: NODE D IK LLAMA.CPP BUILD (CUDA) ::"
echo ":: Building from Nix flake..."

# Build with Nix
nix build .#ik_llama_cpp_d

# Get the build output path
BUILD_PATH=$(nix path-output .#ik_llama_cpp_d)

echo "::"
echo ":: Build location: $BUILD_PATH"
echo ":: Binary location: $BUILD_PATH/bin/llama-cli"
echo "::"

echo ":: Testing binary..."
if [ -x "$BUILD_PATH/bin/llama-cli" ]; then
    echo ":: IK Llama.cpp built successfully"
    "$BUILD_PATH/bin/llama-cli" --version
else
    echo ":: ERROR: Binary not found"
    exit 1
fi

echo "::"
echo ":: To use IK Llama.cpp:"
echo "    export PATH=\"$BUILD_PATH/bin:\$PATH\""
echo ":: NODE D BUILD COMPLETE ::"
