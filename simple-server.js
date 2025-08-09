const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Crypto Monitor...');

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Global storage for crypto data
let cryptoData = new Map();
let lastUpdate = null;

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
            // Update storage
            cryptoData.clear();
            data.forEach(coin => cryptoData.set(coin.symbol, coin));
            lastUpdate = new Date().toISOString();
            
            const duration = Date.now() - startTime;
            console.log(`✅ Updated ${data.length} cryptocurrencies in ${duration}ms`);
            console.log(`📊 Top 3: ${data.slice(0, 3).map(c => `${c.symbol}: $${c.price.toFixed(2)}`).join(', ')}`);
        } else {
            console.log('❌ No data received from any API');
        }
    } catch (error) {
        console.error('❌ Update error:', error.message);
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

app.get('/api/status', (req, res) => {
    res.json({
        name: 'Crypto Market Monitor',
        version: '1.0.0',
        status: 'active',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        data_count: cryptoData.size,
        last_update: lastUpdate,
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
