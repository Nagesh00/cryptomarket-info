console.log('🔍 Debugging Crypto Monitor Setup');
console.log('Node.js Version:', process.version);
console.log('Platform:', process.platform);
console.log('Current Working Directory:', process.cwd());

// Test basic requires
try {
  console.log('\n📦 Testing Package Requirements:');
  
  const express = require('express');
  console.log('✅ Express loaded successfully');
  
  const axios = require('axios');
  console.log('✅ Axios loaded successfully');
  
  const WebSocket = require('ws');
  console.log('✅ WebSocket loaded successfully');
  
  const dotenv = require('dotenv');
  console.log('✅ Dotenv loaded successfully');
  
  // Load environment variables
  dotenv.config();
  console.log('\n🔧 Environment Configuration:');
  console.log('CoinMarketCap API Key:', process.env.COINMARKETCAP_API_KEY ? 'Configured ✅' : 'Missing ❌');
  console.log('CoinGecko API Key:', process.env.COINGECKO_API_KEY ? 'Configured ✅' : 'Missing ❌');
  console.log('GitHub Token:', process.env.GITHUB_TOKEN ? 'Configured ✅' : 'Missing ❌');
  console.log('Telegram Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Configured ✅' : 'Missing ❌');
  
  console.log('\n🎯 All basic requirements satisfied! Ready to start monitoring system.');
  
} catch (error) {
  console.error('\n❌ Error loading packages:', error.message);
  console.log('\n🔄 Please run: npm install express axios ws dotenv');
}
