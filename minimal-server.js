// MINIMAL WORKING NOTIFICATION SYSTEM
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

console.log('🚀 MINIMAL CRYPTO NOTIFICATION SERVER STARTING...');

// Simple HTTP request function
function makeRequest(url, data) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: url.replace('https://api.telegram.org', ''),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Send Telegram notification
async function sendAlert(message) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        console.log('❌ Telegram not configured');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await makeRequest(url, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });

        if (response.ok) {
            console.log('✅ Alert sent! Message ID:', response.result.message_id);
            return true;
        } else {
            console.log('❌ Failed:', response.description);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        status: 'WORKING',
        message: 'Crypto Monitor is ACTIVE!',
        time: new Date().toISOString(),
        notifications: process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not configured'
    });
});

app.get('/dashboard', (req, res) => {
    const path = require('path');
    res.sendFile(path.join(__dirname, 'dashboard-simple.html'));
});

app.post('/test', async (req, res) => {
    console.log('🧪 Testing notification...');
    
    const message = `🚨 TEST ALERT! 🚨

✅ Your crypto monitor is WORKING!
⏰ ${new Date().toLocaleString()}
🔥 Real-time notifications active!

This is an immediate test notification.`;

    const result = await sendAlert(message);
    
    res.json({
        success: result,
        message: result ? 'Notification sent!' : 'Failed to send notification',
        time: new Date().toISOString()
    });
});

// Crypto monitoring with alerts
let lastPrices = {};

async function getCryptoPrices() {
    return new Promise((resolve, reject) => {
        const https = require('https');
        
        const req = https.request('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

async function checkPrices() {
    try {
        console.log('📡 Checking crypto prices...');
        const prices = await getCryptoPrices();
        
        for (const [crypto, data] of Object.entries(prices)) {
            const currentPrice = data.usd;
            const change24h = data.usd_24h_change || 0;
            
            if (lastPrices[crypto]) {
                const priceChange = ((currentPrice - lastPrices[crypto]) / lastPrices[crypto]) * 100;
                
                // Alert on 3% change for testing (lower threshold)
                if (Math.abs(priceChange) >= 3) {
                    const symbol = crypto === 'bitcoin' ? 'BTC' : 'ETH';
                    const direction = priceChange > 0 ? 'SURGED' : 'DROPPED';
                    const emoji = priceChange > 0 ? '🚀' : '📉';
                    
                    const alertMessage = `${emoji} <b>CRYPTO ALERT!</b> ${emoji}

💰 <b>${symbol}</b> ${direction} by <b>${priceChange.toFixed(2)}%</b>

📊 Current: $${currentPrice.toFixed(2)}
📈 24h Change: ${change24h.toFixed(2)}%
⏰ ${new Date().toLocaleString()}

🔥 Your 24/7 monitoring is working!`;

                    console.log(`🚨 PRICE ALERT: ${symbol} ${direction} ${priceChange.toFixed(2)}%`);
                    await sendAlert(alertMessage);
                }
            }
            
            lastPrices[crypto] = currentPrice;
        }
        
        console.log('✅ Price check completed');
    } catch (error) {
        console.log('❌ Price check error:', error.message);
    }
}

// Start server
app.listen(3000, async () => {
    console.log('\n✅ SERVER RUNNING ON PORT 3000!');
    console.log('🌐 Test: http://localhost:3000');
    console.log('🧪 Test notification: POST http://localhost:3000/test');
    
    console.log('\n📋 Configuration:');
    console.log('📱 Telegram:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Ready' : '❌ Missing');
    
    // Send startup notification
    if (process.env.TELEGRAM_BOT_TOKEN) {
        console.log('\n📤 Sending startup notification...');
        await sendAlert(`🚀 <b>CRYPTO MONITOR STARTED!</b> 🚀

✅ System is now monitoring crypto prices 24/7!
⏰ Started at: ${new Date().toLocaleString()}
🔔 You will receive alerts for price changes ≥3%

Your real-time notification system is ACTIVE!`);
    }
    
    // Initial price fetch
    await checkPrices();
    
    // Start monitoring every 2 minutes for testing
    setInterval(checkPrices, 120000);
    console.log('🔄 Price monitoring started (2-minute intervals for testing)');
});

console.log('🔄 Starting server...');
