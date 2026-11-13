@echo off
title Bharat Market AI - GitHub Sync & Deployment Helper
echo ======================================================================
echo       BHARAT MARKET AI - 1-CLICK GITHUB REPO SYNC
echo ======================================================================
echo.
echo Make sure you have created an empty repository on https://github.com/new
echo.
set /p REPO_URL="Enter your GitHub Repository HTTPS URL (e.g. https://github.com/username/bharat-market-ai.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL provided. Exiting...
    pause
    exit /b 1
)

echo.
echo [1/4] Staging all files...
git add .

echo.
echo [2/4] Creating deployment commit...
git commit -m "deploy: web-ready production release for Vercel and Render"

echo.
echo [3/4] Setting main branch and remote origin...
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo [4/4] Pushing code to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo [NOTICE] If push failed due to authentication, please log into Git or use a Personal Access Token.
) else (
    echo.
    echo ======================================================================
    echo Code successfully uploaded to GitHub!
    echo Now open DEPLOYMENT_GUIDE.md to connect Render and Vercel in 2 clicks.
    echo ======================================================================
)
pause
