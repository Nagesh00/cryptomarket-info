@echo off
echo ===============================================
echo    Crypto Project Monitor - Setup Script
echo ===============================================
echo.

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed

:: Check if npm is installed
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)
echo ✓ npm is installed

:: Install main project dependencies
echo [3/6] Installing main project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install main dependencies
    pause
    exit /b 1
)
echo ✓ Main dependencies installed

:: Install VS Code extension dependencies
echo [4/6] Installing VS Code extension dependencies...
cd vscode-extension
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install VS Code extension dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ VS Code extension dependencies installed

:: Check if Redis is available
echo [5/6] Checking Redis availability...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Redis is not running or not installed
    echo.
    echo To install Redis on Windows:
    echo 1. Install Chocolatey: https://chocolatey.org/install
    echo 2. Run: choco install redis-64
    echo 3. Start Redis: redis-server
    echo.
    echo Or download Redis from: https://github.com/microsoftarchive/redis/releases
    echo.
    echo You can continue setup and install Redis later.
    set /p continue="Continue without Redis? (y/n): "
    if /i not "%continue%"=="y" (
        pause
        exit /b 1
    )
) else (
    echo ✓ Redis is running
)

:: Setup environment file
echo [6/6] Setting up environment configuration...
if not exist .env (
    copy .env.example .env >nul
    echo ✓ Created .env file from template
    echo.
    echo IMPORTANT: Please edit .env file and add your API keys:
    echo - CoinMarketCap API key
    echo - Twitter API credentials
    echo - GitHub token
    echo - Reddit API credentials
    echo - Telegram bot token (optional)
    echo - Email credentials (optional)
    echo.
) else (
    echo ✓ .env file already exists
)

echo ===============================================
echo           Setup Complete!
echo ===============================================
echo.
echo Next steps:
echo 1. Edit .env file with your API keys
echo 2. Start Redis server (if not running): redis-server
echo 3. Start the monitoring system: npm start
echo 4. Open VS Code and install the extension
echo.
echo For detailed setup instructions, see README.md
echo.

:: Option to start the system
set /p startNow="Start the monitoring system now? (y/n): "
if /i "%startNow%"=="y" (
    echo.
    echo Starting Crypto Project Monitor...
    echo Press Ctrl+C to stop
    echo.
    npm start
)

pause
