// ULTRA-MINIMAL SERVER - Zero Dependencies
const { createServer } = require('http');

const server = createServer((req, res) => {
    const { url, method } = req;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (url === '/' || url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'healthy',
            message: 'Crypto Monitor is LIVE!',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({
            error: 'Not Found',
            message: 'Server is working, but this endpoint does not exist'
        }));
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ MINIMAL SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🌐 Test: http://localhost:${PORT}/health`);
});

module.exports = server;
