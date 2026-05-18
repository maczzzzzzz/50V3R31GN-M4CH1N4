# =============================================================================
# Hermes Relay - Clean Windows Install (One-Click)
# Run this script as Administrator in PowerShell on a fresh Windows machine
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   Hermes Relay - Clean Windows Setup (No Git)" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# === CONFIGURATION ===
$BasePath = "C:\Tools"
$RelayPath = "$BasePath\hermes-relay"
$NssmPath = "$BasePath\nssm\nssm.exe"
$ServiceName = "HermesRelay"

# 1. Create directories
Write-Host "[1/6] Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $BasePath | Out-Null
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.hermes\logs" | Out-Null

# 2. Download and extract NSSM
Write-Host "[2/6] Downloading NSSM..." -ForegroundColor Yellow
$nssmZip = "$env:TEMP\nssm.zip"
try {
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $nssmZip -UseBasicParsing
    Expand-Archive -Path $nssmZip -DestinationPath $BasePath -Force
    if (Test-Path "$BasePath\nssm-2.24") {
        Rename-Item "$BasePath\nssm-2.24" "$BasePath\nssm" -Force
    }
} catch {
    Write-Error "Failed to download NSSM. Check your internet connection."
    exit 1
}

# 3. Download hermes-relay repo as zip (no git required)
Write-Host "[3/6] Downloading hermes-relay repository..." -ForegroundColor Yellow
$zipUrl = "https://github.com/Codename-11/hermes-relay/archive/refs/heads/main.zip"
$zipFile = "$env:TEMP\hermes-relay.zip"
try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UseBasicParsing
    Expand-Archive -Path $zipFile -DestinationPath $BasePath -Force
    if (Test-Path "$BasePath\hermes-relay-main") {
        Rename-Item "$BasePath\hermes-relay-main" $RelayPath -Force
    }
} catch {
    Write-Error "Failed to download hermes-relay. Check your internet connection."
    exit 1
}

# 4. Install Python dependencies
Write-Host "[4/6] Installing Python packages..." -ForegroundColor Yellow
try {
    pip install --quiet fastapi uvicorn httpx pyyaml
} catch {
    Write-Warning "pip install failed. Make sure Python is installed and added to PATH."
    Write-Host "Download Python from: https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# 5. Create NSSM Service
Write-Host "[5/6] Creating Windows Service..." -ForegroundColor Yellow

# Remove existing service if present
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    & $NssmPath stop $ServiceName 2>$null
    & $NssmPath remove $ServiceName confirm 2>$null
}

$PythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $PythonExe) {
    Write-Error "Python not found in PATH. Please install Python 3.12+ first."
    exit 1
}

$RelayScript = "$RelayPath\desktop\relay.py"

& $NssmPath install $ServiceName $PythonExe $RelayScript
& $NssmPath set $ServiceName AppDirectory "$RelayPath\desktop"
& $NssmPath set $ServiceName DisplayName "Hermes Relay - Sovereign Mesh"
& $NssmPath set $ServiceName Description "Hermes Relay Gateway for NODESTADT Mesh (port 8767)"
& $NssmPath set $ServiceName Start SERVICE_AUTO_START
& $NssmPath set $ServiceName AppStdout "$env:USERPROFILE\.hermes\logs\relay.log"
& $NssmPath set $ServiceName AppStderr "$env:USERPROFILE\.hermes\logs\relay-error.log"

# 6. Start the service
Write-Host "[6/6] Starting service..." -ForegroundColor Yellow
& $NssmPath start $ServiceName

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "   Installation Complete!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

& $NssmPath status $ServiceName

Write-Host ""
Write-Host "Test the relay:" -ForegroundColor Cyan
Write-Host "  curl http://localhost:8767/health" -ForegroundColor White
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "  Get-Content $env:USERPROFILE\.hermes\logs\relay.log -Tail 20" -ForegroundColor White
Write-Host ""
Write-Host "Service management:" -ForegroundColor Cyan
Write-Host "  nssm start/stop/restart $ServiceName" -ForegroundColor White
Write-Host ""