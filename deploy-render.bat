@echo off
echo 🚀 Auto-Deploy to Render (Windows)...

echo 📋 Manual Render Deployment Steps:
echo.
echo 1. Go to https://render.com
echo 2. Sign up/Login with GitHub
echo 3. Click "New +" -> "Web Service"
echo 4. Connect to repository: https://github.com/Nagesh00/cryptomarket-info
echo 5. Configure settings:
echo    - Name: crypto-monitor-live
echo    - Environment: Node
echo    - Build Command: npm install
echo    - Start Command: node advanced-crypto-monitor.js
echo    - Instance Type: Free
echo.
echo 6. Click "Create Web Service"
echo 7. Your app will be live at: https://crypto-monitor-live.onrender.com
echo.
echo ✅ Render offers FREE hosting for Node.js apps!
echo.
pause

:: Open Render website
start https://render.com
