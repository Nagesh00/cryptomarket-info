# 🚀 Quick Start Guide - 24/7 Crypto Monitor

## ⚡ Instant Setup (3 Steps)

### 1. 📥 Clone & Install
```bash
git clone https://github.com/Nagesh00/cryptomarket-info.git
cd cryptomarket-info
npm install
```

### 2. 🔧 Configure Notifications
Your `.env` file is already configured with:
- ✅ Telegram Bot Token: `8265062480:AAHI5XG76daPshno39w-5-OgxeKt5l8Mzvg`
- ✅ Telegram Chat ID: `6411380646`
- ✅ Email: `kalyogyogi@gmail.com`
- ✅ Email Password: `Nagesh@123`

### 3. 🚀 Start the System
```bash
npm start
```

## 🌐 Access Your Dashboard
- **Dashboard**: http://localhost:3000/dashboard
- **API Status**: http://localhost:3000/api/status
- **All Crypto Data**: http://localhost:3000/api/crypto

## 📱 Test Notifications
Open PowerShell and run:
```powershell
cd cryptomarket-info
powershell -ExecutionPolicy Bypass -File Start-CryptoSystem.ps1
```

Then test notifications:
```powershell
Test-CryptoNotifications
```

## 🐳 24/7 Docker Deployment
For continuous operation:
```bash
docker-compose up -d
```

## 📊 Available Commands

### PowerShell Commands
```powershell
crypto              # Get all crypto data
monitor             # Start real-time monitoring
status              # Check system status
alerts              # View recent alerts
test-notify         # Test notifications
btc, eth, ada       # Quick crypto symbols
ask "show bitcoin"  # Natural language
start-server        # Start server
dashboard           # Open web dashboard
```

### API Endpoints
- `GET /api/crypto` - All cryptocurrency data
- `GET /api/crypto/BTC` - Bitcoin data only
- `GET /api/alerts` - Recent price alerts
- `POST /api/test-notification` - Test notifications

## 🔔 How Notifications Work

### Automatic Alerts
- 📈 **5% Price Change**: Major price movements
- ⚡ **2% Rapid Change**: Quick movements within 5 minutes
- 🔄 **Every Minute**: Continuous monitoring
- 📱 **Instant Delivery**: Telegram & Email simultaneously

### Manual Testing
- Use dashboard "Test Notifications" button
- Call API: `POST http://localhost:3000/api/test-notification`
- PowerShell: `Test-CryptoNotifications`

## 🛠️ Troubleshooting

### If server won't start:
```bash
# Check Node.js version (need 18+)
node --version

# Kill any existing process
npx kill-port 3000

# Restart
npm start
```

### If notifications aren't working:
1. Test with: `curl -X POST http://localhost:3000/api/test-notification`
2. Check your Telegram bot is active
3. Verify email credentials in `.env`

## 🎯 Ready for Production!

Your system includes:
- ✅ **Real-time monitoring** (every 60 seconds)
- ✅ **Automatic notifications** (Telegram + Email)
- ✅ **Beautiful dashboard** with live updates
- ✅ **Smart PowerShell integration**
- ✅ **Error recovery** and auto-restart
- ✅ **Docker deployment** ready
- ✅ **Comprehensive API** for integrations

## 📈 What You'll Get

1. **Instant Telegram messages** when BTC, ETH, or any crypto moves ±5%
2. **Email alerts** with detailed price information
3. **Real-time dashboard** showing all crypto prices
4. **PowerShell commands** for quick crypto checks
5. **24/7 operation** with automatic recovery

## 🔗 Links
- **GitHub**: https://github.com/Nagesh00/cryptomarket-info
- **Dashboard**: http://localhost:3000/dashboard
- **API Docs**: http://localhost:3000

---
**🎉 Your 24/7 crypto monitoring system is ready!**
