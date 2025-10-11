@echo off
REM Script de Inicialização Automática VBSolutionCRM com Baileys
REM Este script garante que o Baileys seja sempre inicializado automaticamente

echo 🚀 Inicializando VBSolutionCRM com Baileys Automático...

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não está instalado!
    echo    Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
node --version

REM Verificar se o npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ NPM não está instalado!
    pause
    exit /b 1
)

echo ✅ NPM encontrado
npm --version

REM Instalar dependências se necessário
echo 📦 Verificando dependências...
call npm run install:all

REM Iniciar o sistema completo com Baileys
echo 🚀 Iniciando sistema completo com Baileys...
call npm run start:auto

pause
