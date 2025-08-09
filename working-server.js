// WORKING REAL-TIME NOTIFICATION SERVER
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

console.log('🚀 STARTING REAL-TIME CRYPTO NOTIFICATION SERVER...');
console.log('⏰ Started at:', new Date().toLocaleString());

// System status
let systemStatus = {
    startTime: new Date().toISOString(),
    notifications_sent: 0,
    alerts_triggered: 0,
    last_check: null,
    crypto_data: []
};

// Enhanced notification functions
async function sendTelegramMessage(message) {
    try {
        if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
            console.log('❌ Telegram not configured');
            return false;
        }

        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        }, { timeout: 10000 });

        if (response.data.ok) {
            systemStatus.notifications_sent++;
            console.log('✅ Telegram sent:', response.data.result.message_id);
            return true;
        }
        return false;
    } catch (error) {
        console.log('❌ Telegram error:', error.message);
        return false;
    }
}

async function sendEmailAlert(subject, content) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('❌ Email not configured');
            return false;
        }

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: subject,
            html: content
        });

        systemStatus.notifications_sent++;
        console.log('✅ Email sent successfully');
        return true;
    } catch (error) {
        console.log('❌ Email error:', error.message);
        return false;
    }
}

// Fetch crypto data with error handling
async function fetchCryptoData() {
    try {
        console.log('📡 Fetching crypto data...');
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: 'bitcoin,ethereum,cardano,polkadot,chainlink',
                vs_currencies: 'usd',
                include_24hr_change: true
            },
            timeout: 10000
        });

        const data = Object.entries(response.data).map(([id, info]) => ({
            id,
            symbol: id === 'bitcoin' ? 'BTC' : id === 'ethereum' ? 'ETH' : id.toUpperCase(),
            price: info.usd,
            change_24h: info.usd_24h_change || 0,
            timestamp: new Date().toISOString()
        }));

        systemStatus.crypto_data = data;
        systemStatus.last_check = new Date().toISOString();
        console.log(`✅ Fetched ${data.length} cryptos`);
        
        return data;
    } catch (error) {
        console.log('❌ Error fetching crypto data:', error.message);
        return systemStatus.crypto_data || [];
    }
}

// Check for price alerts
async function checkAlerts(currentData, previousData) {
    if (!previousData || previousData.length === 0) return;

    for (const current of currentData) {
        const previous = previousData.find(p => p.id === current.id);
        if (!previous) continue;

        const changePercent = ((current.price - previous.price) / previous.price) * 100;
        
        // Trigger alert for 5% change
        if (Math.abs(changePercent) >= 5) {
            systemStatus.alerts_triggered++;
            
            const direction = changePercent > 0 ? 'SURGED' : 'DROPPED';
            const emoji = changePercent > 0 ? '🚀' : '📉';
            
            const telegramMessage = `${emoji} <b>CRYPTO ALERT!</b> ${emoji}

💰 <b>${current.symbol}</b> has ${direction} by <b>${changePercent.toFixed(2)}%</b>

📊 Current Price: $${current.price.toFixed(6)}
📈 Previous Price: $${previous.price.toFixed(6)}
⏰ Time: ${new Date().toLocaleString()}

🔥 This is your real-time crypto monitoring system working!`;

            const emailSubject = `🚨 CRYPTO ALERT: ${current.symbol} ${direction} ${changePercent.toFixed(2)}%`;
            const emailContent = `
                <h1>${emoji} CRYPTO PRICE ALERT ${emoji}</h1>
                <h2>${current.symbol} has ${direction} by ${changePercent.toFixed(2)}%</h2>
                <p><strong>Current Price:</strong> $${current.price.toFixed(6)}</p>
                <p><strong>Previous Price:</strong> $${previous.price.toFixed(6)}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p>Your 24/7 crypto monitoring system is working perfectly!</p>
            `;

            // Send notifications
            console.log(`🚨 ALERT: ${current.symbol} ${direction} ${changePercent.toFixed(2)}%`);
            
            Promise.allSettled([
                sendTelegramMessage(telegramMessage),
                sendEmailAlert(emailSubject, emailContent)
            ]);
        }
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Real-Time Crypto Monitor WORKING!',
        status: 'ACTIVE',
        uptime: Math.floor((Date.now() - new Date(systemStatus.startTime)) / 1000),
        notifications_sent: systemStatus.notifications_sent,
        alerts_triggered: systemStatus.alerts_triggered,
        last_check: systemStatus.last_check,
        current_time: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        system: systemStatus,
        crypto_count: systemStatus.crypto_data.length
    });
});

app.get('/api/crypto', async (req, res) => {
    try {
        const data = await fetchCryptoData();
        res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/test-notification', async (req, res) => {
    try {
        console.log('🧪 Testing notifications...');
        
        const testMessage = `🧪 <b>TEST NOTIFICATION</b> 🧪

✅ Your crypto monitoring system is WORKING!
⏰ Time: ${new Date().toLocaleString()}
🚀 Real-time notifications are active!

This is a test to confirm your alerts are working perfectly.`;

        const emailSubject = '🧪 Crypto Monitor Test - WORKING!';
        const emailContent = `
            <h1>🧪 TEST NOTIFICATION</h1>
            <h2>✅ Your crypto monitoring system is WORKING!</h2>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Status:</strong> Real-time notifications are active!</p>
            <p>This is a test to confirm your alerts are working perfectly.</p>
        `;

        const [telegramResult, emailResult] = await Promise.allSettled([
            sendTelegramMessage(testMessage),
            sendEmailAlert(emailSubject, emailContent)
        ]);

        res.json({
            success: true,
            results: {
                telegram: telegramResult.status === 'fulfilled' ? telegramResult.value : false,
                email: emailResult.status === 'fulfilled' ? emailResult.value : false
            },
            message: 'Test notifications sent!'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start monitoring
let previousData = [];
let monitoringActive = false;

function startRealTimeMonitoring() {
    if (monitoringActive) return;
    
    monitoringActive = true;
    console.log('🔄 Starting real-time monitoring...');
    
    setInterval(async () => {
        try {
            const currentData = await fetchCryptoData();
            
            if (currentData.length > 0) {
                if (previousData.length > 0) {
                    await checkAlerts(currentData, previousData);
                }
                previousData = [...currentData];
            }
        } catch (error) {
            console.log('🚨 Monitoring error:', error.message);
        }
    }, 60000); // Check every minute
    
    console.log('✅ Real-time monitoring started (60-second intervals)');
}

// Start server
app.listen(PORT, async () => {
    console.log(`\n🎉 SERVER STARTED SUCCESSFULLY!`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`📊 Status: http://localhost:${PORT}/api/status`);
    console.log(`🧪 Test: POST http://localhost:${PORT}/api/test-notification`);
    
    // Configuration check
    console.log('\n📋 Configuration:');
    console.log('📱 Telegram:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing');
    console.log('📧 Email:', process.env.EMAIL_USER ? '✅ Configured' : '❌ Missing');
    
    // Initial data fetch
    await fetchCryptoData();
    
    // Start monitoring
    startRealTimeMonitoring();
    
    console.log('\n🔔 REAL-TIME NOTIFICATIONS ARE NOW ACTIVE!');
    console.log('💡 Test notifications: POST /api/test-notification');
});

module.exports = app;
