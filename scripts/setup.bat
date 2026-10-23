@echo off
echo ==========================================================
echo       Bike for U - Production Docker Setup Script (Win)   
echo ==========================================================

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker is not installed or not in PATH.
    pause
    exit /b 1
)

if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
)

echo Building and starting Docker containers in detached mode...
docker compose up -d --build

echo.
echo Checking running services:
docker compose ps

echo.
echo ==========================================================
echo Bike for U is up and running!
echo Web Application: http://localhost:3000
echo Admin CMS:       http://localhost:3000/admin
echo Health Endpoint: http://localhost:3000/api/health
echo PostgreSQL Port: 5433
echo Redis Port:      6380
echo ==========================================================
