@echo off
echo.
echo ======================================
echo  🚀 Crypto Monitor 24/7 Startup
echo ======================================
echo.

:: Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js 18+ first.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found
    echo Copying from .env.example...
    copy .env.example .env >nul
    echo.
    echo IMPORTANT: Please edit .env file and add your API keys before starting the monitor
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" (
        echo Please edit .env file and run this script again
        pause
        exit /b 1
    )
)

:: Start the application
echo Starting the crypto monitoring system...
echo Press Ctrl+C to stop
echo.
echo Web Dashboard: http://localhost:3000/dashboard
echo WebSocket: ws://localhost:8080
echo.

node src/index.js
