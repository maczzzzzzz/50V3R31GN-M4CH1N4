<#
.SYNOPSIS
    Sovereign Machina - Node B (WSL2) to LAN Bridge
    Target: Windows 10 Host

.DESCRIPTION
    Automates the bridging of critical Artery ports from the physical Windows 10 host
    to the internal WSL2 environment. This is required for Nodes A, C, and D 
    to communicate with the Strategist (Node B).

.MANDATE
    - Run as ADMINISTRATOR.
    - Execute after every WSL2 reboot (if IP changes).
#>

$ErrorActionPreference = "Stop"

# 1. IDENTIFY THE TARGET (Internal WSL2 IP)
try {
    $wsl_ip = (wsl hostname -I).Trim().Split(" ")[0]
    if (-not $wsl_ip) { throw "Could not identify WSL2 IP." }
    Write-Host ":: ARTERY_SYNC : Target identified at $wsl_ip" -ForegroundColor Cyan
} catch {
    Write-Host "!! ERROR : Failed to retrieve WSL2 IP. Ensure WSL2 is running." -ForegroundColor Red
    exit 1
}

# 2. DEFINE THE ARTERY PORTS
# 22   : SSH (Mesh Handover)
# 8000 : Hermes API
# 8080 : IK Llama.cpp
# 9119 : Hermes Interaction Gateway
# 7878 : VSB Logic Pulse (TCP Proxy - UDP requires 3rd party tool)
$ports = @(22, 8000, 8080, 9119, 7878)

# 3. APPLY NETSH PORTPROXY RULES
Write-Host ":: ARTERY_SYNC : Applying PortProxy mappings..." -ForegroundColor Gray
foreach ($port in $ports) {
    netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 | Out-Null
    netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wsl_ip
    Write-Host "   [+] Port $port -> $wsl_ip"
}

# 4. OPEN FIREWALL GATES
Write-Host ":: ARTERY_SYNC : Updating Firewall rules..." -ForegroundColor Gray
foreach ($port in $ports) {
    $ruleName = "Sovereign_Artery_$port"
    Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port -Description "Sovereign Machina Artery Port $port" | Out-Null
    Write-Host "   [+] Firewall: $ruleName Active"
}

Write-Host "`n::/5Y573M-N071C3 : ARTERY_BRIDGE_ESTABLISHED. // 50V3R31GN-M4CH1N4" -ForegroundColor Green
Write-Host "Note: For UDP 7878 (VSB Pulse), ensure you use a UDP-to-TCP relay inside WSL2 or a 3rd party bridge."
