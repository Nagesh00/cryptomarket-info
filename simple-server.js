const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Real-Time Crypto Monitor with Notifications...');

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Global storage for crypto data
let cryptoData = new Map();
let lastUpdate = null;
let alertHistory = [];

// Email transporter setup
let emailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    console.log('✅ Email transporter configured for:', process.env.EMAIL_USER);
} else {
    console.log('⚠️ Email credentials not found');
}

// Telegram Bot Setup
async function sendTelegramMessage(message) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        console.log('⚠️ Telegram credentials not configured');
        return false;
    }
    
    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            }
        );
        console.log('✅ Telegram message sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Telegram error:', error.message);
        return false;
    }
}

// Email notification function
async function sendEmailAlert(subject, message) {
    if (!emailTransporter) {
        console.log('⚠️ Email transporter not configured');
        return false;
    }
    
    try {
        await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: subject,
            html: message
        });
        console.log('✅ Email alert sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Email error:', error.message);
        return false;
    }
}

// CoinMarketCap API integration
async function fetchCoinMarketCapData() {
    try {
        console.log('📡 Fetching from CoinMarketCap...');
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
            },
            params: {
                start: 1,
                limit: 20,
                convert: 'USD'
            }
        });
        
        const coins = response.data.data.map(coin => ({
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
        
        console.log(`✅ Fetched ${coins.length} coins from CoinMarketCap`);
        return coins;
    } catch (error) {
        console.error('❌ CoinMarketCap API error:', error.message);
        return [];
    }
}

// CoinGecko API integration (fallback)
async function fetchCoinGeckoData() {
    try {
        console.log('📡 Fetching from CoinGecko...');
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
        
        const coins = response.data.map(coin => ({
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
        
        console.log(`✅ Fetched ${coins.length} coins from CoinGecko`);
        return coins;
    } catch (error) {
        console.error('❌ CoinGecko API error:', error.message);
        return [];
    }
}

// Price change detection and alerts
async function checkPriceAlerts(newData) {
    const threshold = parseFloat(process.env.PRICE_CHANGE_THRESHOLD) || 5;
    
    for (const coin of newData) {
        const previousCoin = cryptoData.get(coin.symbol);
        
        // Check for significant price changes
        if (previousCoin && Math.abs(coin.change_24h) >= threshold) {
            const alert = {
                id: Date.now(),
                symbol: coin.symbol,
                name: coin.name,
                current_price: coin.price,
                previous_price: previousCoin.price,
                change_24h: coin.change_24h,
                change_amount: coin.price - previousCoin.price,
                threshold: threshold,
                timestamp: new Date().toISOString(),
                type: coin.change_24h > 0 ? 'gain' : 'loss'
            };
            
            alertHistory.unshift(alert);
            if (alertHistory.length > 100) alertHistory.pop(); // Keep last 100 alerts
            
            // Send notifications
            await sendRealTimeNotifications(alert);
        }
        
        // Check for rapid price movements (comparing with previous price)
        if (previousCoin) {
            const rapidChangePercent = ((coin.price - previousCoin.price) / previousCoin.price) * 100;
            if (Math.abs(rapidChangePercent) >= 2) { // 2% rapid change threshold
                const rapidAlert = {
                    id: Date.now() + 1,
                    symbol: coin.symbol,
                    name: coin.name,
                    current_price: coin.price,
                    previous_price: previousCoin.price,
                    rapid_change: rapidChangePercent,
                    timestamp: new Date().toISOString(),
                    type: 'rapid_movement'
                };
                
                alertHistory.unshift(rapidAlert);
                await sendRealTimeNotifications(rapidAlert);
            }
        }
    }
}

// Send real-time notifications
async function sendRealTimeNotifications(alert) {
    const timestamp = new Date(alert.timestamp).toLocaleString();
    
    if (alert.type === 'rapid_movement') {
        // Rapid movement alert
        const changeIcon = alert.rapid_change > 0 ? '🚀' : '📉';
        const changeText = alert.rapid_change > 0 ? 'SURGE' : 'DROP';
        
        const telegramMessage = `
🚨 <b>RAPID MOVEMENT ALERT</b> ${changeIcon}

💰 <b>${alert.name} (${alert.symbol})</b>
📈 <b>${changeText}:</b> ${alert.rapid_change.toFixed(2)}%
💵 <b>Price:</b> $${alert.current_price.toFixed(6)}
📊 <b>Previous:</b> $${alert.previous_price.toFixed(6)}
🕒 <b>Time:</b> ${timestamp}

<i>Rapid price movement detected!</i>
        `.trim();
        
        const emailSubject = `🚨 Crypto Alert: ${alert.symbol} ${changeText} ${alert.rapid_change.toFixed(2)}%`;
        const emailMessage = `
            <h2>🚨 Rapid Movement Alert ${changeIcon}</h2>
            <h3>${alert.name} (${alert.symbol})</h3>
            <p><strong>Movement:</strong> ${changeText} ${alert.rapid_change.toFixed(2)}%</p>
            <p><strong>Current Price:</strong> $${alert.current_price.toFixed(6)}</p>
            <p><strong>Previous Price:</strong> $${alert.previous_price.toFixed(6)}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><em>This alert was triggered due to rapid price movement in the last update cycle.</em></p>
        `;
        
        // Send notifications
        sendTelegramMessage(telegramMessage);
        sendEmailAlert(emailSubject, emailMessage);
        
    } else {
        // 24h change alert
        const changeIcon = alert.change_24h > 0 ? '📈' : '📉';
        const changeText = alert.change_24h > 0 ? 'GAIN' : 'LOSS';
        
        const telegramMessage = `
🚨 <b>PRICE ALERT</b> ${changeIcon}

💰 <b>${alert.name} (${alert.symbol})</b>
📊 <b>24h Change:</b> ${alert.change_24h.toFixed(2)}%
💵 <b>Price:</b> $${alert.current_price.toFixed(6)}
📈 <b>Change Amount:</b> $${alert.change_amount.toFixed(6)}
⚠️ <b>Threshold:</b> ±${alert.threshold}%
🕒 <b>Time:</b> ${timestamp}

<i>Significant price movement detected!</i>
        `.trim();
        
        const emailSubject = `🚨 Crypto Alert: ${alert.symbol} ${changeText} ${alert.change_24h.toFixed(2)}%`;
        const emailMessage = `
            <h2>🚨 Price Alert ${changeIcon}</h2>
            <h3>${alert.name} (${alert.symbol})</h3>
            <p><strong>24h Change:</strong> ${alert.change_24h.toFixed(2)}%</p>
            <p><strong>Current Price:</strong> $${alert.current_price.toFixed(6)}</p>
            <p><strong>Price Change:</strong> $${alert.change_amount.toFixed(6)}</p>
            <p><strong>Alert Threshold:</strong> ±${alert.threshold}%</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><em>This alert was triggered because the 24h price change exceeded your configured threshold of ±${alert.threshold}%.</em></p>
        `;
        
        // Send notifications
        sendTelegramMessage(telegramMessage);
        sendEmailAlert(emailSubject, emailMessage);
    }
    
    console.log(`🚨 Alert sent for ${alert.symbol}: ${alert.type}`);
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
            // Check for price alerts before updating storage
            await checkPriceAlerts(data);
            
            // Update storage
            cryptoData.clear();
            data.forEach(coin => cryptoData.set(coin.symbol, coin));
            lastUpdate = new Date().toISOString();
            
            const duration = Date.now() - startTime;
            console.log(`✅ Updated ${data.length} cryptocurrencies in ${duration}ms`);
            console.log(`📊 Top 3: ${data.slice(0, 3).map(c => `${c.symbol}: $${c.price.toFixed(2)}`).join(', ')}`);
            
            // Show alert summary
            if (alertHistory.length > 0) {
                const recentAlerts = alertHistory.filter(a => 
                    new Date(a.timestamp) > new Date(Date.now() - 300000) // Last 5 minutes
                ).length;
                if (recentAlerts > 0) {
                    console.log(`🚨 Recent alerts (5min): ${recentAlerts}`);
                }
            }
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

app.get('/api/crypto', (req, res) => {
    const data = Array.from(cryptoData.values());
    res.json({
        success: true,
        data: data,
        count: data.length,
        last_update: lastUpdate,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/alerts', (req, res) => {
    res.json({
        success: true,
        alerts: alertHistory.slice(0, 50), // Last 50 alerts
        count: alertHistory.length,
        timestamp: new Date().toISOString()
    });
});

// Test notification endpoint
app.post('/api/test-notifications', async (req, res) => {
    try {
        const testAlert = {
            symbol: 'TEST',
            name: 'Test Cryptocurrency',
            current_price: 1000,
            change_24h: 10,
            threshold: 5,
            timestamp: new Date().toISOString(),
            type: 'gain'
        };
        
        await sendRealTimeNotifications(testAlert);
        
        res.json({
            success: true,
            message: 'Test notifications sent',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        name: 'Crypto Market Monitor with Real-Time Notifications',
        version: '2.0.0',
        status: 'active',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        data_count: cryptoData.size,
        last_update: lastUpdate,
        alert_count: alertHistory.length,
        recent_alerts: alertHistory.filter(a => 
            new Date(a.timestamp) > new Date(Date.now() - 3600000) // Last hour
        ).length,
        notifications: {
            telegram: {
                configured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
                bot_token: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'missing',
                chat_id: process.env.TELEGRAM_CHAT_ID ? 'configured' : 'missing'
            },
            email: {
                configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
                user: process.env.EMAIL_USER || 'not configured',
                service: 'gmail'
            }
        },
        thresholds: {
            price_change_24h: parseFloat(process.env.PRICE_CHANGE_THRESHOLD) || 5,
            rapid_movement: 2
        },
        api_keys: {
            coinmarketcap: !!process.env.COINMARKETCAP_API_KEY,
            coingecko: !!process.env.COINGECKO_API_KEY
        },
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Crypto Market Monitor Started!');
    console.log('=====================================');
    console.log(`📡 Dashboard: http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/crypto`);
    console.log('');
    console.log('⚙️ Configuration:');
    console.log(`   CoinMarketCap: ${process.env.COINMARKETCAP_API_KEY ? '✅' : '❌'}`);
    console.log(`   CoinGecko: ${process.env.COINGECKO_API_KEY ? '✅' : '❌'}`);
    console.log('');
    
    // Initial data fetch
    console.log('🚀 Fetching initial crypto data...');
    updateCryptoData();
});

// Schedule frequent updates - every 15 seconds for real-time experience
console.log('⏰ Setting up automatic updates every 15 seconds...');
cron.schedule('*/15 * * * * *', () => {
    console.log('🔄 Auto-updating crypto data...');
    updateCryptoData();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

console.log('✅ Server setup complete!');
