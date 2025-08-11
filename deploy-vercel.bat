@echo off
echo 🚀 Auto-Deploy to Vercel (Windows)...

:: Check if Vercel CLI exists
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Vercel CLI...
    npm install -g vercel
)

echo 📋 Deploying to Vercel...
echo.

:: Login to Vercel
vercel login

:: Deploy project
vercel --prod

echo.
echo ✅ Deployment complete!
echo 🌐 Your app is now live on Vercel!
echo.
pause
