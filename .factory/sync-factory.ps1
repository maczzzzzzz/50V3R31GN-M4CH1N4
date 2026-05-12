# Sync script to run on Windows PowerShell
# Fixed paths to correctly point to the skills and hooks directories

$repoRoot = "Z:\home\nixos\50V3R31GN-M4CH1N4" # Update this path to where your project is cloned on Windows
$sourceSkills = "$repoRoot\.gemini\skills"
$sourceHooks = "$repoRoot\.factory\hooks"
$target = "C:\Users\macgr\.factory"

# Ensure target directory structure
if (-not (Test-Path "$target\skills")) { New-Item -ItemType Directory -Path "$target\skills" }
if (-not (Test-Path "$target\hooks")) { New-Item -ItemType Directory -Path "$target\hooks" }

# Sync skills and hooks
Copy-Item -Path "$sourceSkills\*" -Destination "$target\skills" -Recurse -Force
Copy-Item -Path "$sourceHooks\*" -Destination "$target\hooks" -Recurse -Force

Write-Host ":: SOVEREIGN RUNTIME SYNC COMPLETE ::" -ForegroundColor Green
