@echo off
title Kill Programa Server

echo.
echo  Killing uvicorn / python processes on port 8010...
echo.

:: Kill any process listening on port 8010
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8010 "') do (
    echo  Killing PID %%a
    taskkill /PID %%a /F >nul 2>&1
)

:: Also kill any python processes running uvicorn
taskkill /FI "IMAGENAME eq python.exe" /FI "WINDOWTITLE eq Programa*" /F >nul 2>&1

echo  Done.
echo.
pause
