@echo off
setlocal
set "APP_DIR=%~dp0"
set "ELECTRON=%APP_DIR%node_modules\electron\dist\electron.exe"

if not exist "%ELECTRON%" (
  echo [ERROR] Electron not found:
  echo %ELECTRON%
  echo Run npm install in this folder first.
  pause
  exit /b 1
)

if exist "%APP_DIR%node_modules\electron\path.txt" (
  >nul 2>&1 powershell -NoProfile -Command "[System.IO.File]::WriteAllText('%APP_DIR%node_modules\electron\path.txt','electron.exe')"
)

cd /d "%APP_DIR%"
rem Use "." so paths with spaces / trailing backslash are safe
start "JT Player" "%ELECTRON%" .
exit /b 0