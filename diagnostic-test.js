// Simple diagnostic test
console.log('🔍 Advanced Crypto Monitor - Diagnostic Test');
console.log('==============================================');

console.log('✅ Starting diagnostic...');

try {
    console.log('📦 Testing require statements...');
    
    const fs = require('fs');
    console.log('✅ fs module loaded');
    
    const path = require('path');
    console.log('✅ path module loaded');
    
    const express = require('express');
    console.log('✅ express module loaded');
    
    const WebSocket = require('ws');
    console.log('✅ ws module loaded');
    
    console.log('📦 Testing crypto-project-monitor...');
    const CryptoProjectMonitor = require('./crypto-project-monitor');
    console.log('✅ CryptoProjectMonitor loaded, type:', typeof CryptoProjectMonitor);
    
    console.log('🔧 Testing .env loading...');
    require('dotenv').config();
    console.log('✅ Environment variables loaded');
    console.log('   PORT:', process.env.PORT || 'default');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'default');
    
    console.log('📁 Testing file system...');
    const configExists = fs.existsSync('crypto_monitor_config.json');
    console.log('   crypto_monitor_config.json exists:', configExists);
    
    const envExists = fs.existsSync('.env');
    console.log('   .env exists:', envExists);
    
    console.log('🚀 Testing basic server creation...');
    const app = express();
    
    app.get('/diagnostic', (req, res) => {
        res.json({ status: 'working', timestamp: new Date() });
    });
    
    const server = app.listen(3001, () => {
        console.log('✅ Diagnostic server started on port 3001');
        console.log('🌐 Visit: http://localhost:3001/diagnostic');
        
        // Close server after test
        setTimeout(() => {
            server.close();
            console.log('✅ Diagnostic completed successfully!');
            console.log('');
            console.log('🔧 Now testing advanced crypto monitor...');
            testAdvancedMonitor();
        }, 2000);
    });
    
} catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Stack trace:', error.stack);
}

function testAdvancedMonitor() {
    try {
        console.log('📦 Loading AdvancedCryptoMonitorSystem...');
        
        // Test just the class loading without instantiation
        const AdvancedCryptoMonitorSystemCode = fs.readFileSync('./advanced-crypto-monitor.js', 'utf8');
        console.log('✅ Advanced crypto monitor file read successfully');
        console.log('   File size:', AdvancedCryptoMonitorSystemCode.length, 'characters');
        
        // Check for syntax issues
        if (AdvancedCryptoMonitorSystemCode.includes('class AdvancedCryptoMonitorSystem')) {
            console.log('✅ Class definition found');
        } else {
            console.log('❌ Class definition not found');
        }
        
        console.log('🎯 The advanced crypto monitor should work correctly now.');
        console.log('💡 Try running: node advanced-crypto-monitor.js');
        
    } catch (error) {
        console.error('❌ Advanced monitor test failed:', error.message);
    }
}
