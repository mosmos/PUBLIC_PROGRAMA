@echo off
REM Open the calculator test page. Starts the API if it's not already running.
setlocal
cd /d "%~dp0"

netstat -ano | findstr /r /c:":8000 .*LISTENING" >nul
if errorlevel 1 (
  echo API not running — starting on :8000...
  start "Programa API" cmd /k python -m uvicorn api.service:app --reload --port 8000
  REM wait for port to open (max ~15s)
  for /l %%i in (1,1,30) do (
    timeout /t 1 /nobreak >nul
    netstat -ano | findstr /r /c:":8000 .*LISTENING" >nul && goto :ready
  )
  echo API did not start in time.
  exit /b 1
) else (
  echo API already running on :8000.
)

:ready
start "" "http://localhost:8000/"
exit /b 0
