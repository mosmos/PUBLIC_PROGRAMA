@echo off
title Programa Calculator v2 - FastAPI Server

set PYTHON="D:\python\Python313\python.exe"
set PROJECT_DIR=%~dp0
set API_DIR=%PROJECT_DIR%api
set HOST=127.0.0.1
set PORT=8010

echo.
echo  =========================================
echo   Programa Calculator v2
echo   http://%HOST%:%PORT%
echo  =========================================
echo.

cd /d "%API_DIR%"

:: Start the browser after a short delay (2 s) so the server is ready
start "" cmd /c "timeout /t 2 >nul && start http://%HOST%:%PORT%/"

%PYTHON% -m uvicorn service:app --host %HOST% --port %PORT% --reload

pause
