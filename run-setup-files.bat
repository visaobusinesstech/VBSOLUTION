@echo off
chcp 65001 >nul
cd /d "%~dp0"
node setup-files-system.js
pause


