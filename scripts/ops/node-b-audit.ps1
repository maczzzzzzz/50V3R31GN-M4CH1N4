# ◈ NODE_B_AUDIT — v3.8.9
$flutter = "F:\flutter-sdk\flutter\bin\flutter.bat"
if (Test-Path $flutter) {
    Write-Host "◈ Flutter Artery: FOUND"
    & $flutter --version
} else {
    Write-Host "◈ Flutter Artery: MISSING at $flutter"
}

Write-Host "◈ Searching for ADB Artery..."
$adb = Get-ChildItem -Path F:\ -Filter adb.exe -Recurse -Depth 3 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($adb) {
    Write-Host "◈ ADB Artery: FOUND at $($adb.FullName)"
    & $adb.FullName devices
} else {
    Write-Host "◈ ADB Artery: MISSING on F:"
}
