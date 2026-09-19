# 启动 JT Player 静听
$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$electron = Join-Path $appDir "node_modules\electron\dist\electron.exe"
$pathTxt = Join-Path $appDir "node_modules\electron\path.txt"
if (-not (Test-Path $electron)) {
  Write-Host "未找到 Electron: $electron" -ForegroundColor Red
  Write-Host "请先在项目目录执行 npm install"
  exit 1
}
if (Test-Path $pathTxt) { [System.IO.File]::WriteAllText($pathTxt, "electron.exe") }
Set-Location $appDir
Start-Process -FilePath $electron -ArgumentList "." -WorkingDirectory $appDir
Write-Host "JT Player 静听 已启动" -ForegroundColor Green