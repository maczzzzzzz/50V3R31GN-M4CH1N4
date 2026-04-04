# ignite.ps1 - ASP.GM-Agent Master Ignition Script
# Role: Unified Launcher for Node B (Foundry + Orchestrator + Sidecars)

$FoundryPath = "D:\FoundryVTT\Foundry Virtual Tabletop\Foundry Virtual Tabletop.exe"
$Port = 9222

Write-Host "🚀 IGNITING ASP.GM-AGENT STACK..." -ForegroundColor Cyan

# 1. Start Foundry VTT with CDP Port
Write-Host "📡 Launching Foundry with Remote Debugging (Port $Port)..."
Start-Process $FoundryPath -ArgumentList "--remote-debugging-port=$Port"

# 2. Wait for Port 9222 to be active
Write-Host "⏳ Waiting for CDP Port $Port to wake up..."
while (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Silent).TcpTestSucceeded) {
    Start-Sleep -Seconds 1
}
Write-Host "✅ Hardware Link Established." -ForegroundColor Green

# 3. Launch the Orchestrator
Write-Host "🧠 Igniting Director (Node B Orchestrator)..."
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

# 4. Launch Sidecar Atlas
Write-Host "📡 Igniting Strategic Atlas..."
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "cd sidecar-atlas; cargo run --release" -WindowStyle Normal

# 5. Launch Crush CLI
Write-Host "⌨️ Igniting Crush CLI (Cyberdeck Control Plane)..." -ForegroundColor Cyan
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\asp-gm-agent'; crush" -WindowStyle Normal

Write-Host "🏁 STACK ACTIVE. System State Auto-Restore in progress..." -ForegroundColor Green
