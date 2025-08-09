// Production-Ready 24/7 Crypto Monitoring Server
// Enhanced with comprehensive error handling and auto-recovery

const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global error handling
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    console.log('🔄 Server continuing to run...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    console.log('🔄 Server continuing to run...');
});

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// System status
let systemStatus = {
    startTime: new Date().toISOString(),
    uptime: 0,
    lastUpdate: new Date().toISOString(),
    cryptoData: [],
    alertHistory: [],
    requestCount: 0,
    errorCount: 0,
    notificationsSent: 0
};

// Enhanced crypto data fetching with retry logic
async function fetchCryptoData(retries = 3) {
    const cryptoIds = [
        'bitcoin', 'ethereum', 'cardano', 'polkadot', 'chainlink',
        'ripple', 'litecoin', 'bitcoin-cash', 'stellar', 'eos'
    ];
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`📡 Fetching crypto data (attempt ${attempt}/${retries})...`);
            
            const response = await axios.get(
                'https://api.coingecko.com/api/v3/simple/price',
                {
                    params: {
                        ids: cryptoIds.join(','),
                        vs_currencies: 'usd',
                        include_24hr_change: true,
                        include_24hr_vol: true,
                        include_market_cap: true
                    },
                    timeout: 10000
                }
            );

            const cryptoArray = Object.entries(response.data).map(([id, data]) => ({
                id,
                name: id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' '),
                symbol: getSymbolFromId(id),
                price: data.usd,
                change_24h: data.usd_24h_change || 0,
                volume_24h: data.usd_24h_vol || 0,
                market_cap: data.usd_market_cap || 0,
                lastUpdate: new Date().toISOString()
            }));

            systemStatus.cryptoData = cryptoArray;
            systemStatus.lastUpdate = new Date().toISOString();
            console.log(`✅ Successfully fetched ${cryptoArray.length} cryptocurrencies`);
            
            return cryptoArray;
            
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error.message);
            systemStatus.errorCount++;
            
            if (attempt === retries) {
                console.error('🚨 All attempts failed, using cached data if available');
                return systemStatus.cryptoData || [];
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
    }
}

// Symbol mapping
function getSymbolFromId(id) {
    const symbolMap = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'cardano': 'ADA',
        'polkadot': 'DOT',
        'chainlink': 'LINK',
        'ripple': 'XRP',
        'litecoin': 'LTC',
        'bitcoin-cash': 'BCH',
        'stellar': 'XLM',
        'eos': 'EOS'
    };
    return symbolMap[id] || id.toUpperCase();
}

// Enhanced notification system with error handling
async function sendTelegramNotification(message, retries = 3) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        console.log('⚠️ Telegram credentials not configured');
        return false;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
            
            const response = await axios.post(url, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }, { timeout: 10000 });

            if (response.data.ok) {
                console.log('✅ Telegram notification sent successfully');
                systemStatus.notificationsSent++;
                return true;
            } else {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }
        } catch (error) {
            console.error(`❌ Telegram attempt ${attempt} failed:`, error.message);
            
            if (attempt === retries) {
                systemStatus.errorCount++;
                return false;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
    
    return false;
}

async function sendEmailNotification(subject, htmlContent, retries = 3) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️ Email credentials not configured');
        return false;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const nodemailer = require('nodemailer');
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: subject,
                html: htmlContent
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Email notification sent successfully');
            systemStatus.notificationsSent++;
            return true;
            
        } catch (error) {
            console.error(`❌ Email attempt ${attempt} failed:`, error.message);
            
            if (attempt === retries) {
                systemStatus.errorCount++;
                return false;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
    
    return false;
}

// Price alert system
async function checkPriceAlerts(currentData, previousData) {
    if (!previousData || previousData.length === 0) return;

    const alerts = [];
    const significantChangeThreshold = 5; // 5%
    const rapidChangeThreshold = 2; // 2%

    for (const current of currentData) {
        const previous = previousData.find(p => p.id === current.id);
        if (!previous) continue;

        const priceChange = ((current.price - previous.price) / previous.price) * 100;
        const timeDiff = new Date(current.lastUpdate) - new Date(previous.lastUpdate);
        const isRapidChange = timeDiff < 300000; // 5 minutes

        if (Math.abs(priceChange) >= significantChangeThreshold) {
            const alert = {
                symbol: current.symbol,
                name: current.name,
                change: priceChange,
                currentPrice: current.price,
                previousPrice: previous.price,
                type: priceChange > 0 ? 'surge' : 'drop',
                timestamp: new Date().toISOString(),
                isRapid: isRapidChange && Math.abs(priceChange) >= rapidChangeThreshold
            };

            alerts.push(alert);
            systemStatus.alertHistory.push(alert);

            // Keep only last 100 alerts
            if (systemStatus.alertHistory.length > 100) {
                systemStatus.alertHistory = systemStatus.alertHistory.slice(-100);
            }

            // Send notifications
            const emoji = priceChange > 0 ? '🚀' : '📉';
            const direction = priceChange > 0 ? 'surged' : 'dropped';
            const urgency = alert.isRapid ? '⚡ RAPID ' : '';

            const telegramMessage = `${urgency}${emoji} <b>${current.symbol}</b> Alert!\n\n` +
                `${current.name} has ${direction} by <b>${priceChange.toFixed(2)}%</b>\n\n` +
                `💰 Current Price: $${current.price.toFixed(6)}\n` +
                `📊 Previous Price: $${previous.price.toFixed(6)}\n` +
                `⏰ Time: ${new Date().toLocaleString()}`;

            const emailSubject = `${urgency}Crypto Alert: ${current.symbol} ${direction} ${priceChange.toFixed(2)}%`;
            const emailContent = `
                <h2>${emoji} Crypto Price Alert</h2>
                <h3>${current.name} (${current.symbol})</h3>
                <p><strong>Price Change:</strong> ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%</p>
                <p><strong>Current Price:</strong> $${current.price.toFixed(6)}</p>
                <p><strong>Previous Price:</strong> $${previous.price.toFixed(6)}</p>
                <p><strong>24h Volume:</strong> $${current.volume_24h.toLocaleString()}</p>
                <p><strong>Market Cap:</strong> $${current.market_cap.toLocaleString()}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            `;

            // Send notifications concurrently
            Promise.allSettled([
                sendTelegramNotification(telegramMessage),
                sendEmailNotification(emailSubject, emailContent)
            ]);
        }
    }

    return alerts;
}

// API Routes
app.get('/', (req, res) => {
    systemStatus.requestCount++;
    res.json({
        message: '🚀 Crypto Monitor 24/7 System - Production Ready',
        status: 'running',
        version: '2.0.0',
        uptime: Math.floor((Date.now() - new Date(systemStatus.startTime)) / 1000),
        data_count: systemStatus.cryptoData.length,
        notifications_sent: systemStatus.notificationsSent,
        last_update: systemStatus.lastUpdate,
        endpoints: [
            'GET / - System status',
            'GET /api/crypto - All crypto data',
            'GET /api/crypto/:symbol - Specific crypto',
            'GET /api/status - Detailed system status',
            'GET /api/alerts - Recent alerts',
            'POST /api/test-notification - Test notifications'
        ]
    });
});

app.get('/api/crypto', async (req, res) => {
    try {
        systemStatus.requestCount++;
        const data = await fetchCryptoData();
        res.json({
            success: true,
            data: data,
            timestamp: new Date().toISOString(),
            total_count: data.length
        });
    } catch (error) {
        systemStatus.errorCount++;
        res.status(500).json({
            success: false,
            error: 'Failed to fetch crypto data',
            message: error.message
        });
    }
});

app.get('/api/crypto/:symbol', async (req, res) => {
    try {
        systemStatus.requestCount++;
        const symbol = req.params.symbol.toUpperCase();
        const data = await fetchCryptoData();
        const crypto = data.find(c => c.symbol === symbol);
        
        if (crypto) {
            res.json({
                success: true,
                data: crypto,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Cryptocurrency not found',
                available_symbols: data.map(c => c.symbol)
            });
        }
    } catch (error) {
        systemStatus.errorCount++;
        res.status(500).json({
            success: false,
            error: 'Failed to fetch crypto data',
            message: error.message
        });
    }
});

app.get('/api/status', (req, res) => {
    systemStatus.requestCount++;
    systemStatus.uptime = Math.floor((Date.now() - new Date(systemStatus.startTime)) / 1000);
    
    res.json({
        success: true,
        system: systemStatus,
        environment: {
            node_version: process.version,
            platform: process.platform,
            memory_usage: process.memoryUsage(),
            pid: process.pid,
            port: PORT
        },
        configuration: {
            telegram_configured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
            email_configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
        }
    });
});

app.get('/api/alerts', (req, res) => {
    systemStatus.requestCount++;
    const count = parseInt(req.query.count) || 20;
    const recentAlerts = systemStatus.alertHistory.slice(-count);
    
    res.json({
        success: true,
        alerts: recentAlerts,
        total_alerts: systemStatus.alertHistory.length,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/test-notification', async (req, res) => {
    try {
        systemStatus.requestCount++;
        
        const testMessage = `🧪 Test Notification from Crypto Monitor\n\n` +
            `✅ System is running smoothly!\n` +
            `⏰ Time: ${new Date().toLocaleString()}\n` +
            `📊 Uptime: ${Math.floor((Date.now() - new Date(systemStatus.startTime)) / 1000)} seconds`;

        const emailSubject = '🧪 Crypto Monitor Test Notification';
        const emailContent = `
            <h2>🧪 Test Notification</h2>
            <p>This is a test notification from your Crypto Monitor system.</p>
            <p><strong>Status:</strong> ✅ System running smoothly</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Uptime:</strong> ${Math.floor((Date.now() - new Date(systemStatus.startTime)) / 1000)} seconds</p>
        `;

        const [telegramResult, emailResult] = await Promise.allSettled([
            sendTelegramNotification(testMessage),
            sendEmailNotification(emailSubject, emailContent)
        ]);

        res.json({
            success: true,
            results: {
                telegram: telegramResult.status === 'fulfilled' ? telegramResult.value : false,
                email: emailResult.status === 'fulfilled' ? emailResult.value : false
            },
            message: 'Test notifications sent'
        });
    } catch (error) {
        systemStatus.errorCount++;
        res.status(500).json({
            success: false,
            error: 'Failed to send test notifications',
            message: error.message
        });
    }
});

// Serve static HTML dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// 24/7 monitoring loop
let previousData = [];
async function startMonitoring() {
    console.log('🔄 Starting 24/7 monitoring system...');
    
    setInterval(async () => {
        try {
            const currentData = await fetchCryptoData();
            
            if (currentData && currentData.length > 0) {
                // Check for price alerts
                if (previousData.length > 0) {
                    await checkPriceAlerts(currentData, previousData);
                }
                
                previousData = [...currentData];
            }
        } catch (error) {
            console.error('🚨 Monitoring cycle error:', error.message);
            systemStatus.errorCount++;
        }
    }, 60000); // Check every minute

    // Health check every 5 minutes
    setInterval(() => {
        console.log(`💓 System health check - Uptime: ${Math.floor((Date.now() - new Date(systemStatus.startTime)) / 1000)}s`);
        console.log(`📊 Stats: ${systemStatus.requestCount} requests, ${systemStatus.errorCount} errors, ${systemStatus.notificationsSent} notifications`);
    }, 300000);
}

// Start server
const server = app.listen(PORT, () => {
    console.log('🚀 Production Crypto Monitor Server Started!');
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🔔 Notifications: ${!!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) ? 'Telegram ✅' : 'Telegram ❌'}, ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'Email ✅' : 'Email ❌'}`);
    console.log('⚡ 24/7 monitoring starting...');
    
    // Initialize with first data fetch
    fetchCryptoData().then(() => {
        startMonitoring();
        console.log('✅ 24/7 Real-time monitoring system is now active!');
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});

module.exports = app;
