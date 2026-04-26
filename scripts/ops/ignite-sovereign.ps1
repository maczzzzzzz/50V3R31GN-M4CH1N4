# Sovereign Ignition Protocol : v3.8.1
#
# Powershell script to ignite the Sovereign Trinity from Windows.
# This script handles WSL transition and environmental unsealing.

$ProjectRoot = "/home/nixos/50V3R31GN-M4CH1N4"
$IgniteScript = "scripts/audit/ignite-all.sh"

Write-Host "::/5Y573M-N071C3 : IGNITING_SOVEREIGN_TRINITY..." -ForegroundColor Yellow

# Launch WSL and execute the ignition sequence
wsl.exe -d nixos -e bash -c "cd $ProjectRoot && nix develop --command bash $IgniteScript"

if ($LASTEXITCODE -eq 0) {
    Write-Host "● [IGNITION_SUCCESS] : Mesh is operational." -ForegroundColor Green
} else {
    Write-Host "❌ [IGNITION_FAILURE] : Check WSL status." -ForegroundColor Red
}

Start-Sleep -Seconds 5
