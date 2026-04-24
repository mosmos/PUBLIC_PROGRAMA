@echo off
REM Programa Wizard launcher — starts FastAPI (:8000) and Vite UI (:5173)
setlocal
cd /d "%~dp0"

echo [1/4] Freeing ports 8000 and 5173 if held...
for %%P in (8000 5173) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
    echo   killing PID %%A on port %%P
    taskkill /F /PID %%A >nul 2>&1
  )
)

echo [2/4] Ensuring Python deps...
python -m pip install -q -r requirements.txt || goto :err

echo [3/4] Ensuring Node deps...
if not exist node_modules (
  call npm install || goto :err
)

echo [4/4] Launching API + UI (two windows)...
start "Programa API"  cmd /k python -m uvicorn api.service:app --reload --port 8000
start "Programa UI"   cmd /k npm run dev:ui

echo.
echo   API: http://localhost:8000
echo   UI:  http://localhost:5173  (Vite picks next free port if busy)
echo.
echo Close the two spawned windows to stop the servers.
exit /b 0

:err
echo.
echo *** Startup failed. See errors above. ***
exit /b 1
