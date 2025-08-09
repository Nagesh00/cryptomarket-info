const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WEBSOCKET_PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Global storage for crypto data
let cryptoData = new Map();
let alerts = [];
let wsClients = new Set();

// Email transporter setup
let emailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log('🔗 New WebSocket client connected');
    wsClients.add(ws);
    
    ws.send(JSON.stringify({
        type: 'init',
        data: Array.from(cryptoData.values()),
        timestamp: new Date().toISOString()
    }));
    
    ws.on('close', () => {
        wsClients.delete(ws);
        console.log('🔌 WebSocket client disconnected');
    });
});

// Broadcast to all WebSocket clients
function broadcastToClients(data) {
    const message = JSON.stringify(data);
    console.log(`📡 Broadcasting to ${wsClients.size} WebSocket clients`);
    
    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
                console.log('✅ Message sent to client');
            } catch (error) {
                console.error('❌ WebSocket send error:', error);
                wsClients.delete(client);
            }
        } else {
            console.log('🗑️ Removing disconnected client');
            wsClients.delete(client);
        }
    });
}

// CoinMarketCap API integration
async function fetchCoinMarketCapData() {
    try {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
            },
            params: { limit: 20, convert: 'USD' }
        });
        
        return response.data.data.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            price: coin.quote.USD.price,
            change_24h: coin.quote.USD.percent_change_24h,
            market_cap: coin.quote.USD.market_cap,
            volume_24h: coin.quote.USD.volume_24h,
            source: 'coinmarketcap',
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        console.error('CoinMarketCap API error:', error.message);
        return [];
    }
}

// CoinGecko API integration
async function fetchCoinGeckoData() {
    try {
        const headers = {};
        if (process.env.COINGECKO_API_KEY) {
            headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
        }
        
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            headers,
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 20,
                page: 1,
                sparkline: false,
                price_change_percentage: '24h'
            }
        });
        
        return response.data.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change_24h: coin.price_change_percentage_24h,
            market_cap: coin.market_cap,
            volume_24h: coin.total_volume,
            source: 'coingecko',
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        console.error('CoinGecko API error:', error.message);
        return [];
    }
}

// Send notifications
async function sendNotification(alert) {
    // Email notification
    if (emailTransporter) {
        try {
            await emailTransporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: `🚨 Crypto Alert: ${alert.symbol}`,
                html: `
                    <h2>🚨 Crypto Price Alert</h2>
                    <p><strong>Symbol:</strong> ${alert.symbol}</p>
                    <p><strong>Price:</strong> $${alert.price}</p>
                    <p><strong>24h Change:</strong> ${alert.change_24h.toFixed(2)}%</p>
                    <p><strong>Reason:</strong> ${alert.reason}</p>
                `
            });
            console.log('📧 Email sent for', alert.symbol);
        } catch (error) {
            console.error('Email error:', error.message);
        }
    }
    
    // Telegram notification
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        try {
            const message = `🚨 *Crypto Alert*\n\n*${alert.symbol}*\nPrice: $${alert.price}\n24h Change: ${alert.change_24h.toFixed(2)}%\nReason: ${alert.reason}`;
            
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            });
            console.log('📱 Telegram sent for', alert.symbol);
        } catch (error) {
            console.error('Telegram error:', error.message);
        }
    }
}

// Check for alerts
function checkAlerts(data) {
    const threshold = parseFloat(process.env.PRICE_CHANGE_THRESHOLD) || 5;
    
    data.forEach(coin => {
        if (Math.abs(coin.change_24h) > threshold) {
            const alert = {
                symbol: coin.symbol,
                price: coin.price,
                change_24h: coin.change_24h,
                reason: `24h change exceeds ${threshold}%`,
                timestamp: new Date().toISOString()
            };
            
            alerts.push(alert);
            sendNotification(alert);
            broadcastToClients({ type: 'alert', data: alert });
        }
    });
}

// Update crypto data
async function updateCryptoData() {
    const startTime = Date.now();
    console.log('🔄 Updating crypto data...');
    
    try {
        let data = await fetchCoinMarketCapData();
        
        if (data.length === 0) {
            console.log('🔄 Falling back to CoinGecko...');
            data = await fetchCoinGeckoData();
        }
        
        if (data.length > 0) {
            // Update storage
            data.forEach(coin => cryptoData.set(coin.symbol, coin));
            
            // Check for alerts
            checkAlerts(data);
            
            // Broadcast to WebSocket clients
            const updateMessage = { 
                type: 'update', 
                data, 
                timestamp: new Date().toISOString(),
                source: data[0]?.source || 'unknown',
                count: data.length
            };
            broadcastToClients(updateMessage);
            
            const duration = Date.now() - startTime;
            console.log(`✅ Updated ${data.length} cryptocurrencies in ${duration}ms`);
            console.log(`📊 Top prices: ${data.slice(0, 3).map(c => `${c.symbol}: $${c.price}`).join(', ')}`);
        } else {
            console.log('❌ No data received from any API');
        }
    } catch (error) {
        console.error('❌ Update error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// API Routes
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

app.get('/api/status', (req, res) => {
    res.json({
        name: 'Crypto Market Monitor',
        version: '1.0.0',
        status: 'active',
        timestamp: new Date().toISOString(),
        websocket: `ws://localhost:${WS_PORT}`,
        endpoints: ['/api/crypto', '/api/alerts', '/api/status']
    });
});

app.get('/api/crypto', (req, res) => {
    res.json({
        data: Array.from(cryptoData.values()),
        count: cryptoData.size,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/alerts', (req, res) => {
    res.json({
        alerts: alerts.slice(-50),
        count: alerts.length,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        uptime: process.uptime(),
        connections: wsClients.size,
        last_update: cryptoData.size > 0 ? Array.from(cryptoData.values())[0].timestamp : null,
        api_keys: {
            coinmarketcap: !!process.env.COINMARKETCAP_API_KEY,
            coingecko: !!process.env.COINGECKO_API_KEY,
            github: !!process.env.GITHUB_TOKEN,
            telegram: !!process.env.TELEGRAM_BOT_TOKEN,
            email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Crypto Market Monitor Started!');
    console.log('=====================================');
    console.log(`📡 API Server: http://localhost:${PORT}`);
    console.log(`🌐 WebSocket: ws://localhost:${WS_PORT}`);
    console.log('');
    console.log('⚙️ Configuration:');
    console.log(`   CoinMarketCap: ${process.env.COINMARKETCAP_API_KEY ? '✅' : '❌'}`);
    console.log(`   CoinGecko: ${process.env.COINGECKO_API_KEY ? '✅' : '❌'}`);
    console.log(`   GitHub: ${process.env.GITHUB_TOKEN ? '✅' : '❌'}`);
    console.log(`   Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? '✅' : '❌'}`);
    console.log(`   Email: ${process.env.EMAIL_USER ? '✅' : '❌'}`);
    console.log('');
    
    updateCryptoData();
});

// Schedule frequent updates for real-time monitoring
console.log('⏰ Setting up automatic updates...');

// Update every 10 seconds for real-time experience
cron.schedule('*/10 * * * * *', () => {
    console.log('🔄 Auto-updating crypto data...');
    updateCryptoData();
});

// Also update every minute for backup
cron.schedule('* * * * *', () => {
    console.log('🔄 Minute update - fetching latest data...');
    updateCryptoData();
});

// Initial data fetch - immediate
console.log('🚀 Fetching initial crypto data...');
updateCryptoData();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    wss.close();
    process.exit(0);
});
