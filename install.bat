@echo off
title Bharat Market AI - Installation & System Setup
echo ======================================================================
echo       BHARAT MARKET AI - 1-CLICK SYSTEM INSTALLATION
echo ======================================================================
echo [1/3] Checking Python & Node environments...
python --version
if errorlevel 1 (
    echo [ERROR] Python 3 is not found in PATH. Please install Python 3.11+.
    pause
    exit /b 1
)

node --version
if errorlevel 1 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

echo.
echo [2/3] Installing Python Backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt
if errorlevel 1 (
    echo [WARNING] Some python packages failed to install, checking core modules...
)

echo.
echo [3/3] Installing Frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo [WARNING] npm install reported issues.
)

echo.
echo [Creating Desktop Shortcut]...
powershell -ExecutionPolicy Bypass -File "%~dp0setup_desktop_shortcut.ps1"

echo ======================================================================
echo Installation Completed Successfully!
echo You can now launch Bharat Market AI by:
echo 1. Double clicking 'Bharat Market AI' shortcut on your Desktop, OR
echo 2. Running 'start_bharat_market_ai.bat' in this folder.
echo ======================================================================
pause
