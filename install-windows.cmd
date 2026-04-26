@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%scripts\install-windows.ps1" %*
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo Setup finished.
) else (
  echo Setup failed with exit code %EXIT_CODE%.
)
echo Press any key to close this window.
pause >nul

exit /b %EXIT_CODE%
