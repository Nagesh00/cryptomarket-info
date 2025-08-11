#!/bin/bash

echo "🚀 One-Click Deploy to Multiple Platforms"
echo "========================================"

# Function to deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    if ! command -v railway &> /dev/null; then
        npm install -g @railway/cli
    fi
    railway login
    railway init
    railway up
    echo "✅ Railway deployment complete!"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "▲ Deploying to Vercel..."
    if ! command -v vercel &> /dev/null; then
        npm install -g vercel
    fi
    vercel login
    vercel --prod
    echo "✅ Vercel deployment complete!"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "🔺 Deploying to Heroku..."
    if ! command -v heroku &> /dev/null; then
        echo "Please install Heroku CLI first: https://devcenter.heroku.com/articles/heroku-cli"
        return 1
    fi
    heroku login
    heroku create crypto-monitor-$(date +%s)
    git push heroku main
    echo "✅ Heroku deployment complete!"
}

echo "Choose deployment platform:"
echo "1) Railway (Recommended)"
echo "2) Vercel"
echo "3) Heroku"
echo "4) All platforms"
read -p "Enter choice (1-4): " choice

case $choice in
    1) deploy_railway ;;
    2) deploy_vercel ;;
    3) deploy_heroku ;;
    4) deploy_railway && deploy_vercel && deploy_heroku ;;
    *) echo "Invalid choice" ;;
esac

echo "🎉 Deployment complete! Your crypto monitor is now live!"
