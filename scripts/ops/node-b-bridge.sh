#!/bin/bash
# ◈ NODE_B_BRIDGE — v3.8.9
# Aliases Windows-native SDKs for use within the Sovereign WSL environment.

export FLUTTER_PATH="/mnt/f/flutter-sdk/bin/flutter.bat"
export ADB_PATH="/mnt/f/android-studio/bin/adb.exe" # This might need adjusting if ADB is in platform-tools

# Function to run flutter
function flutter() {
  "$FLUTTER_PATH" "$@"
}

# Function to run adb
function adb() {
  # Standard path for ADB in a typical Android Studio / SDK setup
  local ACTUAL_ADB="/mnt/f/android-studio/platform-tools/adb.exe"
  if [ ! -f "$ACTUAL_ADB" ]; then
    # Fallback search if platform-tools isn't where expected
    ACTUAL_ADB=$(find /mnt/f -name "adb.exe" -path "*/platform-tools/*" | head -n 1)
  fi
  "$ACTUAL_ADB" "$@"
}

echo "::/5Y573M-N071C3 : BRIDGE_ACTIVE. // 50V3R31GN-M4CH1N4"
