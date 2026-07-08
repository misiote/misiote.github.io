@echo off
setlocal

cd /d "%~dp0"
set "BUNDLE_CMD="
set "CAN_START_JEKYLL=0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [Post Studio] npm was not found in PATH.
  echo Please install Node.js and make sure npm is available, then try again.
  pause
  exit /b 1
)

call :resolve_bundler

if not exist node_modules (
  echo [Post Studio] Installing npm dependencies for the first run...
  call npm install
  if errorlevel 1 (
    echo [Post Studio] npm install failed.
    pause
    exit /b 1
  )
)

if defined BUNDLE_CMD (
  set "CAN_START_JEKYLL=1"
  call %BUNDLE_CMD% check >nul 2>nul
  if errorlevel 1 (
    echo [Jekyll] Installing gem dependencies for the first run...
    call %BUNDLE_CMD% install
    if errorlevel 1 (
      echo [Jekyll] bundle install failed.
      echo [Jekyll] Post Studio will still start, but Jekyll preview is being skipped.
      set "CAN_START_JEKYLL=0"
    )
  )
)

if not defined BUNDLE_CMD (
  echo [Jekyll] Bundler was not found in PATH.
  echo [Jekyll] Tried bundle, bundle.bat, and ruby -S bundle.
  echo [Jekyll] Post Studio will still start. To enable Jekyll preview, install Bundler with:
  echo [Jekyll]   gem install bundler
  echo [Jekyll] Then reopen Explorer or your terminal and run this launcher again.
)

echo [Post Studio] Starting local editor...
start "Post Studio Server" cmd /c "cd /d "%~dp0" && npm run post-studio"

if "%CAN_START_JEKYLL%"=="1" (
  echo [Jekyll] Starting preview server...
  start "Jekyll Preview" cmd /c "cd /d "%~dp0" && call %BUNDLE_CMD% exec jekyll serve"
)

timeout /t 5 /nobreak >nul
start "" "http://localhost:4310"
if "%CAN_START_JEKYLL%"=="1" (
  start "" "http://localhost:4000"
)

echo [Launcher] Browser launch requested for Post Studio and the Jekyll preview site.
echo [Launcher] If either page is still starting, wait a few seconds and refresh.
exit /b 0

:resolve_bundler
where bundle >nul 2>nul
if not errorlevel 1 (
  set "BUNDLE_CMD=bundle"
  goto :eof
)

where bundle.bat >nul 2>nul
if not errorlevel 1 (
  set "BUNDLE_CMD=bundle.bat"
  goto :eof
)

where ruby >nul 2>nul
if errorlevel 1 (
  goto :eof
)

ruby -S bundle -v >nul 2>nul
if not errorlevel 1 (
  set "BUNDLE_CMD=ruby -S bundle"
)
goto :eof