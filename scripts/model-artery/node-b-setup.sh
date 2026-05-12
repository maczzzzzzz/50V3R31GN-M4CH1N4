#!/usr/bin/env bash
# Node B Model Artery Setup
# Symlink Windows model repository to Node B local storage

set -e

echo ":: NODE B MODEL ARTERY SETUP ::"
echo ":: Symlinking D:\llama.cpp\models to /var/lib/hermes/models ::"

# Create target directory
sudo mkdir -p /var/lib/hermes

# Create symlink if it doesn't exist
if [ ! -L /var/lib/hermes/models ]; then
    sudo ln -s /mnt/d/llama.cpp/models /var/lib/hermes/models
    echo ":: Symlink created: /var/lib/hermes/models -> /mnt/d/llama.cpp/models"
else
    echo ":: Symlink already exists"
fi

# Verify the link
ls -la /var/lib/hermes/models | head -10

echo ":: NODE B MODEL ARTERY COMPLETE ::"
