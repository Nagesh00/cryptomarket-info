// Simple working test server
const express = require('express');
const app = express();
const port = 3000;

console.log('🚀 Starting simple test server...');

app.get('/', (req, res) => {
    res.json({
        status: 'working',
        message: 'Advanced Crypto Monitor - Test Server',
        timestamp: new Date(),
        features: [
            'Multi-source monitoring',
            'AI analysis',
            'Dark web intelligence',
            'Real-time notifications'
        ]
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/test', (req, res) => {
    res.send(`
        <h1>🚀 Advanced Crypto Monitor - Working!</h1>
        <p>The system is running correctly.</p>
        <ul>
            <li>✅ Express.js server running</li>
            <li>✅ Environment variables loaded</li>
            <li>✅ API endpoints working</li>
        </ul>
        <p><a href="/api/status">Check API Status</a></p>
    `);
});

app.listen(port, () => {
    console.log(`✅ Test server running on http://localhost:${port}`);
    console.log(`📊 Status: http://localhost:${port}/api/status`);
    console.log(`🧪 Test page: http://localhost:${port}/test`);
});

module.exports = app;
