# 🚀 Quick Start Guide - Advanced Crypto Monitor

## ⚡ 5-Minute Setup

### 1. Download & Setup
```powershell
# Create project directory
mkdir cryptoanalysis1
cd cryptoanalysis1

# Download files (or clone repository)
# All files should be in this directory
```

### 2. Install Requirements
```powershell
# Install Node.js dependencies
npm install express ws axios cors helmet dotenv node-cron nodemailer

# Install Python dependencies  
pip install requests aiohttp numpy pandas textblob asyncio websockets
```

### 3. Configure API Keys
Create `.env` file with your API keys:
```env
# Essential API Keys
CMC_API_KEY=your_coinmarketcap_api_key_here
GITHUB_TOKEN=your_github_token_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Optional
COINGECKO_API_KEY=your_coingecko_api_key_here
SENDER_EMAIL=your-email@example.com
SENDER_PASSWORD=your-app-password
```

### 4. Start the System
```powershell
# Method 1: Run setup script
python setup.py

# Method 2: Direct start
node advanced-crypto-monitor.js
```

### 5. Access Dashboard
Open your browser to: **http://localhost:3000**

---

## 🔑 Quick API Key Setup

### CoinMarketCap (Required)
1. Go to [coinmarketcap.com/api](https://coinmarketcap.com/api/)
2. Sign up (free tier: 10K calls/month)
3. Copy API key → `.env` file

### Telegram Bot (Recommended)
1. Message [@BotFather](https://t.me/botfather)
2. Type `/newbot` and follow instructions
3. Copy bot token → `.env` file
4. Get your chat ID: message the bot, then visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`

### GitHub Token (Optional)
1. [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Generate token with `repo` scope
3. Copy token → `.env` file

---

## 🎯 What You Get

✅ **Real-time crypto monitoring** from multiple sources  
✅ **AI-powered project analysis** with legitimacy scoring  
✅ **Dark web threat intelligence** monitoring  
✅ **Professional web dashboard** with live updates  
✅ **Multi-channel notifications** (Telegram, Email, VS Code)  
✅ **VS Code extension** for development integration  

---

## 🔧 Essential Commands

```powershell
# Start main system
node advanced-crypto-monitor.js

# Test Python analyzer
python crypto_analyzer.py --test

# Check system status
curl http://localhost:3000/api/system-status

# View logs
tail -f logs/crypto_monitor.log  # Linux/Mac
Get-Content logs/crypto_monitor.log -Wait  # Windows PowerShell
```

---

## 🚨 Need Help?

### Common Issues:
- **"Module not found"** → Run `npm install` and `pip install` commands
- **"API key invalid"** → Check your `.env` file and API key format
- **"Port already in use"** → Stop other applications using port 3000
- **Dashboard not loading** → Wait 30 seconds for system startup

### Support:
- 📖 Full documentation: `README_ADVANCED.md`
- 🔧 Configuration help: `python config_manager.py --help`
- 🐛 Issues: Check logs in `logs/` directory

---

## 🎊 You're Ready!

Your advanced crypto monitoring system is now running!

- 🌐 **Dashboard**: http://localhost:3000
- 📊 **API**: http://localhost:3000/api/system-status  
- 🔔 **Notifications**: Check your Telegram for alerts
- 💻 **VS Code**: Install extension from `vscode-extension/` folder

**Happy monitoring! 🚀📈**
