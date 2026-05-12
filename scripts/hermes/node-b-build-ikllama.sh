#!/usr/bin/env bash
# Node B IK Llama.cpp Build Script
# Builds IK Llama.cpp with AVX2 support for Node B

set -e

echo ":: NODE B IK LLAMA.CPP BUILD (AVX2) ::"
echo ":: Building from Nix flake..."

# Build with Nix
nix build .#ik_llama_cpp_b

# Get the build output path
BUILD_PATH=$(nix path-output .#ik_llama_cpp_b)

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
echo ":: NODE B BUILD COMPLETE ::"
