@echo off
cd /d "%~dp0"
echo Iniciando Frontend e Backend...
echo.

REM Iniciar Backend
start "VB Solution Backend" cmd /k "cd backend && pnpm dev"

REM Aguardar 5 segundos
timeout /t 5 /nobreak

REM Iniciar Frontend
start "VB Solution Frontend" cmd /k "cd frontend && pnpm dev"

echo.
echo Sistema iniciando...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000
echo.
pause

