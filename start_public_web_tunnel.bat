@echo off
title Bharat Market AI - High-Speed Cloudflare Web Live Launcher
echo ======================================================================
echo    BHARAT MARKET AI - LIVE PUBLIC WEB LAUNCHER (CLOUDFLARE EDGE)
echo ======================================================================
echo.
echo Launching enterprise-grade Cloudflare Tunnel to port 3001...
echo Cloudflare provides zero timeouts, zero passwords, and instant global access.
echo.
echo Looking for your live public URL below:
echo ======================================================================
echo.

cd /d "%~dp0"
.\cloudflared.exe tunnel --url http://localhost:3001

pause
