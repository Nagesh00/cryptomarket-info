@echo off
echo 🚀 Deploying Crypto Monitor to Railway...
echo.

:: Check if Railway CLI is installed
railway version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI not found. Installing...
    npm install -g @railway/cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Railway CLI. Please install manually: npm install -g @railway/cli
        pause
        exit /b 1
    )
)

:: Login to Railway
echo 📝 Logging into Railway...
railway login

:: Initialize Railway project
echo 🏗️ Initializing Railway project...
railway init crypto-monitor

:: Link to current directory
railway link

:: Set environment variables
echo ⚙️ Setting environment variables...
railway variables set NODE_ENV=production
railway variables set COINMARKETCAP_API_KEY=%COINMARKETCAP_API_KEY%
railway variables set COINGECKO_API_KEY=%COINGECKO_API_KEY%
railway variables set GITHUB_TOKEN=%GITHUB_TOKEN%
railway variables set TELEGRAM_BOT_TOKEN=%TELEGRAM_BOT_TOKEN%
railway variables set TELEGRAM_CHAT_ID=%TELEGRAM_CHAT_ID%
railway variables set EMAIL_USER=%EMAIL_USER%
railway variables set EMAIL_PASS=%EMAIL_PASS%
railway variables set PRICE_CHANGE_THRESHOLD=5

:: Deploy to Railway
echo 🚀 Deploying to Railway...
railway up

echo.
echo 🎉 Your Crypto Monitor is now live on Railway!
echo Check your Railway dashboard for the live URL.
echo.
pause
