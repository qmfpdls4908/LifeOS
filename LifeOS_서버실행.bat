@echo off
chcp 65001 >nul
echo ==================================================
echo   LifeOS Dev Server + OpenCode Go API Proxy
  echo   http://localhost:5500
echo ==================================================
echo.
node "%~dp0server.js"
pause