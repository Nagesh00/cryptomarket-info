@echo off
echo 🚀 Deploying Crypto Monitor to Heroku...
echo.

:: Check if Heroku CLI is installed
heroku --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Heroku CLI not found. Please install it from: https://devcenter.heroku.com/articles/heroku-cli
    pause
    exit /b 1
)

:: Login to Heroku
echo 📝 Logging into Heroku...
heroku login

:: Create app with unique name
set app_name=crypto-monitor-%random%
echo 🏗️ Creating Heroku app: %app_name%
heroku create %app_name%

:: Set environment variables
echo ⚙️ Setting environment variables...
heroku config:set NODE_ENV=production --app %app_name%
heroku config:set COINMARKETCAP_API_KEY=%COINMARKETCAP_API_KEY% --app %app_name%
heroku config:set COINGECKO_API_KEY=%COINGECKO_API_KEY% --app %app_name%
heroku config:set GITHUB_TOKEN=%GITHUB_TOKEN% --app %app_name%
heroku config:set TELEGRAM_BOT_TOKEN=%TELEGRAM_BOT_TOKEN% --app %app_name%
heroku config:set TELEGRAM_CHAT_ID=%TELEGRAM_CHAT_ID% --app %app_name%
heroku config:set EMAIL_USER=%EMAIL_USER% --app %app_name%
heroku config:set EMAIL_PASS=%EMAIL_PASS% --app %app_name%
heroku config:set PRICE_CHANGE_THRESHOLD=5 --app %app_name%

:: Commit latest changes
echo 📦 Committing latest changes...
git add .
git commit -m "Deploy to Heroku with production config"

:: Deploy to Heroku
echo 🚀 Deploying to Heroku...
git push heroku main

:: Open the deployed app
echo ✅ Deployment complete! Opening your app...
heroku open --app %app_name%

echo.
echo 🎉 Your Crypto Monitor is now live!
echo App URL: https://%app_name%.herokuapp.com
echo.
pause
