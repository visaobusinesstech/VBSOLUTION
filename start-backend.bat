@echo off
echo ========================================
echo   INICIANDO BACKEND - PORTA 3000
echo ========================================
echo.
cd /d "C:\Users\DAVI RESENDE\Downloads\VBB-main\VBB-main\backend"
echo Verificando Node.js...
node --version
echo.
echo Iniciando servidor backend...
call pnpm dev
pause

