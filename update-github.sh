#!/bin/bash
# Complete GitHub Update and System Fix Script

echo "🔧 Advanced Crypto Monitor - GitHub Update & System Fix"
echo "======================================================="

# Step 1: Check current status
echo ""
echo "📋 Step 1: Checking current status..."

# Check if Git is initialized
if [ -d ".git" ]; then
    echo "✅ Git repository found"
    
    # Check Git status
    echo "📝 Git status:"
    git status --short
    
    # Check remote
    echo "🌐 Remote repositories:"
    git remote -v
    
else
    echo "❌ No Git repository found"
    echo "🔧 Initializing Git repository..."
    git init
    git remote add origin https://github.com/Nagesh00/cryptomarket-info.git
fi

# Step 2: Add and commit all changes
echo ""
echo "📦 Step 2: Adding and committing changes..."

# Add all files
git add .

# Check what will be committed
echo "📋 Files to be committed:"
git diff --cached --name-status

# Commit with comprehensive message
git commit -m "Advanced Crypto Monitor System Update

- Complete real-time crypto project monitoring system
- Multi-source data collection (CoinMarketCap, CoinGecko, GitHub)
- AI-powered analysis with legitimacy scoring
- Dark web intelligence monitoring
- Professional web dashboard with live updates
- Multi-channel notifications (Telegram, Discord, Email)
- VS Code extension integration
- Python analysis engine with ML capabilities
- Comprehensive setup and configuration scripts
- Production-ready architecture

Features:
✅ Real-time monitoring from multiple sources
✅ AI-powered project analysis and scoring
✅ Dark web threat intelligence
✅ Professional dashboard at http://localhost:3000
✅ Multi-channel notifications
✅ VS Code integration
✅ Trending sectors 2025 monitoring
✅ Advanced security features
✅ Automated setup scripts
✅ Comprehensive documentation"

# Step 3: Push to GitHub
echo ""
echo "🚀 Step 3: Pushing to GitHub..."

# Push to main branch
git push -u origin main

echo ""
echo "✅ GitHub update completed!"
echo ""
echo "🌐 Your repository: https://github.com/Nagesh00/cryptomarket-info"
echo "📊 Dashboard: http://localhost:3000"
echo "📖 Documentation: README_ADVANCED.md"
