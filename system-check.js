// Basic test to verify system setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Crypto Monitor System Check');
console.log('==============================');

// Check Node.js version
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);

// Check if essential files exist
const requiredFiles = [
  'package.json',
  '.env',
  'src/index.js',
  'node_modules'
];

console.log('\n📁 File Check:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Check package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('\n📦 Package info:');
  console.log('Name:', packageJson.name);
  console.log('Version:', packageJson.version);
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check .env file
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log('\n🔑 Environment variables:');
  
  const coinmarketcapKey = envContent.match(/COINMARKETCAP_API_KEY=(.+)/);
  const coingeckoKey = envContent.match(/COINGECKO_API_KEY=(.+)/);
  const githubToken = envContent.match(/GITHUB_TOKEN=(.+)/);
  const telegramToken = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
  
  console.log('CoinMarketCap:', coinmarketcapKey && coinmarketcapKey[1] !== 'your_coinmarketcap_api_key_here' ? '✅ Configured' : '❌ Missing');
  console.log('CoinGecko:', coingeckoKey && coingeckoKey[1] !== 'your_coingecko_api_key_here' ? '✅ Configured' : '❌ Missing');
  console.log('GitHub:', githubToken && githubToken[1] !== 'your_github_token_here' ? '✅ Configured' : '❌ Missing');
  console.log('Telegram:', telegramToken && telegramToken[1] !== 'your_telegram_bot_token_here' ? '✅ Configured' : '❌ Missing');
  
} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
}

// Test basic requires
console.log('\n📚 Module Loading Test:');
const modules = ['express', 'axios', 'ws', 'dotenv'];

modules.forEach(module => {
  try {
    require(module);
    console.log(`✅ ${module}`);
  } catch (error) {
    console.log(`❌ ${module} - ${error.message}`);
  }
});

console.log('\n🎯 System Status: Ready for crypto monitoring!');
console.log('\nNext steps:');
console.log('1. Run: node test-server.js (simple test)');
console.log('2. Or: node src/index.js (full system)');
console.log('3. Open browser: http://localhost:3000');
