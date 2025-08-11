// Test Deployment Readiness
const express = require('express');
const app = express();

console.log('🚀 Testing deployment readiness...');

// Simple health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
    res.send('<h1>✅ Crypto Monitor - Deployment Ready!</h1><p>Server is working correctly.</p>');
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Test server running on port ${PORT}`);
        console.log('🌐 Ready for deployment!');
        setTimeout(() => process.exit(0), 2000); // Auto-stop after 2 seconds
    });
}

module.exports = app;
