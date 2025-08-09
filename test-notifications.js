// Quick test for notification system
require('dotenv').config();

console.log('🔍 Testing Notification System...');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not set');
console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? '✅ Set' : '❌ Not set');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');

// Test Telegram notification
async function testTelegram() {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        console.log('❌ Telegram configuration missing');
        return;
    }

    try {
        const axios = require('axios');
        const message = '🚀 Test notification from Crypto Monitor System!';
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await axios.post(url, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });

        if (response.data.ok) {
            console.log('✅ Telegram notification sent successfully!');
            console.log('📱 Message ID:', response.data.result.message_id);
        } else {
            console.log('❌ Telegram notification failed:', response.data);
        }
    } catch (error) {
        console.log('❌ Telegram error:', error.message);
    }
}

// Test Email notification
async function testEmail() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('❌ Email configuration missing');
        return;
    }

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
            subject: '🚀 Crypto Monitor Test Notification',
            html: `
                <h2>🚀 Crypto Monitor System Test</h2>
                <p>This is a test notification from your crypto monitoring system.</p>
                <p><strong>Status:</strong> ✅ Email notifications working!</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email notification sent successfully!');
        console.log('📧 Message ID:', result.messageId);
    } catch (error) {
        console.log('❌ Email error:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('\n🔔 Testing Telegram...');
    await testTelegram();
    
    console.log('\n📧 Testing Email...');
    await testEmail();
    
    console.log('\n✅ Notification test complete!');
}

runTests().catch(console.error);
