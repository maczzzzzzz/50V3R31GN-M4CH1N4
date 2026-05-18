# Hermes Relay - NSSM Service Setup for Windows
# Run this script as Administrator in PowerShell

$ErrorActionPreference = "Stop"

Write-Host "=== Hermes Relay Windows Service Setup ===" -ForegroundColor Cyan

# === CONFIGURATION - EDIT THESE PATHS ===
$RelayRepoPath = "C:\Tools\hermes-relay"
$PythonPath = "C:\Python312\python.exe"
$NssmPath = "C:\Tools\nssm\nssm.exe"
$ServiceName = "HermesRelay"
$WorkingDir = "$RelayRepoPath\desktop"

# Check if paths exist
if (-not (Test-Path $PythonPath)) {
    Write-Error "Python not found at $PythonPath. Please update the path."
    exit 1
}

if (-not (Test-Path $RelayRepoPath)) {
    Write-Error "hermes-relay repo not found at $RelayRepoPath"
    Write-Host "Clone it first: git clone https://github.com/Codename-11/hermes-relay.git $RelayRepoPath"
    exit 1
}

# Install NSSM if not present
if (-not (Test-Path $NssmPath)) {
    Write-Host "NSSM not found. Downloading..." -ForegroundColor Yellow
    $nssmZip = "$env:TEMP\nssm.zip"
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $nssmZip
    Expand-Archive -Path $nssmZip -DestinationPath "C:\Tools" -Force
    Rename-Item "C:\Tools\nssm-2.24" "C:\Tools\nssm" -Force
    $NssmPath = "C:\Tools\nssm\nssm.exe"
}

# Remove existing service if present
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing service..." -ForegroundColor Yellow
    & $NssmPath stop $ServiceName
    & $NssmPath remove $ServiceName confirm
}

# Create the service
Write-Host "Creating NSSM service '$ServiceName'..." -ForegroundColor Green

& $NssmPath install $ServiceName $PythonPath "$RelayRepoPath\desktop\relay.py"
& $NssmPath set $ServiceName AppDirectory $WorkingDir
& $NssmPath set $ServiceName DisplayName "Hermes Relay - Sovereign Mesh Gateway"
& $NssmPath set $ServiceName Description "Native Hermes Relay for NODESTADT mesh (port 8767)"
& $NssmPath set $ServiceName Start SERVICE_AUTO_START
& $NssmPath set $ServiceName AppStdout "$env:USERPROFILE\.hermes\logs\relay.log"
& $NssmPath set $ServiceName AppStderr "$env:USERPROFILE\.hermes\logs\relay-error.log"

# Start the service
Write-Host "Starting service..." -ForegroundColor Green
& $NssmPath start $ServiceName

Write-Host "`n=== Service Status ===" -ForegroundColor Cyan
& $NssmPath status $ServiceName

Write-Host "`nHermes Relay should now be running as a Windows service." -ForegroundColor Green
Write-Host "Check logs at: $env:USERPROFILE\.hermes\logs\" -ForegroundColor Yellow
Write-Host "Test with: curl http://localhost:8767/health" -ForegroundColor Yellow