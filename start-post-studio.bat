@echo off
setlocal

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [Post Studio] npm was not found in PATH.
  echo Please install Node.js and make sure npm is available, then try again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [Post Studio] Installing dependencies for the first run...
  call npm install
  if errorlevel 1 (
    echo [Post Studio] npm install failed.
    pause
    exit /b 1
  )
)

echo [Post Studio] Starting local editor...
start "Post Studio Server" cmd /c "cd /d "%~dp0" && npm run post-studio"

timeout /t 3 /nobreak >nul
start "" "http://localhost:4310"

echo [Post Studio] Browser launch requested. If the page is still loading, wait a few seconds and refresh.
exit /b 0