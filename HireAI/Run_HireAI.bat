
@echo off
setlocal
cd /d "%~dp0"

echo ====================================
echo       HireAI Startup
echo ====================================

where docker >nul 2>&1
if errorlevel 1 (
    echo ERROR: Please install Docker Desktop.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Please start Docker Desktop.
    pause
    exit /b 1
)

if not exist "hireai-images.tar" (
    echo ERROR: Docker image archive is missing.
    pause
    exit /b 1
)

echo Loading HireAI Docker images...
docker load -i "hireai-images.tar"
if errorlevel 1 goto error

echo Starting HireAI...
docker compose up -d --no-build
if errorlevel 1 goto error

echo.
echo HireAI is starting.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5001
echo.
docker compose ps
pause
exit /b 0

:error
echo.
echo Startup failed. Check the error above.
docker compose logs --tail 50
pause
exit /b 1