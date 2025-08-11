// GitHub Update and System Status Check
console.log('🔍 GitHub Update & System Status Check');
console.log('=====================================');

const fs = require('fs');
const { execSync } = require('child_process');

try {
    // Check if we're in a Git repository
    console.log('\n📂 Git Repository Check:');
    
    if (fs.existsSync('.git')) {
        console.log('✅ Git repository detected');
        
        try {
            // Check Git status
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            if (gitStatus.trim()) {
                console.log('📝 Uncommitted changes found:');
                console.log(gitStatus);
                
                // Show what files have changed
                const changedFiles = gitStatus.split('\n').filter(line => line.trim());
                changedFiles.forEach(file => {
                    console.log(`   📄 ${file}`);
                });
            } else {
                console.log('✅ No uncommitted changes');
            }
            
            // Check remote status
            try {
                const remoteInfo = execSync('git remote -v', { encoding: 'utf8' });
                console.log('\n🌐 Remote repositories:');
                console.log(remoteInfo);
            } catch (error) {
                console.log('❌ No remote repositories configured');
            }
            
            // Check current branch
            try {
                const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
                console.log(`\n🌿 Current branch: ${branch}`);
            } catch (error) {
                console.log('❌ Could not determine current branch');
            }
            
            // Check recent commits
            try {
                const commits = execSync('git log --oneline -5', { encoding: 'utf8' });
                console.log('\n📋 Recent commits:');
                console.log(commits);
            } catch (error) {
                console.log('❌ No commits found');
            }
            
        } catch (error) {
            console.log('❌ Git command error:', error.message);
        }
        
    } else {
        console.log('❌ Not a Git repository');
        console.log('\n🔧 To initialize Git repository:');
        console.log('   git init');
        console.log('   git remote add origin https://github.com/Nagesh00/cryptomarket-info.git');
        console.log('   git add .');
        console.log('   git commit -m "Initial commit with Advanced Crypto Monitor"');
        console.log('   git push -u origin main');
    }
    
} catch (error) {
    console.log('❌ Error checking Git status:', error.message);
}

// Check system status
console.log('\n🚀 System Status Check:');

// Check if crypto monitor is running
try {
    const http = require('http');
    
    const checkServer = (port, name) => {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: port,
                path: '/api/status',
                method: 'GET',
                timeout: 2000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const status = JSON.parse(data);
                        console.log(`✅ ${name} running on port ${port}`);
                        console.log(`   Status: ${status.status}`);
                        if (status.seenProjects) console.log(`   Projects tracked: ${status.seenProjects}`);
                        if (status.uptime) console.log(`   Uptime: ${Math.round(status.uptime)}s`);
                        resolve(true);
                    } catch (e) {
                        console.log(`⚠️ ${name} responding but invalid JSON on port ${port}`);
                        resolve(true);
                    }
                });
            });
            
            req.on('error', () => {
                console.log(`❌ ${name} not running on port ${port}`);
                resolve(false);
            });
            
            req.on('timeout', () => {
                console.log(`⏰ ${name} timeout on port ${port}`);
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    };
    
    // Check common ports
    checkServer(3000, 'Main Crypto Monitor').then(() => {
        checkServer(3001, 'Test Server').then(() => {
            checkServer(3002, 'Advanced Monitor');
        });
    });
    
} catch (error) {
    console.log('❌ Error checking server status:', error.message);
}

// Check files that should be committed
console.log('\n📁 Important Files Check:');
const importantFiles = [
    'advanced-crypto-monitor.js',
    'crypto-project-monitor.js',
    'crypto_analyzer.py',
    'dark_web_monitor.py',
    'config_manager.py',
    'setup.py',
    'package.json',
    '.env',
    'README_ADVANCED.md',
    'QUICKSTART_GUIDE.md'
];

importantFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const stats = exists ? fs.statSync(file) : null;
    console.log(`   ${exists ? '✅' : '❌'} ${file} ${stats ? `(${Math.round(stats.size/1024)}KB)` : ''}`);
});

console.log('\n🔧 GitHub Update Commands:');
console.log('If you need to update GitHub, run these commands:');
console.log('');
console.log('1. Add all files:');
console.log('   git add .');
console.log('');
console.log('2. Commit changes:');
console.log('   git commit -m "Update Advanced Crypto Monitor System"');
console.log('');
console.log('3. Push to GitHub:');
console.log('   git push origin main');
console.log('');
console.log('If you get permission errors, check your GitHub token or SSH keys.');
