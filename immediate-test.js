// Immediate Notification Test - Debug Version
require('dotenv').config();

console.log('🔍 IMMEDIATE NOTIFICATION TEST STARTING...');
console.log('🕒 Time:', new Date().toISOString());

// Check environment variables
console.log('\n📋 Environment Check:');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ FOUND' : '❌ MISSING');
console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? '✅ FOUND' : '❌ MISSING');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ FOUND' : '❌ MISSING');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ FOUND' : '❌ MISSING');

// Test Telegram notification immediately
async function testTelegramNow() {
    console.log('\n🔔 TESTING TELEGRAM NOTIFICATION...');
    
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        console.log('❌ Telegram credentials missing!');
        return false;
    }

    try {
        const axios = require('axios');
        const message = `🚨 IMMEDIATE TEST ALERT! 🚨

🔥 Crypto Monitor System Test
⏰ Time: ${new Date().toLocaleString()}
📍 Status: TESTING REAL-TIME NOTIFICATIONS
🚀 Your system is working!

This is a test message to verify your notifications are working correctly.`;

        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        console.log('📡 Sending to Telegram API...');
        console.log('🔗 URL:', url.substring(0, 50) + '...');
        console.log('👤 Chat ID:', process.env.TELEGRAM_CHAT_ID);
        
        const response = await axios.post(url, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        }, { 
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.ok) {
            console.log('✅ TELEGRAM SUCCESS!');
            console.log('📱 Message ID:', response.data.result.message_id);
            console.log('📊 Response:', JSON.stringify(response.data, null, 2));
            return true;
        } else {
            console.log('❌ TELEGRAM FAILED!');
            console.log('📊 Response:', JSON.stringify(response.data, null, 2));
            return false;
        }
    } catch (error) {
        console.log('❌ TELEGRAM ERROR!');
        console.log('🚨 Error details:', error.message);
        if (error.response) {
            console.log('📊 Response status:', error.response.status);
            console.log('📊 Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

// Test Email notification immediately
async function testEmailNow() {
    console.log('\n📧 TESTING EMAIL NOTIFICATION...');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('❌ Email credentials missing!');
        return false;
    }

    try {
        const nodemailer = require('nodemailer');
        
        console.log('📡 Creating email transporter...');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        console.log('✅ Transporter created');
        console.log('📧 From:', process.env.EMAIL_USER);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: '🚨 IMMEDIATE CRYPTO ALERT TEST - ' + new Date().toLocaleTimeString(),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #ff6b35; text-align: center;">🚨 IMMEDIATE TEST ALERT! 🚨</h1>
                    
                    <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h2>🔥 Crypto Monitor System Test</h2>
                        <p><strong>⏰ Time:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>📍 Status:</strong> TESTING REAL-TIME NOTIFICATIONS</p>
                        <p><strong>🚀 Result:</strong> Your system is working!</p>
                    </div>
                    
                    <p>This is an immediate test message to verify your email notifications are working correctly.</p>
                    
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>📊 System Information:</h3>
                        <ul>
                            <li>Node.js Version: ${process.version}</li>
                            <li>Platform: ${process.platform}</li>
                            <li>Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center; color: #666;">
                        🎉 Congratulations! Your 24/7 crypto monitoring system is working perfectly!
                    </p>
                </div>
            `
        };

        console.log('📤 Sending email...');
        const result = await transporter.sendMail(mailOptions);
        
        console.log('✅ EMAIL SUCCESS!');
        console.log('📧 Message ID:', result.messageId);
        console.log('📊 Response:', result.response);
        return true;
        
    } catch (error) {
        console.log('❌ EMAIL ERROR!');
        console.log('🚨 Error details:', error.message);
        console.log('🔍 Error code:', error.code);
        return false;
    }
}

// Run tests immediately
async function runImmediateTests() {
    console.log('\n🚀 STARTING IMMEDIATE NOTIFICATION TESTS...');
    console.log('=' + '='.repeat(50));
    
    try {
        const telegramResult = await testTelegramNow();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        const emailResult = await testEmailNow();
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 FINAL RESULTS:');
        console.log('📱 Telegram:', telegramResult ? '✅ SUCCESS' : '❌ FAILED');
        console.log('📧 Email:', emailResult ? '✅ SUCCESS' : '❌ FAILED');
        
        if (telegramResult && emailResult) {
            console.log('\n🎉 BOTH NOTIFICATIONS WORKING PERFECTLY!');
            console.log('🔔 You should have received messages on both Telegram and Email');
        } else if (telegramResult || emailResult) {
            console.log('\n⚠️ PARTIAL SUCCESS - One notification method working');
        } else {
            console.log('\n❌ BOTH NOTIFICATIONS FAILED - Check credentials and connection');
        }
        
    } catch (error) {
        console.log('\n🚨 CRITICAL ERROR:', error.message);
    }
    
    console.log('\n✅ Test completed at:', new Date().toLocaleString());
}

// Execute immediately
runImmediateTests().catch(console.error);
