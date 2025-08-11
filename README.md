# 🚀 Advanced Crypto Project Monitor - Complete System

## 📊 **LIVE DEPLOYMENT STATUS: ✅ READY**

A comprehensive, production-ready cryptocurrency monitoring system with real-time notifications, AI analysis, dark web intelligence, and VS Code integration.

## 🌐 **DEPLOY NOW:**

### **🥇 Railway (Full System with Python AI)**
1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub: `Nagesh00/cryptomarket-info`
3. Automatic Node.js + Python setup

### **🥈 Render (Universal Deployment)**
1. Go to [render.com](https://render.com)  
2. New Web Service → Connect GitHub
3. Repository: `Nagesh00/cryptomarket-info`
4. Start Command: `npm start`

### **🥉 Vercel (Fastest)**
1. Go to [vercel.com](https://vercel.com)
2. Import Git Repository → Your repo
3. Instant deployment

## ✨ Features

### � **Real-Time Monitoring**
- **Multi-Source Data Collection** - CoinMarketCap, CoinGecko, GitHub, Twitter, Reddit
- **New Project Detection** - Instant alerts for emerging cryptocurrencies  
- **Market Analysis** - Price tracking, volume analysis, market cap monitoring
- **Social Sentiment** - Real-time social media sentiment analysis

### 🤖 **AI-Powered Analysis**
- **Python ML Engine** - Advanced machine learning algorithms
- **Legitimacy Scoring** - AI-based project credibility assessment
- **Risk Assessment** - Multi-factor risk evaluation
- **Sentiment Analysis** - Natural language processing for market sentiment

### 🕵️ **Dark Web Intelligence**
- **Security Monitoring** - Dark web forum scanning
- **Threat Detection** - Suspicious activity alerts
- **Marketplace Analysis** - Underground market intelligence

### 🔔 **Multi-Channel Notifications**
- **Telegram Bot Integration** - Instant alerts to your Telegram
- **Email Notifications** - Gmail SMTP integration 
- **Smart Price Alerts** - 5% threshold for major alerts, 2% for rapid movements
- **24/7 Monitoring** - Continuous price checking every minute

### 🖥️ Advanced Shell Integration
- **Command Detection** - Smart recognition of crypto commands
- **Natural Language Processing** - Commands like "show bitcoin", "start monitor"
- **Fuzzy Matching** - Suggests similar commands when you mistype
- **Tab Completion** - Auto-complete for crypto symbols and commands

### 📊 Production Dashboard
- **Real-Time Web Interface** - Beautiful, responsive dashboard
- **System Monitoring** - Uptime, memory usage, request stats
- **Live Crypto Data** - Real-time price updates
- **Alert History** - Recent price alerts and notifications

## � Quick Start

### Prerequisites
- Node.js 18+ 
- PowerShell 5.1+ (Windows)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nagesh00/cryptomarket-info.git
   cd cryptomarket-info
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the production server:**
   ```bash
   npm start
   ```

4. **Access the dashboard:**
   Open `http://localhost:3000/dashboard` in your browser

### 3. Configure Environment Variables

Copy the example environment file and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# API Keys
COINMARKETCAP_API_KEY=your_cmc_api_key_here
COINGECKO_API_KEY=your_coingecko_api_key_here
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
GITHUB_TOKEN=your_github_token_here
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here

# Notification Services
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
DISCORD_BOT_TOKEN=your_discord_bot_token_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password_here
```

### 4. Start Redis Server

```bash
# Windows
redis-server

# Linux/macOS
sudo service redis-server start
# or
redis-server
```

### 5. Start the Monitoring System

```bash
npm start
```

The system will start with:
- API server on http://localhost:3000
- WebSocket server on ws://localhost:8080
- Web dashboard at http://localhost:3000/dashboard

## 🔧 Configuration

### API Keys Setup

#### CoinMarketCap API
1. Visit https://coinmarketcap.com/api/
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add to `.env` as `COINMARKETCAP_API_KEY`

#### CoinGecko API (Optional)
1. Visit https://www.coingecko.com/en/api
2. Sign up for Pro API for higher rate limits
3. Add to `.env` as `COINGECKO_API_KEY`

#### Twitter API
1. Apply for Twitter Developer account at https://developer.twitter.com/
2. Create a new app and get API keys
3. Add credentials to `.env`

#### GitHub API
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with repo and user permissions
3. Add to `.env` as `GITHUB_TOKEN`

#### Reddit API
1. Go to https://www.reddit.com/prefs/apps
2. Create a new app (script type)
3. Add client ID and secret to `.env`

#### Telegram Bot (Optional)
1. Message @BotFather on Telegram
2. Create a new bot with `/newbot`
3. Get the bot token and add to `.env`

### VS Code Extension Setup

1. Open the project in VS Code
2. Install the extension:
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   ```
3. Press F5 to launch a new VS Code window with the extension
4. Use `Ctrl+Shift+P` and search for "Crypto Monitor" commands

## 🚀 Usage

### Starting Monitoring

1. **Via Command Line:**
   ```bash
   npm start
   ```

2. **Via VS Code Extension:**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run "Crypto Monitor: Start Monitoring"

3. **Web Dashboard:**
   - Open http://localhost:3000/dashboard
   - Click "Start Monitoring"

### Configuring Filters

You can customize monitoring through:

1. **VS Code Extension:**
   - Use "Crypto Monitor: Configure Settings"
   - Set keywords, sources, risk levels, market cap filters

2. **Environment Variables:**
   ```env
   SCAN_INTERVAL_SECONDS=30
   MAX_CONCURRENT_REQUESTS=10
   ```

3. **Web Dashboard:**
   - Access settings panel
   - Configure notification preferences

### Notification Channels

#### Email Notifications
Configure SMTP settings in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

#### Telegram Notifications
1. Create a bot with @BotFather
2. Add bot token to `.env`
3. Get your chat ID by messaging the bot
4. Configure in user preferences

#### Discord Notifications
1. Create a Discord application
2. Add bot to your server
3. Configure webhook URL

## 📊 API Endpoints

### Projects
- `GET /api/projects` - Get recent projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/search` - Search projects

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/test` - Send test notification
- `PUT /api/notifications/preferences` - Update preferences

### Analytics
- `GET /api/analytics/stats` - Get monitoring statistics
- `GET /api/analytics/trending` - Get trending data

## 🔍 Monitoring Sources

### Supported Data Sources

1. **CoinMarketCap**
   - New listings
   - Trending cryptocurrencies
   - Gainers/losers

2. **CoinGecko**
   - Trending coins
   - Trending NFTs
   - Trending searches

3. **Twitter/X**
   - Keyword monitoring
   - Influencer tweets
   - Hashtag tracking

4. **Reddit**
   - Crypto subreddits
   - New project mentions
   - Community discussions

5. **GitHub**
   - New crypto repositories
   - Trending projects
   - Code analysis

6. **Dark Web** (Optional)
   - Forum monitoring
   - Marketplace scanning
   - Threat intelligence

### Data Analysis

The system performs comprehensive analysis including:

- **Sentiment Analysis**: Social media sentiment scoring
- **Risk Assessment**: Multi-factor risk evaluation
- **Legitimacy Scoring**: ML-based legitimacy detection
- **Technical Analysis**: Price and volume indicators
- **Community Metrics**: Social engagement scoring

## 🛡️ Security Considerations

1. **API Keys**: Store securely in environment variables
2. **Rate Limiting**: Built-in rate limiting for all APIs
3. **Data Validation**: Input validation for all external data
4. **Error Handling**: Comprehensive error handling and logging
5. **Privacy**: No sensitive data stored permanently

## 🔧 Troubleshooting

### Common Issues

1. **Connection Errors**
   ```bash
   # Check Redis connection
   redis-cli ping
   
   # Check API endpoints
   curl http://localhost:3000/health
   ```

2. **API Rate Limits**
   - Check API key validity
   - Verify rate limits in provider documentation
   - Increase delays between requests

3. **VS Code Extension Issues**
   ```bash
   # Rebuild extension
   cd vscode-extension
   npm run compile
   ```

4. **Missing Notifications**
   - Check filter settings
   - Verify API keys
   - Check WebSocket connection

### Logs and Debugging

- Application logs: Console output
- VS Code extension logs: Developer Console (`Help > Toggle Developer Tools`)
- API logs: Check `/api/analytics/stats` endpoint

## 📈 Performance Optimization

1. **Redis Configuration**
   ```redis
   # Increase memory limit
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

2. **Rate Limiting**
   - Adjust `SCAN_INTERVAL_SECONDS` based on API limits
   - Use API keys with higher rate limits

3. **Data Filtering**
   - Configure specific keywords to reduce noise
   - Set appropriate market cap filters
   - Limit sources if not needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting guide above
2. Review the API documentation
3. Open an issue on GitHub
4. Contact the development team

## 🔄 Updates and Roadmap

### Upcoming Features
- Machine learning improvements
- Additional data sources
- Mobile app
- Advanced charting
- Portfolio tracking
- Price alerts

### Version History
- v1.0.0: Initial release with core monitoring features
- v1.1.0: VS Code extension
- v1.2.0: Enhanced analysis algorithms
- v1.3.0: Web dashboard improvements

---

**Note**: This system is for educational and research purposes. Always conduct your own research before making investment decisions. Cryptocurrency investments carry significant risk.
