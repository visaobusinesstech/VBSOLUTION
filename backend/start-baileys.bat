@echo off
REM Script para iniciar o Baileys Server no Windows
REM Este script mantém o servidor rodando em background

set SCRIPT_DIR=%~dp0
set LOG_FILE=%SCRIPT_DIR%baileys-server.log
set PID_FILE=%SCRIPT_DIR%baileys-server.pid

echo 🚀 Iniciando Baileys Server no Windows...

REM Verificar se o servidor já está rodando
if exist "%PID_FILE%" (
    set /p PID=<"%PID_FILE%"
    tasklist /FI "PID eq %PID%" /FO CSV | findstr %PID% >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Servidor já está rodando (PID: %PID%)
        echo 📱 API disponível em: http://localhost:3000/api
        echo 🔗 Teste: http://localhost:3000/api/test
        echo 💡 Para parar: taskkill /PID %PID% /F
        pause
        exit /b 0
    ) else (
        echo 🧹 Removendo arquivo PID obsoleto...
        del "%PID_FILE%"
    )
)

REM Iniciar o servidor
echo 📱 Iniciando servidor Baileys...
cd /d "%SCRIPT_DIR%"

REM Iniciar em background
start /b node simple-baileys-server.js > "%LOG_FILE%" 2>&1

REM Aguardar um pouco e obter o PID
timeout /t 2 /nobreak >nul
for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV ^| findstr simple-baileys-server') do (
    set SERVER_PID=%%i
    set SERVER_PID=!SERVER_PID:"=!
)

REM Salvar PID
echo %SERVER_PID% > "%PID_FILE%"

echo ✅ Servidor Baileys iniciado (PID: %SERVER_PID%)
echo 📱 API disponível em: http://localhost:3000/api
echo 🔗 Teste: http://localhost:3000/api/test
echo 📝 Logs salvos em: %LOG_FILE%
echo 💡 Para parar: taskkill /PID %SERVER_PID% /F

REM Monitorar o servidor
:monitor
timeout /t 30 /nobreak >nul

REM Verificar se o processo ainda está rodando
tasklist /FI "PID eq %SERVER_PID%" /FO CSV | findstr %SERVER_PID% >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Servidor parou inesperadamente, reiniciando...
    
    REM Reiniciar
    start /b node simple-baileys-server.js > "%LOG_FILE%" 2>&1
    timeout /t 2 /nobreak >nul
    for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq node.exe" /FO CSV ^| findstr simple-baileys-server') do (
        set SERVER_PID=%%i
        set SERVER_PID=!SERVER_PID:"=!
    )
    echo %SERVER_PID% > "%PID_FILE%"
    
    echo 🔄 Servidor reiniciado (PID: %SERVER_PID%)
)

goto monitor
