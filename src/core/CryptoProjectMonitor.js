const EventEmitter = require('events');
const cron = require('node-cron');

const CoinMarketCapAPI = require('../api/CoinMarketCapAPI');
const CoinGeckoAPI = require('../api/CoinGeckoAPI');
const TwitterAPI = require('../api/TwitterAPI');
const RedditAPI = require('../api/RedditAPI');
const GitHubAPI = require('../api/GitHubAPI');
const DarkWebMonitor = require('../api/DarkWebMonitor');

const ProjectAnalyzer = require('../analysis/ProjectAnalyzer');
const SentimentAnalyzer = require('../analysis/SentimentAnalyzer');
const RiskAssessment = require('../analysis/RiskAssessment');

class CryptoProjectMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.wsManager = options.wsManager;
        this.notificationDelivery = options.notificationDelivery;
        this.db = options.db;
        
        this.isMonitoring = false;
        this.scanInterval = process.env.SCAN_INTERVAL_SECONDS || 30;
        this.maxConcurrentRequests = process.env.MAX_CONCURRENT_REQUESTS || 10;
        
        this.initializeAPIs();
        this.initializeAnalyzers();
        this.initializeDataStructures();
    }

    initializeAPIs() {
        this.apis = {
            coinmarketcap: new CoinMarketCapAPI(process.env.COINMARKETCAP_API_KEY),
            coingecko: new CoinGeckoAPI(process.env.COINGECKO_API_KEY),
            twitter: new TwitterAPI({
                apiKey: process.env.TWITTER_API_KEY,
                apiSecret: process.env.TWITTER_API_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
            }),
            reddit: new RedditAPI({
                clientId: process.env.REDDIT_CLIENT_ID,
                clientSecret: process.env.REDDIT_CLIENT_SECRET
            }),
            github: new GitHubAPI(process.env.GITHUB_TOKEN),
            darkweb: new DarkWebMonitor(process.env.DARKWEB_API_KEY)
        };
    }

    initializeAnalyzers() {
        this.analyzers = {
            project: new ProjectAnalyzer(),
            sentiment: new SentimentAnalyzer(),
            risk: new RiskAssessment()
        };
    }

    initializeDataStructures() {
        this.seenProjects = new Set();
        this.projectCache = new Map();
        this.lastScanTimes = new Map();
        this.activeScans = new Set();
    }

    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Monitoring is already active');
            return;
        }

        console.log('🚀 Starting crypto project monitoring...');
        this.isMonitoring = true;

        // Schedule periodic scans
        this.scheduleTasks();
        
        // Start immediate scan
        await this.performFullScan();
        
        console.log('✅ Crypto project monitoring started successfully');
    }

    async stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        console.log('🛑 Stopping crypto project monitoring...');
        this.isMonitoring = false;

        // Stop all scheduled tasks
        if (this.scheduledTasks) {
            this.scheduledTasks.forEach(task => task.stop());
        }

        // Wait for active scans to complete
        while (this.activeScans.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('✅ Crypto project monitoring stopped');
    }

    scheduleTasks() {
        this.scheduledTasks = [
            // Main scanning - every 30 seconds
            cron.schedule(`*/${this.scanInterval} * * * * *`, () => {
                if (this.isMonitoring && this.activeScans.size < this.maxConcurrentRequests) {
                    this.performFullScan().catch(console.error);
                }
            }),

            // Social media monitoring - every 10 seconds
            cron.schedule('*/10 * * * * *', () => {
                if (this.isMonitoring) {
                    this.monitorSocialMedia().catch(console.error);
                }
            }),

            // GitHub monitoring - every 2 minutes
            cron.schedule('*/2 * * * *', () => {
                if (this.isMonitoring) {
                    this.monitorGitHub().catch(console.error);
                }
            }),

            // Dark web monitoring - every 5 minutes
            cron.schedule('*/5 * * * *', () => {
                if (this.isMonitoring) {
                    this.monitorDarkWeb().catch(console.error);
                }
            }),

            // Clean up old data - every hour
            cron.schedule('0 * * * *', () => {
                this.cleanupOldData().catch(console.error);
            })
        ];
    }

    async performFullScan() {
        const scanId = `scan_${Date.now()}`;
        this.activeScans.add(scanId);

        try {
            console.log(`🔍 Starting full scan: ${scanId}`);

            const scanPromises = [
                this.monitorCoinMarketCap(),
                this.monitorCoinGecko(),
                this.monitorSocialMediaTrends(),
                this.monitorTrendingSearches()
            ];

            await Promise.allSettled(scanPromises);
            
            console.log(`✅ Completed full scan: ${scanId}`);

        } catch (error) {
            console.error(`❌ Error in full scan ${scanId}:`, error);
        } finally {
            this.activeScans.delete(scanId);
        }
    }

    async monitorCoinMarketCap() {
        try {
            const [trending, newListings] = await Promise.all([
                this.apis.coinmarketcap.getTrending(),
                this.apis.coinmarketcap.getNewListings()
            ]);

            const projects = [...trending, ...newListings];
            
            for (const project of projects) {
                await this.processProject(project, 'coinmarketcap');
            }

        } catch (error) {
            console.error('❌ CoinMarketCap monitoring error:', error);
        }
    }

    async monitorCoinGecko() {
        try {
            const [trendingCoins, trendingNFTs, trendingSearches] = await Promise.all([
                this.apis.coingecko.getTrending(),
                this.apis.coingecko.getTrendingNFTs(),
                this.apis.coingecko.getTrendingSearches()
            ]);

            const allProjects = [...trendingCoins, ...trendingNFTs, ...trendingSearches];
            
            for (const project of allProjects) {
                await this.processProject(project, 'coingecko');
            }

        } catch (error) {
            console.error('❌ CoinGecko monitoring error:', error);
        }
    }

    async monitorSocialMedia() {
        try {
            // Monitor Twitter for crypto keywords
            const twitterKeywords = [
                'new crypto', 'new token', 'new coin', 'presale', 'ICO', 'IDO',
                'airdrop', 'launch', 'listing', 'gem', 'moonshot', 'defi'
            ];

            const twitterResults = await this.apis.twitter.searchTweets(twitterKeywords);
            
            for (const tweet of twitterResults) {
                await this.processSocialMediaMention(tweet, 'twitter');
            }

            // Monitor Reddit for new project discussions
            const subreddits = [
                'CryptoMoonShots', 'CryptoCurrency', 'altcoin', 'defi',
                'ethtrader', 'SatoshiStreetBets', 'CryptoMarkets'
            ];

            for (const subreddit of subreddits) {
                const posts = await this.apis.reddit.getNewPosts(subreddit);
                for (const post of posts) {
                    await this.processSocialMediaMention(post, 'reddit');
                }
            }

        } catch (error) {
            console.error('❌ Social media monitoring error:', error);
        }
    }

    async monitorGitHub() {
        try {
            const searchQueries = [
                'cryptocurrency created:>=2025-01-01',
                'blockchain created:>=2025-01-01',
                'defi created:>=2025-01-01',
                'token created:>=2025-01-01',
                'smart-contract created:>=2025-01-01'
            ];

            for (const query of searchQueries) {
                const repos = await this.apis.github.searchRepositories(query);
                
                for (const repo of repos) {
                    await this.processGitHubRepository(repo);
                }
            }

        } catch (error) {
            console.error('❌ GitHub monitoring error:', error);
        }
    }

    async monitorDarkWeb() {
        try {
            if (!this.apis.darkweb.isConfigured()) {
                return; // Skip if dark web monitoring is not configured
            }

            const darkWebMentions = await this.apis.darkweb.scanForCryptoMentions();
            
            for (const mention of darkWebMentions) {
                await this.processDarkWebMention(mention);
            }

        } catch (error) {
            console.error('❌ Dark web monitoring error:', error);
        }
    }

    async processProject(project, source) {
        try {
            const projectId = this.generateProjectId(project, source);
            
            // Skip if we've already processed this project recently
            if (this.seenProjects.has(projectId)) {
                return;
            }

            // Add to seen projects
            this.seenProjects.add(projectId);

            // Perform comprehensive analysis
            const analysis = await this.performProjectAnalysis(project, source);
            
            // Create notification data
            const notification = {
                id: this.generateNotificationId(),
                timestamp: new Date(),
                source,
                type: 'new_project',
                data: {
                    ...project,
                    analysis,
                    projectId
                },
                priority: this.calculatePriority(project, analysis),
                channels: ['websocket', 'email', 'telegram', 'discord']
            };

            // Store in database
            await this.storeProject(notification);

            // Send notification
            await this.sendNotification(notification);

            console.log(`✅ Processed new project: ${project.name} from ${source}`);

        } catch (error) {
            console.error(`❌ Error processing project ${project.name}:`, error);
        }
    }

    async performProjectAnalysis(project, source) {
        try {
            const [sentimentScore, riskLevel, technicalAnalysis] = await Promise.all([
                this.analyzers.sentiment.analyze(project),
                this.analyzers.risk.assess(project),
                this.analyzers.project.analyze(project)
            ]);

            return {
                sentiment_score: sentimentScore,
                risk_level: riskLevel,
                technical_analysis: technicalAnalysis,
                legitimacy_score: this.calculateLegitimacyScore(project, sentimentScore, riskLevel),
                recommendation: this.generateRecommendation(sentimentScore, riskLevel, technicalAnalysis),
                analysis_timestamp: new Date()
            };

        } catch (error) {
            console.error('❌ Error in project analysis:', error);
            return {
                sentiment_score: 0,
                risk_level: 'unknown',
                technical_analysis: {},
                legitimacy_score: 0.5,
                recommendation: 'research_required',
                analysis_timestamp: new Date(),
                error: error.message
            };
        }
    }

    calculateLegitimacyScore(project, sentimentScore, riskLevel) {
        let score = 0.5; // Base score

        // Adjust based on sentiment
        score += sentimentScore * 0.2;

        // Adjust based on risk level
        switch (riskLevel) {
            case 'low': score += 0.3; break;
            case 'medium': score += 0.1; break;
            case 'high': score -= 0.2; break;
        }

        // Adjust based on project attributes
        if (project.market_cap && project.market_cap > 1000000) score += 0.1;
        if (project.volume_24h && project.volume_24h > 100000) score += 0.1;
        if (project.website) score += 0.05;
        if (project.whitepaper) score += 0.1;

        return Math.max(0, Math.min(1, score));
    }

    generateRecommendation(sentimentScore, riskLevel, technicalAnalysis) {
        if (riskLevel === 'high') return 'avoid';
        if (sentimentScore > 0.7 && riskLevel === 'low') return 'strong_buy';
        if (sentimentScore > 0.4 && riskLevel === 'low') return 'buy';
        if (sentimentScore > 0.2) return 'research';
        return 'hold';
    }

    calculatePriority(project, analysis) {
        if (analysis.risk_level === 'high') return 'high';
        if (analysis.sentiment_score > 0.8) return 'high';
        if (analysis.legitimacy_score > 0.8) return 'high';
        if (analysis.sentiment_score > 0.6) return 'medium';
        return 'low';
    }

    async sendNotification(notification) {
        try {
            // Send via WebSocket for real-time updates
            if (this.wsManager) {
                this.wsManager.broadcast('new_project', notification);
            }

            // Send via notification delivery system
            if (this.notificationDelivery) {
                await this.notificationDelivery.deliver(notification);
            }

            // Emit event for other components
            this.emit('new_project', notification);

        } catch (error) {
            console.error('❌ Error sending notification:', error);
        }
    }

    async storeProject(notification) {
        try {
            if (this.db) {
                await this.db.projects.create(notification);
            }
        } catch (error) {
            console.error('❌ Error storing project:', error);
        }
    }

    generateProjectId(project, source) {
        const identifier = project.id || project.name || project.symbol || '';
        return `${source}_${identifier}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    }

    generateNotificationId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async cleanupOldData() {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            // Clear old seen projects
            this.seenProjects.clear();
            
            // Clear old cache entries
            for (const [key, entry] of this.projectCache) {
                if (entry.timestamp < oneDayAgo) {
                    this.projectCache.delete(key);
                }
            }

            console.log('🧹 Cleaned up old data');

        } catch (error) {
            console.error('❌ Error cleaning up old data:', error);
        }
    }

    // Additional methods for processing social media mentions, GitHub repos, etc.
    async processSocialMediaMention(mention, platform) {
        // Implementation for processing social media mentions
        // This would extract potential project names, analyze sentiment, etc.
    }

    async processGitHubRepository(repo) {
        // Implementation for processing GitHub repositories
        // This would analyze the code, check for crypto-related content, etc.
    }

    async processDarkWebMention(mention) {
        // Implementation for processing dark web mentions
        // This would be high-priority due to the nature of the source
    }
}

module.exports = CryptoProjectMonitor;
