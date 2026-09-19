$ErrorActionPreference = "Stop"
$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$electron = Join-Path $appDir "node_modules\electron\dist\electron.exe"
$pathTxt = Join-Path $appDir "node_modules\electron\path.txt"
if (-not (Test-Path $electron)) {
  Write-Host "Electron not found: $electron" -ForegroundColor Red
  Write-Host "Run npm install in this folder first."
  exit 1
}
if (Test-Path $pathTxt) { [System.IO.File]::WriteAllText($pathTxt, "electron.exe") }
Set-Location $appDir
# Avoid trailing-backslash quote issues in path with spaces
Start-Process -FilePath $electron -ArgumentList "." -WorkingDirectory $appDir
Write-Host "JT Player started." -ForegroundColor Green