# ◈ 50V3R31GN-M4CH1N4: IGNITION INGRESS v1.1.7
# PRIORITY: STAGE 3 (GRAND ORACLE) + GLM SPECIALIST
# Target: D:\llama.cpp\models

$targetDir = "D:\llama.cpp\models"
$hfToken = "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"

if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir }

Write-Host "◈ INITIATING PRIORITY Q6 + GLM INGRESS..." -ForegroundColor Cyan

# --- LOCATE NEW HF CLI ---
$roamingPath = "$env:APPDATA\Python\Python314\Scripts\hf.exe"
$cli = "hf"
if (Test-Path $roamingPath) { $cli = $roamingPath }

# --- AUTHENTICATE ---
Write-Host "◈ Authenticating..." -ForegroundColor Gray
& $cli auth login --token $hfToken

function Download-Model($repo, $include) {
    Write-Host "◈ Downloading from $repo [$include]..." -ForegroundColor Yellow
    & $cli download $repo --include "$include" --local-dir $targetDir
}

# --- STAGE 3: THE GRAND ORACLE (NODE D) ---
Write-Host "◈ STAGE 3: The Grand Oracle (Node D)..." -ForegroundColor Red
Download-Model "bartowski/google_gemma-4-26B-A4B-it-Q6_K.gguf" "*Q6_K.gguf"
Download-Model "Qwen/Qwen2.5-Coder-14B-Instruct-GGUF" "*Q6_K.gguf"

# --- NEW: GLM AGENTIC SPECIALIST (NODE D) ---
Write-Host "◈ STAGE 3.1: GLM Specialist (Node D)..." -ForegroundColor Magenta
Download-Model "unsloth/GLM-4.7-Flash-GGUF" "*UD-Q4_K_XL.gguf"

# --- STAGE 2: THE DIRECTOR + VISION (NODE B) ---
Write-Host "◈ STAGE 2: The Director (Node B)..." -ForegroundColor Yellow
Download-Model "unsloth/gemma-4-26B-A4B-it-GGUF" "*Q3_K_M.gguf"
Download-Model "unsloth/gemma-4-26B-A4B-it-GGUF" "mmproj-BF16.gguf"

# --- STAGE 1: FAST TIER (NODE C) ---
Write-Host "◈ STAGE 1: Fast Tier (Node C)..." -ForegroundColor Yellow
Download-Model "unsloth/gemma-4-E4B-it-GGUF" "*Q3_K_M.gguf"
Download-Model "unsloth/gemma-4-E4B-it-GGUF" "*Q4_K_M.gguf"

Write-Host "◈ INGRESS COMPLETE. THE ORACLE IS MATERIALIZED." -ForegroundColor Green
