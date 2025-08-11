@echo off
REM Complete GitHub Update and System Fix Script for Windows

echo 🔧 Advanced Crypto Monitor - GitHub Update & System Fix
echo =======================================================

REM Step 1: Check current status
echo.
echo 📋 Step 1: Checking current status...

REM Check if Git is initialized
if exist ".git" (
    echo ✅ Git repository found
    
    REM Check Git status
    echo 📝 Git status:
    git status --short
    
    REM Check remote
    echo 🌐 Remote repositories:
    git remote -v
    
) else (
    echo ❌ No Git repository found
    echo 🔧 Initializing Git repository...
    git init
    git remote add origin https://github.com/Nagesh00/cryptomarket-info.git
)

REM Step 2: Add and commit all changes
echo.
echo 📦 Step 2: Adding and committing changes...

REM Add all files
git add .

REM Check what will be committed
echo 📋 Files to be committed:
git diff --cached --name-status

REM Commit with comprehensive message
git commit -m "Advanced Crypto Monitor System Update - Complete real-time crypto project monitoring system with AI analysis, dark web intelligence, and multi-channel notifications"

REM Step 3: Push to GitHub
echo.
echo 🚀 Step 3: Pushing to GitHub...

REM Push to main branch
git push -u origin main

echo.
echo ✅ GitHub update completed!
echo.
echo 🌐 Your repository: https://github.com/Nagesh00/cryptomarket-info
echo 📊 Dashboard: http://localhost:3000
echo 📖 Documentation: README_ADVANCED.md

pause
