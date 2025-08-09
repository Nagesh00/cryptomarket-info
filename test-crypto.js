const express = require('express');
const WebSocket = require('ws');
require('dotenv').config();

console.log('🚀 Starting Crypto Monitor Test...');

const app = express();
const PORT = 3000;
const WS_PORT = 8080;

// Test data
const testData = [
    { symbol: 'BTC', name: 'Bitcoin', price: 45000, change_24h: 2.5, source: 'test' },
    { symbol: 'ETH', name: 'Ethereum', price: 3000, change_24h: -1.2, source: 'test' },
    { symbol: 'ADA', name: 'Cardano', price: 0.5, change_24h: 5.8, source: 'test' }
];

app.use(express.static('public'));

// WebSocket Server
console.log('📡 Creating WebSocket server...');
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`✅ WebSocket server started on port ${WS_PORT}`);

wss.on('connection', (ws) => {
    console.log('🔗 New WebSocket client connected');
    
    // Send initial data
    ws.send(JSON.stringify({
        type: 'init',
        data: testData,
        timestamp: new Date().toISOString()
    }));
    
    ws.on('close', () => {
        console.log('❌ WebSocket client disconnected');
    });
});

// Broadcast test updates every 5 seconds
setInterval(() => {
    const updatedData = testData.map(coin => ({
        ...coin,
        price: coin.price * (1 + (Math.random() - 0.5) * 0.02), // Random 1% price change
        change_24h: coin.change_24h + (Math.random() - 0.5) * 2
    }));
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'update',
                data: updatedData,
                timestamp: new Date().toISOString()
            }));
        }
    });
    
    console.log('📊 Sent test update to', wss.clients.size, 'clients');
}, 5000);

// Routes
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

app.get('/api/crypto', (req, res) => {
    res.json({
        success: true,
        data: testData,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Crypto Monitor Test Started!');
    console.log('=====================================');
    console.log(`📡 Dashboard: http://localhost:${PORT}`);
    console.log(`🌐 WebSocket: ws://localhost:${WS_PORT}`);
    console.log('✅ Test mode with fake data active');
});

console.log('✅ Server setup complete, starting...');
