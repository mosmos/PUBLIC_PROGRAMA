@echo off
REM Programa Wizard — stop API (:8000) and Vite UI (:5173)
setlocal

for %%P in (8000 5173) do (
  set "found="
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
    echo killing PID %%A on port %%P
    taskkill /F /PID %%A >nul 2>&1
    set "found=1"
  )
)

echo done.
exit /b 0
