#!/bin/bash

echo "🚀 Auto-Deploy to Railway..."

# Install Railway CLI if not exists
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (will open browser)
echo "Please login to Railway in your browser..."
railway login

# Create new project
echo "Creating Railway project..."
railway init

# Deploy to Railway
echo "Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app will be available at: https://your-project.railway.app"
