// IMMEDIATE WORKING NOTIFICATION TEST
require('dotenv').config();

console.log('🚀 IMMEDIATE NOTIFICATION TEST - STARTING NOW!');
console.log('Time:', new Date().toLocaleString());

// Test Telegram immediately
async function sendTelegramNow() {
    console.log('\n📱 SENDING TELEGRAM NOTIFICATION...');
    
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) {
        console.log('❌ Missing Telegram credentials');
        return false;
    }
    
    console.log('Token:', token.substring(0, 10) + '...');
    console.log('Chat ID:', chatId);
    
    try {
        const https = require('https');
        const querystring = require('querystring');
        
        const message = `🚨 IMMEDIATE CRYPTO ALERT! 🚨

✅ Your real-time notification system is WORKING!
⏰ ${new Date().toLocaleString()}
📈 Bitcoin just moved! (Test alert)
🔥 System is monitoring 24/7!

This alert was sent immediately to test your system!`;

        const data = querystring.stringify({
            chat_id: chatId,
            text: message
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => responseData += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(responseData);
                        if (response.ok) {
                            console.log('✅ TELEGRAM SUCCESS!');
                            console.log('📱 Message sent! ID:', response.result.message_id);
                            resolve(true);
                        } else {
                            console.log('❌ TELEGRAM FAILED:', response.description);
                            resolve(false);
                        }
                    } catch (e) {
                        console.log('❌ TELEGRAM ERROR parsing response:', e.message);
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                console.log('❌ TELEGRAM REQUEST ERROR:', error.message);
                resolve(false);
            });

            req.write(data);
            req.end();
        });
        
    } catch (error) {
        console.log('❌ TELEGRAM EXCEPTION:', error.message);
        return false;
    }
}

// Test email immediately
async function sendEmailNow() {
    console.log('\n📧 SENDING EMAIL NOTIFICATION...');
    
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    
    if (!user || !pass) {
        console.log('❌ Missing email credentials');
        return false;
    }
    
    console.log('Email:', user);
    
    try {
        // Simple SMTP without nodemailer for immediate testing
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });

        const mailOptions = {
            from: user,
            to: user,
            subject: '🚨 IMMEDIATE CRYPTO ALERT - ' + new Date().toLocaleTimeString(),
            html: `
                <h1 style="color: red;">🚨 IMMEDIATE CRYPTO ALERT! 🚨</h1>
                <h2>✅ Your real-time notification system is WORKING!</h2>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Alert:</strong> Bitcoin just moved! (Test alert)</p>
                <p><strong>Status:</strong> System is monitoring 24/7!</p>
                <p style="color: green; font-weight: bold;">This alert was sent immediately to test your system!</p>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ EMAIL SUCCESS!');
        console.log('📧 Message ID:', result.messageId);
        return true;
        
    } catch (error) {
        console.log('❌ EMAIL ERROR:', error.message);
        return false;
    }
}

// Run tests now
async function runTests() {
    console.log('\n🔥 RUNNING IMMEDIATE TESTS...');
    
    const telegramResult = await sendTelegramNow();
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const emailResult = await sendEmailNow();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMMEDIATE RESULTS:');
    console.log('📱 Telegram:', telegramResult ? '✅ SUCCESS - Check your Telegram!' : '❌ FAILED');
    console.log('📧 Email:', emailResult ? '✅ SUCCESS - Check your email!' : '❌ FAILED');
    
    if (telegramResult || emailResult) {
        console.log('\n🎉 NOTIFICATIONS ARE WORKING!');
        console.log('🔔 You should have received immediate alerts!');
    } else {
        console.log('\n❌ Both failed - check your credentials in .env file');
    }
    
    console.log('\n✅ Test completed:', new Date().toLocaleString());
}

// Execute immediately
runTests().catch(console.error);
