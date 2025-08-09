// Simplified test version - basic crypto monitoring
const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WEBSOCKET_PORT || 8080;

// Basic middleware
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Crypto Monitor is running!', 
    timestamp: new Date().toISOString(),
    status: 'active'
  });
});

// Test CoinMarketCap API
app.get('/test/coinmarketcap', async (req, res) => {
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
      },
      params: {
        limit: 5
      }
    });
    
    res.json({
      success: true,
      data: response.data.data.map(coin => ({
        name: coin.name,
        symbol: coin.symbol,
        price: coin.quote.USD.price,
        change_24h: coin.quote.USD.percent_change_24h
      }))
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      api_key_configured: !!process.env.COINMARKETCAP_API_KEY
    });
  }
});

// Test CoinGecko API
app.get('/test/coingecko', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin,ethereum,cardano',
        vs_currencies: 'usd',
        include_24hr_change: true
      },
      headers: process.env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY } : {}
    });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      api_key_configured: !!process.env.COINGECKO_API_KEY
    });
  }
});

// WebSocket Server for real-time updates
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Crypto Monitor WebSocket',
    timestamp: new Date().toISOString()
  }));
  
  // Send periodic updates
  const interval = setInterval(async () => {
    try {
      // Get quick price update
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
      
      ws.send(JSON.stringify({
        type: 'price_update',
        data: response.data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('WebSocket update error:', error.message);
    }
  }, 30000); // Every 30 seconds
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Crypto Monitor API Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${WS_PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/`);
  console.log('');
  console.log('📋 Test Endpoints:');
  console.log(`   GET /test/coinmarketcap - Test CoinMarketCap API`);
  console.log(`   GET /test/coingecko - Test CoinGecko API`);
  console.log('');
  console.log('⚙️  Configuration:');
  console.log(`   CoinMarketCap API: ${process.env.COINMARKETCAP_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   CoinGecko API: ${process.env.COINGECKO_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   GitHub Token: ${process.env.GITHUB_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing'}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  wss.close();
  process.exit(0);
});
