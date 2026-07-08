@echo off
setlocal

set "PORT=4310"
set "FOUND_PID="

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  set "FOUND_PID=%%P"
  goto :kill_process
)

echo [Post Studio] No running server was found on port %PORT%.
exit /b 0

:kill_process
echo [Post Studio] Stopping server process %FOUND_PID% on port %PORT%...
taskkill /PID %FOUND_PID% /F >nul 2>nul
if errorlevel 1 (
  echo [Post Studio] Failed to stop process %FOUND_PID%.
  pause
  exit /b 1
)

echo [Post Studio] Server stopped.
exit /b 0