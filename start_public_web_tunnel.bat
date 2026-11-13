@echo off
title Bharat Market AI - Public Web Live Launcher
echo ======================================================================
echo    BHARAT MARKET AI - LIVE PUBLIC WEB LAUNCHER (100%% FREE)
echo ======================================================================
echo.
echo Retrieving your secure Tunnel Password IP...
for /f "tokens=*" %%a in ('curl.exe -s https://loca.lt/mytunnelpassword') do set TUNNEL_PASSWORD=%%a

echo.
echo ======================================================================
echo  YOUR TUNNEL ACCESS PASSWORD:  %TUNNEL_PASSWORD%
echo ======================================================================
echo.
echo Launching public internet tunnel to port 3001...
echo When your browser opens, if it asks for a "Tunnel Password", paste:
echo      %TUNNEL_PASSWORD%
echo and click Submit!
echo.
echo ======================================================================

start cmd /k "npx localtunnel --port 3001"

pause
