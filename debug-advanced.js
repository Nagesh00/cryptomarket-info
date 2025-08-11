// Debug Test for Advanced Crypto Monitor
const fs = require('fs');
const path = require('path');

console.log('🔍 Advanced Crypto Monitor Debug Test');
console.log('=====================================');

// Check if files exist
const requiredFiles = [
    'advanced-crypto-monitor.js',
    'crypto-project-monitor.js',
    'crypto_analyzer.py',
    'dark_web_monitor.py',
    'config_manager.py'
];

console.log('\n📁 Checking required files:');
requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check Node.js modules
console.log('\n📦 Checking Node.js modules:');
const requiredModules = ['express', 'ws', 'axios', 'cors', 'helmet', 'dotenv'];

requiredModules.forEach(module => {
    try {
        require(module);
        console.log(`   ✅ ${module}`);
    } catch (error) {
        console.log(`   ❌ ${module} - ${error.message}`);
    }
});

// Check Python environment
console.log('\n🐍 Testing Python environment:');
const { spawn } = require('child_process');

const pythonPath = 'C:/Users/Nagnath/cryptoanalysis1/.venv/Scripts/python.exe';
const python = spawn(pythonPath, ['-c', 'import requests, aiohttp, numpy, pandas, textblob, websockets; print("All Python packages available")']);

python.stdout.on('data', (data) => {
    console.log(`   ✅ ${data.toString().trim()}`);
});

python.stderr.on('data', (data) => {
    console.log(`   ❌ Python error: ${data.toString().trim()}`);
});

python.on('close', (code) => {
    console.log(`\n🔍 Python test completed with code: ${code}`);
    
    // Test basic server functionality
    console.log('\n🚀 Testing basic server functionality:');
    try {
        const express = require('express');
        const app = express();
        
        app.get('/test', (req, res) => {
            res.json({ status: 'ok', message: 'Server test successful' });
        });
        
        const server = app.listen(3001, () => {
            console.log('   ✅ Express server can start on port 3001');
            server.close();
            
            // Now test the advanced crypto monitor
            console.log('\n🔬 Ready to test advanced crypto monitor!');
            console.log('Run: node advanced-crypto-monitor.js');
        });
        
    } catch (error) {
        console.log(`   ❌ Express test failed: ${error.message}`);
    }
});
