@echo off
title Bharat Market AI - Autonomous Indian Market Intelligence
echo ======================================================================
echo    BHARAT MARKET AI - AUTONOMOUS TRADING & MARKET INTELLIGENCE
echo ======================================================================
echo Starting Backend API Server (FastAPI on Port 8000)...
start "Bharat Market AI - Backend (Port 8000)" cmd /k "cd /d %~dp0backend && set PYTHONPATH=..&& python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting Frontend Web Desk (Next.js on Port 3001)...
start "Bharat Market AI - Frontend (Port 3001)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo Opening Bharat Market AI in your browser...
start http://localhost:3001

echo ======================================================================
echo Bharat Market AI is now running!
echo - Frontend Desk:  http://localhost:3001
echo - Backend API:    http://localhost:8000
echo - Swagger Docs:   http://localhost:8000/docs
echo Keep the terminal windows open while using the software.
echo ======================================================================
pause
