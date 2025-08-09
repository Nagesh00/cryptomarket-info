# 🚀 Crypto Market Monitor

Real-time cryptocurrency monitoring and alerting system with multi-source data collection, instant notifications, and live dashboard.

## ✨ Features

### 📊 Real-Time Monitoring
- **Multi-API Integration**: CoinMarketCap & CoinGecko APIs for comprehensive market data
- **Live WebSocket Updates**: Real-time price streaming to connected clients
- **Automated Price Alerts**: Configurable thresholds for price change notifications
- **GitHub Integration**: Monitor development activity of crypto projects

### 🔔 Smart Notifications
- **Email Alerts**: HTML-formatted email notifications via Gmail
- **Telegram Bot**: Instant mobile notifications with formatted messages
- **WebSocket Broadcasting**: Real-time alerts to all connected dashboard clients
- **Customizable Thresholds**: Set your own price change alert levels

### 🌐 Web Dashboard
- **Live Price Display**: Beautiful real-time cryptocurrency dashboard
- **Alert History**: View and track all recent price alerts
- **System Status**: Monitor API connections and system health
- **Responsive Design**: Works on desktop and mobile devices

### ⚙️ Configuration Management
- **Environment Variables**: Secure API key management
- **Multiple Data Sources**: Automatic fallback between API providers
- **Error Handling**: Robust error management and logging
- **Graceful Shutdown**: Clean server shutdown process

## 🛠️ Installation

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- API keys from supported services

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nagesh00/cryptomarket-info.git
   cd cryptomarket-info
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your API keys (see Configuration section below)

4. **Start the monitor**
   ```bash
   npm start
   ```

5. **Access the dashboard**
   Open http://localhost:3000 in your browser

## 🔑 Configuration

### Required API Keys

Create accounts and get API keys from:

#### CoinMarketCap (Primary Data Source)
- Website: https://coinmarketcap.com/api/
- Add to `.env`: `COINMARKETCAP_API_KEY=your_key_here`

#### CoinGecko (Backup Data Source)
- Website: https://www.coingecko.com/en/api
- Add to `.env`: `COINGECKO_API_KEY=your_key_here`

#### GitHub (Development Activity)
- Generate at: https://github.com/settings/tokens
- Add to `.env`: `GITHUB_TOKEN=your_token_here`

#### Telegram Bot (Mobile Notifications)
- Create bot: Message @BotFather on Telegram
- Add to `.env`: 
  ```
  TELEGRAM_BOT_TOKEN=your_bot_token
  TELEGRAM_CHAT_ID=your_chat_id
  ```

#### Email Notifications
- Use Gmail with App Password
- Add to `.env`:
  ```
  EMAIL_USER=your_email@gmail.com
  EMAIL_PASS=your_app_password
  ```

### Environment Variables

```bash
# Server Configuration
PORT=3000
WEBSOCKET_PORT=8080

# API Keys
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
COINGECKO_API_KEY=your_coingecko_api_key
GITHUB_TOKEN=your_github_token

# Notifications
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Alert Thresholds
PRICE_CHANGE_THRESHOLD=5
VOLUME_CHANGE_THRESHOLD=20
```

## 🚀 Usage

### Starting the System

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Using the startup script (Windows)
start.bat
```

### API Endpoints

- `GET /` - System information and status
- `GET /api/crypto` - Current cryptocurrency data
- `GET /api/alerts` - Recent price alerts
- `GET /api/status` - System health and configuration status

### WebSocket Connection

Connect to `ws://localhost:8080` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Real-time update:', data);
};
```

## 📱 Dashboard Features

The web dashboard provides:

- **Live Cryptocurrency Prices**: Real-time price updates for top 20 cryptocurrencies
- **Price Change Indicators**: Color-coded 24h price changes
- **Market Cap Information**: Current market capitalization data
- **Alert Feed**: Live stream of price alerts as they occur
- **System Statistics**: Connection count, uptime, and API status
- **Responsive Design**: Optimized for desktop and mobile viewing

## 🔧 Customization

### Alert Thresholds

Modify alert sensitivity in `.env`:

```bash
PRICE_CHANGE_THRESHOLD=5    # Alert when price changes >5%
VOLUME_CHANGE_THRESHOLD=20  # Alert when volume changes >20%
```

### Update Intervals

The system updates:
- **Price Data**: Every 30 seconds
- **GitHub Activity**: Every 10 minutes
- **WebSocket Broadcasts**: Real-time as data changes

## 🐛 Troubleshooting

### Common Issues

1. **No data updates**
   - Check API keys in `.env` file
   - Verify internet connection
   - Check API rate limits

2. **Notifications not working**
   - Verify Telegram bot token and chat ID
   - Check Gmail app password (not regular password)
   - Ensure email 2FA is enabled for app passwords

3. **WebSocket connection failed**
   - Check if port 8080 is available
   - Verify firewall settings
   - Try different WebSocket port in `.env`

### Debug Mode

Enable verbose logging:

```bash
LOG_LEVEL=debug npm start
```

## 📊 System Requirements

- **Node.js**: v16.0.0 or higher
- **Memory**: 512MB RAM minimum
- **Storage**: 100MB free space
- **Network**: Stable internet connection for API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- CoinMarketCap & CoinGecko for cryptocurrency data APIs
- Telegram Bot API for instant notifications
- Node.js and Express.js communities for excellent frameworks

## 📞 Support

For support, email kalyogyogi@gmail.com or create an issue on GitHub.

---

**Made with ❤️ for the crypto community**
