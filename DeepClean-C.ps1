# DeepClean-C.ps1 - Master Maintenance Script
# REQUIRES ADMINISTRATIVE PRIVILEGES

$AdminCheck = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $AdminCheck) {
    Write-Error "Please run this script as Administrator."
    Pause
    Exit
}

Write-Host "--- Starting Master Disk Cleanup ---" -ForegroundColor Cyan

# 1. System Hibernation (Reclaims ~19GB)
Write-Host "[1/6] Disabling Hibernation (Freeing up hiberfil.sys)..." -ForegroundColor Yellow
powercfg -h off

# 2. VSS / Shadow Copies (Caps the 'Ghost' growth)
Write-Host "[2/6] Purging Shadow Copies and Capping Storage to 5GB..." -ForegroundColor Yellow
vssadmin delete shadows /for=C: /all /quiet
vssadmin resize shadowstorage /for=C: /on=C: /maxsize=5GB

# 3. Component Store (WinSxS) Cleanup
Write-Host "[3/6] Cleaning up Windows Component Store (Resetting Base)..." -ForegroundColor Yellow
Dism /Online /Cleanup-Image /StartComponentCleanup /ResetBase

# 4. Dev-Trash & Caches (NPM, Pip, uv, Go)
Write-Host "[4/6] Purging Developer Caches..." -ForegroundColor Yellow
$Caches = @(
    "$env:LOCALAPPDATA\pip\cache",
    "$env:APPDATA\npm-cache",
    "$env:LOCALAPPDATA\uv\cache",
    "$env:USERPROFILE\go\pkg\mod"
)
foreach ($Cache in $Caches) {
    if (Test-Path $Cache) {
        Write-Host "  Deleting $Cache..."
        Remove-Item -Path $Cache -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 5. Windows Logs & Temp Files
Write-Host "[5/6] Clearing Windows Logs and Temp Files..." -ForegroundColor Yellow
Remove-Item -Path "C:\Windows\Logs\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue

# 6. Windows Update Cleanup (Background)
Write-Host "[6/6] Triggering Windows Update Cleanup..." -ForegroundColor Yellow
cleanmgr /verylowdisk

Write-Host "`n--- Cleanup Complete! ---" -ForegroundColor Green
Get-PSDrive C | Select-Object Used, Free, @{Name="UsedGB";Expression={[math]::Round($_.Used/1GB,2)}}, @{Name="FreeGB";Expression={[math]::Round($_.Free/1GB,2)}}
Pause
