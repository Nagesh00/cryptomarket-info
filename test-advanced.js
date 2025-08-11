// Simple test to debug the advanced crypto monitor
console.log('🔍 Testing Advanced Crypto Monitor...');

try {
    // Test if the main file can be required
    console.log('📦 Loading advanced-crypto-monitor.js...');
    const monitor = require('./advanced-crypto-monitor.js');
    console.log('✅ Successfully loaded advanced-crypto-monitor.js');
} catch (error) {
    console.error('❌ Error loading advanced-crypto-monitor.js:', error.message);
    console.error('Full error:', error);
}
