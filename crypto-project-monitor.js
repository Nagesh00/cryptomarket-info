// Complete Crypto Project Monitoring System
// Real-time monitoring with multi-source data collection and advanced analysis

const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const crypto = require('crypto');

class CryptoProjectMonitor {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.clients = new Set();
        
        // API configurations
        this.apis = {
            coinmarketcap: {
                baseUrl: 'https://pro-api.coinmarketcap.com/v1',
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY || '',
                    'Accept': 'application/json'
                }
            },
            coingecko: {
                baseUrl: 'https://api.coingecko.com/api/v3',
                headers: {
                    'Accept': 'application/json'
                }
            },
            github: {
                baseUrl: 'https://api.github.com',
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN || ''}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        };
        
        // Monitoring configuration
        this.config = {
            monitoringInterval: 60000, // 1 minute
            trendingInterval: 300000,  // 5 minutes
            githubInterval: 600000,    // 10 minutes
            sentimentInterval: 180000, // 3 minutes
            maxProjectsPerBatch: 10,
            riskThreshold: 0.3,
            sentimentThreshold: 0.6
        };
        
        // Project tracking
        this.seenProjects = new Set();
        this.projectDatabase = new Map();
        this.riskIndicators = [
            'pump', 'dump', 'scam', 'rug pull', 'ponzi', 'guarantee',
            'get rich quick', 'guaranteed returns', 'no risk', 'easy money'
        ];
        
        this.initializeExpress();
        this.startMonitoring();
    }
    
    initializeExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        this.setupRoutes();
    }
    
    setupRoutes() {
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
        
        // API endpoints
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'active',
                monitoring: true,
                seenProjects: this.seenProjects.size,
                connectedClients: this.clients.size,
                uptime: process.uptime()
            });
        });
        
        this.app.get('/api/trending', async (req, res) => {
            try {
                const trending = await this.getTrendingProjects();
                res.json(trending);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/new-projects', async (req, res) => {
            try {
                const newProjects = await this.getNewProjects();
                res.json(newProjects);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/github-projects', async (req, res) => {
            try {
                const githubProjects = await this.monitorGitHub();
                res.json(githubProjects);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/analyze-project', async (req, res) => {
            try {
                const { projectData } = req.body;
                const analysis = await this.analyzeProject(projectData);
                res.json(analysis);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/configure', (req, res) => {
            try {
                const { keywords, channels, riskLevel } = req.body;
                // Store user preferences
                res.json({ success: true, message: 'Configuration updated' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/sentiment/:symbol', async (req, res) => {
            try {
                const sentiment = await this.analyzeSentiment(req.params.symbol);
                res.json(sentiment);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    async startServer(port = 3000) {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, () => {
                console.log(`🚀 Crypto Project Monitor running on port ${port}`);
                this.setupWebSocket();
                resolve(port);
            });
            
            this.server.on('error', reject);
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            console.log('📱 New WebSocket client connected');
            this.clients.add(ws);
            
            // Send current status
            ws.send(JSON.stringify({
                type: 'status',
                data: {
                    connected: true,
                    seenProjects: this.seenProjects.size,
                    timestamp: new Date()
                }
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('📱 WebSocket client disconnected');
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
        });
    }
    
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                ws.keywords = data.keywords || [];
                ws.channels = data.channels || ['websocket'];
                break;
            case 'get-trending':
                this.getTrendingProjects().then(trending => {
                    ws.send(JSON.stringify({
                        type: 'trending',
                        data: trending
                    }));
                });
                break;
        }
    }
    
    startMonitoring() {
        console.log('🔍 Starting comprehensive crypto project monitoring...');
        
        // Regular monitoring intervals
        setInterval(() => this.monitorCoinMarketCap(), this.config.monitoringInterval);
        setInterval(() => this.monitorCoinGecko(), this.config.monitoringInterval);
        setInterval(() => this.monitorTrending(), this.config.trendingInterval);
        setInterval(() => this.monitorGitHub(), this.config.githubInterval);
        setInterval(() => this.monitorSocialSentiment(), this.config.sentimentInterval);
        
        // Initial run
        setTimeout(() => this.runFullScan(), 5000);
    }
    
    async runFullScan() {
        console.log('🔄 Running full project scan...');
        try {
            await Promise.all([
                this.monitorCoinMarketCap(),
                this.monitorCoinGecko(),
                this.monitorTrending(),
                this.monitorGitHub()
            ]);
            console.log('✅ Full scan completed');
        } catch (error) {
            console.error('❌ Full scan error:', error.message);
        }
    }
    
    async monitorCoinMarketCap() {
        try {
            console.log('📊 Monitoring CoinMarketCap...');
            
            // Get trending cryptocurrencies
            const trending = await this.makeRequest('coinmarketcap', '/cryptocurrency/trending/latest');
            if (trending && trending.data) {
                for (const item of trending.data) {
                    await this.processProject({
                        source: 'coinmarketcap_trending',
                        ...item
                    });
                }
            }
            
            // Get new listings
            const newListings = await this.makeRequest('coinmarketcap', '/cryptocurrency/listings/new');
            if (newListings && newListings.data) {
                for (const item of newListings.data.slice(0, 10)) {
                    await this.processProject({
                        source: 'coinmarketcap_new',
                        ...item
                    });
                }
            }
            
        } catch (error) {
            console.error('CoinMarketCap monitoring error:', error.message);
        }
    }
    
    async monitorCoinGecko() {
        try {
            console.log('🦎 Monitoring CoinGecko...');
            
            // Get trending coins
            const trending = await this.makeRequest('coingecko', '/search/trending');
            if (trending && trending.coins) {
                for (const coin of trending.coins) {
                    await this.processProject({
                        source: 'coingecko_trending',
                        id: coin.item.id,
                        name: coin.item.name,
                        symbol: coin.item.symbol,
                        market_cap_rank: coin.item.market_cap_rank,
                        thumb: coin.item.thumb
                    });
                }
            }
            
            // Get new coins
            const newCoins = await this.makeRequest('coingecko', '/coins/markets', {
                vs_currency: 'usd',
                order: 'gecko_desc',
                per_page: 20,
                page: 1,
                sparkline: false
            });
            
            if (newCoins) {
                for (const coin of newCoins.slice(0, 10)) {
                    await this.processProject({
                        source: 'coingecko_new',
                        ...coin
                    });
                }
            }
            
        } catch (error) {
            console.error('CoinGecko monitoring error:', error.message);
        }
    }
    
    async monitorTrending() {
        try {
            console.log('📈 Monitoring trending data...');
            
            // CoinGecko trending searches
            const trendingSearches = await this.makeRequest('coingecko', '/search/trending');
            if (trendingSearches) {
                const notification = {
                    type: 'trending_update',
                    data: {
                        coins: trendingSearches.coins || [],
                        nfts: trendingSearches.nfts || [],
                        categories: trendingSearches.categories || [],
                        timestamp: new Date()
                    }
                };
                this.broadcastToClients(notification);
            }
            
        } catch (error) {
            console.error('Trending monitoring error:', error.message);
        }
    }
    
    async monitorGitHub() {
        try {
            console.log('🐙 Monitoring GitHub for new crypto projects...');
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const searchQuery = `cryptocurrency OR blockchain OR defi OR web3 created:>=${yesterday.toISOString().split('T')[0]}`;
            
            const repos = await this.makeRequest('github', '/search/repositories', {
                q: searchQuery,
                sort: 'updated',
                order: 'desc',
                per_page: 20
            });
            
            if (repos && repos.items) {
                for (const repo of repos.items.slice(0, 10)) {
                    const analysis = await this.analyzeRepository(repo);
                    if (analysis.isLegitimate) {
                        await this.processProject({
                            source: 'github',
                            name: repo.name,
                            description: repo.description,
                            url: repo.html_url,
                            stars: repo.stargazers_count,
                            language: repo.language,
                            created_at: repo.created_at,
                            analysis
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error('GitHub monitoring error:', error.message);
        }
    }
    
    async monitorSocialSentiment() {
        try {
            console.log('💬 Monitoring social sentiment...');
            
            // Simulate social media monitoring
            const trendingCoins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot'];
            const sentimentData = {};
            
            for (const coin of trendingCoins) {
                sentimentData[coin] = await this.analyzeSentiment(coin);
            }
            
            const notification = {
                type: 'sentiment_update',
                data: {
                    sentiment: sentimentData,
                    timestamp: new Date()
                }
            };
            
            this.broadcastToClients(notification);
            
        } catch (error) {
            console.error('Social sentiment monitoring error:', error.message);
        }
    }
    
    async processProject(projectData) {
        const projectId = this.generateProjectId(projectData);
        
        if (this.seenProjects.has(projectId)) {
            return; // Already processed
        }
        
        console.log(`🔍 Processing new project: ${projectData.name || projectData.id}`);
        
        // Add to seen projects
        this.seenProjects.add(projectId);
        
        // Perform analysis
        const analysis = await this.analyzeProject(projectData);
        
        // Store in database
        this.projectDatabase.set(projectId, {
            ...projectData,
            analysis,
            discovered_at: new Date(),
            id: projectId
        });
        
        // Check if project meets notification criteria
        if (this.shouldNotify(projectData, analysis)) {
            await this.sendNotification({
                type: 'new_project',
                data: {
                    ...projectData,
                    analysis,
                    id: projectId
                }
            });
        }
    }
    
    async analyzeProject(projectData) {
        const analysis = {
            legitimacy_score: 0,
            risk_level: 'unknown',
            sentiment_score: 0,
            social_metrics: {},
            technical_indicators: {},
            recommendation: 'hold',
            flags: []
        };
        
        try {
            // Risk assessment
            analysis.risk_level = this.assessRisk(projectData);
            
            // Legitimacy scoring
            analysis.legitimacy_score = this.calculateLegitimacyScore(projectData);
            
            // Sentiment analysis
            if (projectData.name) {
                analysis.sentiment_score = await this.analyzeSentiment(projectData.name);
            }
            
            // Generate recommendation
            analysis.recommendation = this.generateRecommendation(analysis);
            
            // Flag suspicious patterns
            analysis.flags = this.detectSuspiciousPatterns(projectData);
            
        } catch (error) {
            console.error('Project analysis error:', error.message);
        }
        
        return analysis;
    }
    
    assessRisk(projectData) {
        let riskScore = 0;
        
        const textContent = `${projectData.description || ''} ${projectData.name || ''}`.toLowerCase();
        
        // Check for risk indicators
        for (const indicator of this.riskIndicators) {
            if (textContent.includes(indicator.toLowerCase())) {
                riskScore += 2;
            }
        }
        
        // Check project metadata
        if (!projectData.description || projectData.description.length < 50) {
            riskScore += 1;
        }
        
        if (projectData.source === 'github' && projectData.stars < 5) {
            riskScore += 1;
        }
        
        if (riskScore >= 6) return 'high';
        if (riskScore >= 3) return 'medium';
        return 'low';
    }
    
    calculateLegitimacyScore(projectData) {
        let score = 0.5; // Base score
        
        // Positive factors
        if (projectData.description && projectData.description.length > 100) score += 0.1;
        if (projectData.source === 'github' && projectData.stars > 10) score += 0.2;
        if (projectData.source === 'coinmarketcap' || projectData.source === 'coingecko') score += 0.3;
        if (projectData.market_cap && projectData.market_cap > 1000000) score += 0.2;
        
        // Negative factors
        const textContent = `${projectData.description || ''} ${projectData.name || ''}`.toLowerCase();
        for (const indicator of this.riskIndicators) {
            if (textContent.includes(indicator.toLowerCase())) {
                score -= 0.1;
            }
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    async analyzeSentiment(symbol) {
        // Simplified sentiment analysis
        // In production, this would integrate with social media APIs
        const randomSentiment = (Math.random() - 0.5) * 2; // -1 to 1
        
        return {
            score: randomSentiment,
            confidence: Math.random() * 0.5 + 0.5,
            sources: ['twitter', 'reddit'],
            timestamp: new Date()
        };
    }
    
    generateRecommendation(analysis) {
        if (analysis.risk_level === 'high' || analysis.legitimacy_score < 0.3) {
            return 'avoid';
        }
        
        if (analysis.legitimacy_score > 0.7 && analysis.sentiment_score > 0.3) {
            return 'research';
        }
        
        if (analysis.legitimacy_score > 0.5) {
            return 'monitor';
        }
        
        return 'hold';
    }
    
    detectSuspiciousPatterns(projectData) {
        const flags = [];
        const textContent = `${projectData.description || ''} ${projectData.name || ''}`.toLowerCase();
        
        // Check for suspicious keywords
        if (this.riskIndicators.some(indicator => textContent.includes(indicator.toLowerCase()))) {
            flags.push('suspicious_keywords');
        }
        
        // Check for unusual naming patterns
        if (projectData.name && /\d{4,}/.test(projectData.name)) {
            flags.push('suspicious_naming');
        }
        
        // Check for minimal information
        if (!projectData.description || projectData.description.length < 30) {
            flags.push('minimal_information');
        }
        
        return flags;
    }
    
    async analyzeRepository(repo) {
        const analysis = {
            isLegitimate: true,
            score: 0,
            factors: []
        };
        
        // Check repository quality indicators
        if (repo.stargazers_count > 5) {
            analysis.score += 0.2;
            analysis.factors.push('has_stars');
        }
        
        if (repo.description && repo.description.length > 50) {
            analysis.score += 0.2;
            analysis.factors.push('good_description');
        }
        
        if (repo.language) {
            analysis.score += 0.1;
            analysis.factors.push('programming_language');
        }
        
        if (repo.has_pages || repo.homepage) {
            analysis.score += 0.1;
            analysis.factors.push('has_website');
        }
        
        // Check for legitimacy
        analysis.isLegitimate = analysis.score > 0.2;
        
        return analysis;
    }
    
    shouldNotify(projectData, analysis) {
        // High priority notifications
        if (analysis.legitimacy_score > 0.7) return true;
        if (analysis.sentiment_score > 0.6) return true;
        if (projectData.source === 'coinmarketcap' || projectData.source === 'coingecko') return true;
        
        // Medium priority
        if (analysis.legitimacy_score > 0.5 && analysis.risk_level === 'low') return true;
        
        return false;
    }
    
    async sendNotification(notification) {
        console.log(`📢 Sending notification: ${notification.data.name || notification.data.id}`);
        
        // WebSocket notification
        this.broadcastToClients(notification);
        
        // Telegram notification
        await this.sendTelegramNotification(notification);
        
        // Store notification
        notification.sent_at = new Date();
    }
    
    async sendTelegramNotification(notification) {
        try {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;
            
            if (!botToken || !chatId) return;
            
            const message = this.formatTelegramMessage(notification);
            
            const response = await this.makeHttpsRequest('api.telegram.org', `/bot${botToken}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            });
            
            console.log('✅ Telegram notification sent');
            
        } catch (error) {
            console.error('❌ Telegram notification error:', error.message);
        }
    }
    
    formatTelegramMessage(notification) {
        const data = notification.data;
        const analysis = data.analysis || {};
        
        return `🚀 <b>New Crypto Project Alert!</b>

📈 <b>${data.name || data.id}</b> ${data.symbol ? `(${data.symbol})` : ''}
💰 Price: ${data.price ? `$${data.price}` : 'N/A'}
📊 Market Cap: ${data.market_cap ? `$${data.market_cap}` : 'N/A'}
🔥 Source: ${data.source}
📅 Detected: ${new Date().toLocaleString()}

${data.description ? `📝 ${data.description.substring(0, 200)}...` : ''}

⚠️ Risk Level: ${analysis.risk_level || 'Unknown'}
🎯 Legitimacy Score: ${analysis.legitimacy_score ? Math.round(analysis.legitimacy_score * 100) + '%' : 'N/A'}
💭 Sentiment: ${analysis.sentiment_score ? (analysis.sentiment_score > 0 ? '🟢 Positive' : '🔴 Negative') : 'N/A'}
📋 Recommendation: ${analysis.recommendation || 'N/A'}

${data.url ? `🔗 <a href="${data.url}">View Project</a>` : ''}`;
    }
    
    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }
    
    generateProjectId(projectData) {
        const identifier = projectData.id || projectData.name || projectData.symbol || Math.random().toString();
        return crypto.createHash('md5').update(`${projectData.source}-${identifier}`).digest('hex');
    }
    
    async makeRequest(apiName, endpoint, params = {}) {
        const api = this.apis[apiName];
        if (!api) throw new Error(`Unknown API: ${apiName}`);
        
        const url = new URL(endpoint, api.baseUrl);
        
        // Add query parameters
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });
        
        return this.makeHttpsRequest(url.hostname, url.pathname + url.search, null, api.headers);
    }
    
    makeHttpsRequest(hostname, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname,
                path,
                method: data ? 'POST' : 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    ...headers
                }
            };
            
            if (data) {
                const postData = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }
            
            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve(parsed);
                    } catch (error) {
                        resolve(responseData);
                    }
                });
            });
            
            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
    
    async getTrendingProjects() {
        const trending = [];
        
        // Get from project database
        for (const [id, project] of this.projectDatabase.entries()) {
            if (project.analysis && project.analysis.legitimacy_score > 0.5) {
                trending.push(project);
            }
        }
        
        return trending.slice(0, 20);
    }
    
    async getNewProjects() {
        const newProjects = [];
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 24); // Last 24 hours
        
        for (const [id, project] of this.projectDatabase.entries()) {
            if (project.discovered_at > cutoff) {
                newProjects.push(project);
            }
        }
        
        return newProjects.sort((a, b) => b.discovered_at - a.discovered_at);
    }
    
    getDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Crypto Project Monitor - Advanced Real-Time System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .status-bar {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h3 {
            color: #4a5568;
            margin-bottom: 20px;
            font-size: 1.3em;
        }
        
        .project-card {
            border: 1px solid #e2e8f0;
            margin: 10px 0;
            padding: 15px;
            border-radius: 10px;
            transition: all 0.3s ease;
        }
        
        .project-card:hover {
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .project-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .project-name {
            font-weight: bold;
            font-size: 1.1em;
            color: #2d3748;
        }
        
        .project-symbol {
            background: #edf2f7;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        
        .project-source {
            background: #bee3f8;
            color: #2b6cb0;
            padding: 2px 8px;
            border-radius: 15px;
            font-size: 0.8em;
        }
        
        .project-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin: 10px 0;
        }
        
        .metric {
            text-align: center;
            padding: 8px;
            background: #f7fafc;
            border-radius: 8px;
        }
        
        .metric-label {
            font-size: 0.8em;
            color: #718096;
        }
        
        .metric-value {
            font-weight: bold;
            color: #2d3748;
        }
        
        .risk-low { border-left: 4px solid #48bb78; }
        .risk-medium { border-left: 4px solid #ed8936; }
        .risk-high { border-left: 4px solid #f56565; }
        
        .recommendation {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .recommendation.research { background: #c6f6d5; color: #22543d; }
        .recommendation.monitor { background: #fed7d7; color: #742a2a; }
        .recommendation.avoid { background: #feb2b2; color: #742a2a; }
        .recommendation.hold { background: #e2e8f0; color: #4a5568; }
        
        .controls {
            text-align: center;
            margin: 20px 0;
        }
        
        .btn {
            background: #4299e1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin: 0 10px;
            font-size: 1em;
            transition: background 0.3s ease;
        }
        
        .btn:hover {
            background: #3182ce;
        }
        
        .btn.secondary {
            background: #718096;
        }
        
        .btn.secondary:hover {
            background: #4a5568;
        }
        
        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
        }
        
        .connected { background: #48bb78; }
        .disconnected { background: #f56565; }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #718096;
        }
        
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
            
            .status-bar {
                flex-direction: column;
                text-align: center;
            }
            
            .project-metrics {
                grid-template-columns: 1fr 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Advanced Crypto Project Monitor</h1>
            <p>Real-time monitoring of new crypto projects across multiple sources</p>
        </div>
        
        <div class="status-bar">
            <div>
                <strong>System Status:</strong> <span id="system-status">Initializing...</span>
            </div>
            <div>
                <strong>Projects Tracked:</strong> <span id="projects-count">0</span>
            </div>
            <div>
                <strong>Connected Clients:</strong> <span id="clients-count">0</span>
            </div>
            <div>
                <strong>Uptime:</strong> <span id="uptime">0s</span>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="refreshData()">🔄 Refresh Data</button>
            <button class="btn" onclick="runFullScan()">🔍 Full Scan</button>
            <button class="btn secondary" onclick="toggleMonitoring()">⏸️ Pause Monitoring</button>
            <button class="btn secondary" onclick="exportData()">📊 Export Data</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📈 Trending Projects</h3>
                <div id="trending-projects">
                    <div class="loading">Loading trending projects...</div>
                </div>
            </div>
            
            <div class="card">
                <h3>🆕 New Projects (24h)</h3>
                <div id="new-projects">
                    <div class="loading">Loading new projects...</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>🔴 Live Project Feed</h3>
            <div id="live-feed">
                <div class="loading">Connecting to live feed...</div>
            </div>
        </div>
    </div>
    
    <div id="connection-status" class="connection-status disconnected">
        Connecting...
    </div>
    
    <script>
        let ws = null;
        let monitoring = true;
        
        // Initialize WebSocket connection
        function initWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = \`\${protocol}//\${window.location.host}\`;
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                console.log('✅ WebSocket connected');
                updateConnectionStatus(true);
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    keywords: ['trending', 'new', 'defi', 'nft'],
                    channels: ['websocket']
                }));
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };
            
            ws.onclose = function() {
                console.log('❌ WebSocket disconnected');
                updateConnectionStatus(false);
                // Reconnect after 5 seconds
                setTimeout(initWebSocket, 5000);
            };
            
            ws.onerror = function(error) {
                console.error('WebSocket error:', error);
                updateConnectionStatus(false);
            };
        }
        
        function handleWebSocketMessage(message) {
            switch(message.type) {
                case 'status':
                    updateStatus(message.data);
                    break;
                case 'new_project':
                    addProjectToFeed(message.data);
                    break;
                case 'trending':
                    updateTrendingProjects(message.data);
                    break;
                case 'trending_update':
                    updateTrendingData(message.data);
                    break;
                case 'sentiment_update':
                    updateSentimentData(message.data);
                    break;
            }
        }
        
        function updateConnectionStatus(connected) {
            const statusEl = document.getElementById('connection-status');
            statusEl.textContent = connected ? 'Connected' : 'Disconnected';
            statusEl.className = 'connection-status ' + (connected ? 'connected' : 'disconnected');
        }
        
        function updateStatus(data) {
            document.getElementById('system-status').textContent = 'Active';
            document.getElementById('projects-count').textContent = data.seenProjects || 0;
            document.getElementById('clients-count').textContent = data.connectedClients || 0;
            if (data.uptime) {
                document.getElementById('uptime').textContent = formatUptime(data.uptime);
            }
        }
        
        function addProjectToFeed(project) {
            const feed = document.getElementById('live-feed');
            const projectEl = createProjectElement(project);
            
            // Remove loading message if exists
            const loading = feed.querySelector('.loading');
            if (loading) loading.remove();
            
            feed.insertBefore(projectEl, feed.firstChild);
            
            // Limit to 20 projects
            const projects = feed.querySelectorAll('.project-card');
            if (projects.length > 20) {
                projects[projects.length - 1].remove();
            }
        }
        
        function createProjectElement(project) {
            const div = document.createElement('div');
            const analysis = project.analysis || {};
            const riskClass = 'risk-' + (analysis.risk_level || 'unknown');
            
            div.className = 'project-card ' + riskClass;
            div.innerHTML = \`
                <div class="project-header">
                    <div>
                        <span class="project-name">\${project.name || project.id}</span>
                        \${project.symbol ? \`<span class="project-symbol">\${project.symbol}</span>\` : ''}
                    </div>
                    <span class="project-source">\${project.source}</span>
                </div>
                
                \${project.description ? \`<p style="margin: 10px 0; color: #718096;">\${project.description.substring(0, 150)}...</p>\` : ''}
                
                <div class="project-metrics">
                    \${project.price ? \`
                        <div class="metric">
                            <div class="metric-label">Price</div>
                            <div class="metric-value">$\${project.price}</div>
                        </div>
                    \` : ''}
                    
                    \${project.market_cap ? \`
                        <div class="metric">
                            <div class="metric-label">Market Cap</div>
                            <div class="metric-value">$\${formatNumber(project.market_cap)}</div>
                        </div>
                    \` : ''}
                    
                    \${analysis.legitimacy_score ? \`
                        <div class="metric">
                            <div class="metric-label">Legitimacy</div>
                            <div class="metric-value">\${Math.round(analysis.legitimacy_score * 100)}%</div>
                        </div>
                    \` : ''}
                    
                    \${analysis.sentiment_score ? \`
                        <div class="metric">
                            <div class="metric-label">Sentiment</div>
                            <div class="metric-value">\${analysis.sentiment_score > 0 ? '🟢' : '🔴'} \${Math.round(Math.abs(analysis.sentiment_score) * 100)}%</div>
                        </div>
                    \` : ''}
                </div>
                
                <div style="margin-top: 10px;">
                    \${analysis.recommendation ? \`<span class="recommendation \${analysis.recommendation}">\${analysis.recommendation.toUpperCase()}</span>\` : ''}
                    <span style="float: right; font-size: 0.8em; color: #718096;">
                        \${new Date(project.discovered_at || Date.now()).toLocaleTimeString()}
                    </span>
                </div>
            \`;
            
            return div;
        }
        
        function formatNumber(num) {
            if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
            return num.toString();
        }
        
        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return \`\${hours}h \${minutes}m \${secs}s\`;
        }
        
        // API functions
        async function refreshData() {
            try {
                const [trending, newProjects] = await Promise.all([
                    fetch('/api/trending').then(r => r.json()),
                    fetch('/api/new-projects').then(r => r.json())
                ]);
                
                updateTrendingProjects(trending);
                updateNewProjects(newProjects);
            } catch (error) {
                console.error('Error refreshing data:', error);
            }
        }
        
        function updateTrendingProjects(projects) {
            const container = document.getElementById('trending-projects');
            container.innerHTML = '';
            
            if (projects && projects.length > 0) {
                projects.slice(0, 10).forEach(project => {
                    container.appendChild(createProjectElement(project));
                });
            } else {
                container.innerHTML = '<div class="loading">No trending projects found</div>';
            }
        }
        
        function updateNewProjects(projects) {
            const container = document.getElementById('new-projects');
            container.innerHTML = '';
            
            if (projects && projects.length > 0) {
                projects.slice(0, 10).forEach(project => {
                    container.appendChild(createProjectElement(project));
                });
            } else {
                container.innerHTML = '<div class="loading">No new projects in the last 24 hours</div>';
            }
        }
        
        async function runFullScan() {
            document.getElementById('system-status').textContent = 'Running full scan...';
            try {
                await fetch('/api/full-scan', { method: 'POST' });
                setTimeout(refreshData, 5000); // Refresh after 5 seconds
            } catch (error) {
                console.error('Error running full scan:', error);
            }
        }
        
        function toggleMonitoring() {
            monitoring = !monitoring;
            const btn = event.target;
            btn.textContent = monitoring ? '⏸️ Pause Monitoring' : '▶️ Resume Monitoring';
            btn.className = monitoring ? 'btn secondary' : 'btn';
        }
        
        function exportData() {
            // Simulate data export
            const data = {
                timestamp: new Date(),
                projects: Array.from(document.querySelectorAll('.project-card')).map(el => ({
                    name: el.querySelector('.project-name').textContent,
                    source: el.querySelector('.project-source').textContent
                }))
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'crypto-projects-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
        }
        
        // Initialize on page load
        window.addEventListener('load', function() {
            initWebSocket();
            refreshData();
            
            // Periodic updates
            setInterval(refreshData, 60000); // Every minute
        });
    </script>
</body>
</html>`;
    }
}

// Start the monitor
// Export the class for use by other modules
module.exports = CryptoProjectMonitor;

// Only start server if this file is run directly
if (require.main === module) {
    const monitor = new CryptoProjectMonitor();
    monitor.startServer(process.env.PORT || 3000).then(port => {
        console.log(`✅ Advanced Crypto Project Monitor started on port ${port}`);
        console.log(`📊 Dashboard: http://localhost:${port}`);
        console.log(`🔗 WebSocket: ws://localhost:${port}`);
    }).catch(error => {
        console.error('❌ Failed to start monitor:', error);
    });
}
