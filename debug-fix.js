// Comprehensive debug and fix script
console.log('🔧 Advanced Crypto Monitor - Debug & Fix Script');
console.log('===============================================');

const fs = require('fs');
const path = require('path');

// Step 1: Check environment
console.log('\n📋 Step 1: Environment Check');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());

// Step 2: Check required files
console.log('\n📁 Step 2: File System Check');
const requiredFiles = [
    'advanced-crypto-monitor.js',
    'crypto-project-monitor.js', 
    'crypto_analyzer.py',
    'dark_web_monitor.py',
    'config_manager.py',
    '.env',
    'package.json'
];

requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const stats = exists ? fs.statSync(file) : null;
    console.log(`   ${exists ? '✅' : '❌'} ${file} ${stats ? `(${stats.size} bytes)` : ''}`);
});

// Step 3: Check Node.js modules
console.log('\n📦 Step 3: Node.js Dependencies');
const requiredModules = ['express', 'ws', 'dotenv', 'https', 'crypto'];

for (const module of requiredModules) {
    try {
        require(module);
        console.log(`   ✅ ${module}`);
    } catch (error) {
        console.log(`   ❌ ${module} - ${error.message}`);
    }
}

// Step 4: Load and validate .env
console.log('\n🔑 Step 4: Environment Variables');
try {
    require('dotenv').config();
    const requiredEnvVars = [
        'CMC_API_KEY',
        'GITHUB_TOKEN', 
        'TELEGRAM_BOT_TOKEN',
        'TELEGRAM_CHAT_ID'
    ];
    
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        const hasValue = value && value !== 'your_' + envVar.toLowerCase() + '_here';
        console.log(`   ${hasValue ? '✅' : '⚠️'} ${envVar}: ${hasValue ? 'Set' : 'Not configured'}`);
    }
} catch (error) {
    console.log(`   ❌ Error loading environment: ${error.message}`);
}

// Step 5: Test basic server
console.log('\n🚀 Step 5: Basic Server Test');
try {
    const express = require('express');
    const app = express();
    
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'healthy',
            timestamp: new Date(),
            message: 'Advanced Crypto Monitor is working!'
        });
    });
    
    const server = app.listen(3001, () => {
        console.log('   ✅ Express server started successfully on port 3001');
        
        // Test the server
        const http = require('http');
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/health',
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('   ✅ Server response:', JSON.parse(data).message);
                server.close();
                
                // Step 6: Test advanced crypto monitor
                console.log('\n🔬 Step 6: Advanced Crypto Monitor Test');
                testAdvancedMonitor();
            });
        });
        
        req.on('error', (error) => {
            console.log('   ❌ Server test failed:', error.message);
            server.close();
        });
        
        req.end();
    });
    
    server.on('error', (error) => {
        console.log(`   ❌ Server failed to start: ${error.message}`);
    });
    
} catch (error) {
    console.log(`   ❌ Express test failed: ${error.message}`);
}

function testAdvancedMonitor() {
    try {
        console.log('   📦 Loading CryptoProjectMonitor class...');
        const CryptoProjectMonitor = require('./crypto-project-monitor');
        console.log('   ✅ CryptoProjectMonitor class loaded successfully');
        
        console.log('   🏗️ Creating monitor instance...');
        const monitor = new CryptoProjectMonitor();
        console.log('   ✅ Monitor instance created successfully');
        
        console.log('   🚀 Starting monitor server...');
        monitor.startServer(3002).then(port => {
            console.log(`   ✅ Monitor server started on port ${port}`);
            console.log(`   📊 Dashboard: http://localhost:${port}`);
            console.log(`   🔗 API Status: http://localhost:${port}/api/status`);
            
            // Test the API
            setTimeout(() => {
                const http = require('http');
                const options = {
                    hostname: 'localhost',
                    port: port,
                    path: '/api/status',
                    method: 'GET'
                };
                
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const status = JSON.parse(data);
                            console.log('   ✅ API Status Response:', status.status);
                            console.log('   📈 Projects tracked:', status.seenProjects);
                            console.log('\n🎉 SUCCESS: Advanced Crypto Monitor is working perfectly!');
                            console.log('\n🔗 Access your dashboard at: http://localhost:' + port);
                        } catch (parseError) {
                            console.log('   ⚠️ API response parsing error:', parseError.message);
                        }
                    });
                });
                
                req.on('error', (error) => {
                    console.log('   ❌ API test failed:', error.message);
                });
                
                req.end();
            }, 2000);
            
        }).catch(error => {
            console.log(`   ❌ Monitor server failed: ${error.message}`);
        });
        
    } catch (error) {
        console.log(`   ❌ Advanced monitor test failed: ${error.message}`);
        console.log('   🔧 Error details:', error.stack);
    }
}
