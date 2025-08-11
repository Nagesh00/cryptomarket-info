// Test individual components
console.log('🔍 Testing individual components...');

try {
    console.log('📦 Testing crypto-project-monitor.js...');
    const monitor = require('./crypto-project-monitor');
    console.log('✅ crypto-project-monitor.js loaded successfully');
} catch (error) {
    console.error('❌ Error loading crypto-project-monitor.js:', error.message);
}

try {
    console.log('📦 Testing express...');
    const express = require('express');
    console.log('✅ Express loaded successfully');
} catch (error) {
    console.error('❌ Error loading express:', error.message);
}

try {
    console.log('📦 Testing ws...');
    const WebSocket = require('ws');
    console.log('✅ WebSocket loaded successfully');
} catch (error) {
    console.error('❌ Error loading ws:', error.message);
}
