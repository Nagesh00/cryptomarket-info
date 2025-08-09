#!/bin/bash

# 🚀 Crypto Monitor Deployment Script
echo "🚀 Welcome to Crypto Monitor Deployment Setup!"
echo "=============================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create a .env file with your API keys first."
    exit 1
fi

echo -e "${BLUE}📋 Available Deployment Options:${NC}"
echo "1. Heroku (Free tier available)"
echo "2. Railway (Free tier available)"
echo "3. Render (Free tier available)"
echo "4. Vercel (Free for static/serverless)"
echo "5. DigitalOcean App Platform"
echo "6. Docker Container"
echo "7. Setup all platforms"
echo

read -p "Choose deployment platform (1-7): " choice

case $choice in
    1)
        echo -e "${YELLOW}🚀 Setting up Heroku deployment...${NC}"
        # Check Heroku CLI
        if ! command -v heroku &> /dev/null; then
            echo -e "${RED}❌ Heroku CLI not found. Please install from: https://devcenter.heroku.com/articles/heroku-cli${NC}"
            exit 1
        fi
        
        # Create unique app name
        APP_NAME="crypto-monitor-$(date +%s)"
        echo -e "${BLUE}📱 Creating Heroku app: $APP_NAME${NC}"
        
        heroku create $APP_NAME
        
        # Set environment variables from .env
        echo -e "${BLUE}⚙️ Setting environment variables...${NC}"
        source .env
        heroku config:set NODE_ENV=production --app $APP_NAME
        heroku config:set COINMARKETCAP_API_KEY="$COINMARKETCAP_API_KEY" --app $APP_NAME
        heroku config:set COINGECKO_API_KEY="$COINGECKO_API_KEY" --app $APP_NAME
        heroku config:set GITHUB_TOKEN="$GITHUB_TOKEN" --app $APP_NAME
        heroku config:set TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" --app $APP_NAME
        heroku config:set TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID" --app $APP_NAME
        heroku config:set EMAIL_USER="$EMAIL_USER" --app $APP_NAME
        heroku config:set EMAIL_PASS="$EMAIL_PASS" --app $APP_NAME
        heroku config:set PRICE_CHANGE_THRESHOLD=5 --app $APP_NAME
        
        # Deploy
        git add .
        git commit -m "Deploy to Heroku"
        git push heroku main
        
        echo -e "${GREEN}✅ Deployed to Heroku!${NC}"
        echo -e "${BLUE}🌐 App URL: https://$APP_NAME.herokuapp.com${NC}"
        ;;
        
    2)
        echo -e "${YELLOW}🚀 Setting up Railway deployment...${NC}"
        # Check Railway CLI
        if ! command -v railway &> /dev/null; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        railway login
        railway init crypto-monitor
        railway link
        
        # Set environment variables
        source .env
        railway variables set NODE_ENV=production
        railway variables set COINMARKETCAP_API_KEY="$COINMARKETCAP_API_KEY"
        railway variables set COINGECKO_API_KEY="$COINGECKO_API_KEY"
        railway variables set GITHUB_TOKEN="$GITHUB_TOKEN"
        railway variables set TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN"
        railway variables set TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID"
        railway variables set EMAIL_USER="$EMAIL_USER"
        railway variables set EMAIL_PASS="$EMAIL_PASS"
        railway variables set PRICE_CHANGE_THRESHOLD=5
        
        railway up
        
        echo -e "${GREEN}✅ Deployed to Railway!${NC}"
        ;;
        
    3)
        echo -e "${YELLOW}🚀 Setting up Render deployment...${NC}"
        echo "Please follow these steps:"
        echo "1. Go to https://render.com"
        echo "2. Connect your GitHub repository"
        echo "3. Create a new Web Service"
        echo "4. Use render.yaml configuration"
        echo "5. Set environment variables in Render dashboard"
        ;;
        
    6)
        echo -e "${YELLOW}🐳 Building Docker container...${NC}"
        docker build -t crypto-monitor .
        
        echo -e "${BLUE}🚀 Running Docker container...${NC}"
        docker run -d -p 3000:3000 --env-file .env --name crypto-monitor crypto-monitor
        
        echo -e "${GREEN}✅ Docker container running!${NC}"
        echo -e "${BLUE}🌐 Access at: http://localhost:3000${NC}"
        ;;
        
    7)
        echo -e "${YELLOW}⚙️ Setting up all platforms...${NC}"
        echo "This will create configuration files for all platforms."
        echo "You can then deploy to any platform manually."
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option. Please choose 1-7.${NC}"
        exit 1
        ;;
esac

echo
echo -e "${GREEN}🎉 Deployment setup complete!${NC}"
echo -e "${BLUE}📖 Check DEPLOYMENT.md for detailed instructions${NC}"
echo
