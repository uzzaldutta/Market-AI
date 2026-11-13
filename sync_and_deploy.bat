@echo off
title Bharat Market AI - 1-Click Live Web Deployer
echo ======================================================================
echo    BHARAT MARKET AI - AUTO-DEPLOY TO VERCEL & RENDER
echo ======================================================================
echo.
set /p COMMIT_MSG="Enter description of what you changed (or press Enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG="update: full-stack app improvements"

echo.
echo [1/3] Staging changes...
git add .

echo.
echo [2/3] Committing changes...
git commit -m "%COMMIT_MSG%"

echo.
echo [3/3] Pushing to GitHub (Triggers Vercel & Render Auto-Deploy)...
git push origin main

echo.
echo ======================================================================
echo Updates successfully pushed to GitHub!
echo - Vercel is auto-deploying your frontend: https://frontend-orcin-one-52.vercel.app
echo - Render is auto-deploying your backend:  https://market-ai-pf2c.onrender.com
echo Your live site will update automatically in ~60 seconds.
echo ======================================================================
pause
