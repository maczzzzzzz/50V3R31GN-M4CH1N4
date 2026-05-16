#!/usr/bin/env python3
"""Screen capture utility for Node B (WSL2 -> Windows screenshot -> base64).

Captures the Windows desktop via PowerShell interop from WSL2.
Saves to /tmp/sovereign-sniffer/ and returns base64-encoded PNG.
"""
import base64
import os
import subprocess
import sys
from datetime import datetime

CAPTURE_DIR = "/tmp/sovereign-sniffer"
os.makedirs(CAPTURE_DIR, exist_ok=True)


def capture_screen() -> str:
    """Capture the primary Windows screen and return base64-encoded PNG.

    Uses PowerShell System.Windows.Forms to grab the primary monitor,
    saves via the \\\\wsl$ share into the WSL2 filesystem.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = f"{CAPTURE_DIR}/capture_{timestamp}.png"

    # Convert WSL path to Windows UNC path for PowerShell
    # /tmp/sovereign-sniffer -> \\wsl$\nixos\tmp\sovereign-sniffer
    win_path = filepath.replace("/", "\\\\")
    win_path = f"\\\\wsl$\\nixos{win_path}"

    ps_script = f"""
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bounds = $screen.Bounds
$bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$bmp.Save("{win_path}", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
"""

    result = subprocess.run(
        ["powershell.exe", "-NoProfile", "-Command", ps_script],
        capture_output=True,
        text=True,
        timeout=15,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Screen capture failed: {result.stderr.strip()}")

    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Screenshot not found at {filepath}")

    with open(filepath, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    # Cleanup old captures (keep last 5)
    captures = sorted(
        [f for f in os.listdir(CAPTURE_DIR) if f.startswith("capture_")]
    )
    for old in captures[:-5]:
        os.remove(os.path.join(CAPTURE_DIR, old))

    return b64


def capture_and_save() -> str:
    """Capture and return the file path."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = f"{CAPTURE_DIR}/capture_{timestamp}.png"

    b64 = capture_screen()

    # decode back to verify (capture_screen already saved the file)
    return filepath


if __name__ == "__main__":
    try:
        path = capture_and_save()
        size = os.path.getsize(path) / 1024
        print(f"Captured: {path} ({size:.1f} KB)")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
