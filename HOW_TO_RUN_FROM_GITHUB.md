# 🚀 How to Run Your Crypto Monitor from GitHub

## 📋 Quick Setup Guide

Your Advanced Crypto Monitor system is successfully uploaded to GitHub! Here's how anyone can run it:

### Step 1: Clone from GitHub
```bash
git clone https://github.com/Nagesh00/cryptomarket-info.git
cd cryptomarket-info
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your API keys (optional for basic testing)
notepad .env
```

### Step 4: Start the System
```bash
# Start the main monitoring system
npm start

# OR start individual components:
node advanced-crypto-monitor.js
```

### Step 5: Access Dashboard
Open your browser to: `http://localhost:3000/dashboard`

## 🌐 Deploy to Cloud (Make it Live Online)

### Option 1: Heroku (Free Tier Available)
```bash
# Install Heroku CLI first
git clone https://github.com/Nagesh00/cryptomarket-info.git
cd cryptomarket-info
heroku create your-crypto-monitor
git push heroku main
```

### Option 2: Railway (Modern Platform)
1. Go to railway.app
2. Connect your GitHub repository
3. Deploy automatically

### Option 3: Render (Free Static Sites)
1. Go to render.com
2. Connect GitHub repo
3. Auto-deploy on git push

## ⚡ Instant Test Commands

### Test if system works:
```bash
node simple-test.js
```

### Test notifications:
```bash
node instant-notify.js
```

### Check system health:
```bash
node healthcheck.js
```

## 📱 What You Get

✅ **Real-time crypto monitoring**
✅ **Web dashboard at localhost:3000**
✅ **API endpoints for data**
✅ **WebSocket live updates**
✅ **Telegram/Email notifications**
✅ **VS Code extension integration**

## 🔑 API Keys (Optional)

The system works without API keys for basic testing, but for full features add:
- CoinMarketCap API key
- Telegram bot token
- Email SMTP settings

## 🆘 Need Help?

1. **Basic Test**: Run `node simple-test.js`
2. **Check Logs**: Look at console output
3. **Port Issues**: System uses port 3000
4. **Dependencies**: Run `npm install` again

Your system is READY TO USE from GitHub! 🎉
