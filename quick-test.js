// Simple notification test
require('dotenv').config();
console.log('Testing notifications...');

async function testNotifications() {
    try {
        console.log('Telegram Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Found' : 'Missing');
        console.log('Telegram Chat ID:', process.env.TELEGRAM_CHAT_ID ? 'Found' : 'Missing');
        console.log('Email User:', process.env.EMAIL_USER ? 'Found' : 'Missing');
        console.log('Email Pass:', process.env.EMAIL_PASS ? 'Found' : 'Missing');
        
        const axios = require('axios');
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await axios.post(url, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: '🚀 Test from Crypto Monitor! System is working! 📈'
        }, { timeout: 10000 });

        console.log('Telegram response:', response.status);
        console.log('✅ Notification sent successfully!');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testNotifications();
