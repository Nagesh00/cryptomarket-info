@echo off
echo 🚀 Auto-Deploy to Railway (Windows)...

:: Check if Railway CLI exists
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Railway CLI...
    npm install -g @railway/cli
)

:: Login to Railway
echo Please login to Railway in your browser...
railway login

:: Create new project
echo Creating Railway project...
railway init

:: Deploy to Railway
echo Deploying to Railway...
railway up

echo ✅ Deployment complete!
echo 🌐 Your app will be available at: https://your-project.railway.app
pause
