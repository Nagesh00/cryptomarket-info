const express = require('express');
console.log('Starting basic server...');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 Crypto Monitor Test</h1>
        <p>Server is running at ${new Date()}</p>
        <p>WebSocket test coming soon...</p>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ Basic server running at http://localhost:${PORT}`);
});
