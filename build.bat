@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo Building CAKIBRA SBP
echo ==========================================

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not in PATH.
  exit /b 1
)

where cargo >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Rust cargo is not installed or not in PATH.
  exit /b 1
)

where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERROR] PowerShell is required.
  exit /b 1
)

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/4] Downloading sing-box sidecar...
powershell -ExecutionPolicy Bypass -File ".\scripts\download-singbox.ps1"
if errorlevel 1 (
  echo [ERROR] sing-box download failed.
  exit /b 1
)

echo [2/4] Installing npm dependencies...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  exit /b 1
)

echo [3/4] Type checking frontend...
call npm run lint:check
if errorlevel 1 (
  echo [ERROR] TypeScript check failed.
  exit /b 1
)

echo [4/4] Building Windows installer and app binary...
call npm run tauri build -- --bundles nsis
if errorlevel 1 (
  echo [ERROR] tauri build failed.
  exit /b 1
)

echo.
echo Build completed.
echo Main executable directory: .\src-tauri\target\release\
echo Installer EXE directory:  .\src-tauri\target\release\bundle\nsis\
echo.
exit /b 0
