const axios = require('axios');

class DarkWebMonitor {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.threatintelligence.com/v1'; // Example API
        this.rateLimitDelay = 5000; // 5 seconds between requests
        this.lastRequestTime = 0;
        
        this.cryptoKeywords = [
            'new cryptocurrency', 'new token', 'new coin launch',
            'crypto project', 'blockchain project', 'defi protocol',
            'ico announcement', 'ido launch', 'presale',
            'airdrop', 'token generation', 'smart contract',
            'cryptocurrency exchange', 'crypto trading',
            'bitcoin alternative', 'ethereum killer',
            'yield farming', 'liquidity mining', 'staking rewards'
        ];

        this.darkWebSources = [
            'hidden forums', 'encrypted channels', 'private groups',
            'underground markets', 'crypto communities',
            'anonymous boards', 'secure messaging'
        ];
    }

    async makeRequest(endpoint, params = {}) {
        if (!this.isConfigured()) {
            console.log('Dark web monitoring not configured - skipping');
            return { data: [] };
        }

        // Rate limiting - more conservative for dark web APIs
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => 
                setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
            );
        }

        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'CryptoMonitor/1.0.0'
                },
                params,
                timeout: 30000 // Longer timeout for dark web APIs
            });

            this.lastRequestTime = Date.now();
            return response.data;

        } catch (error) {
            console.error(`Dark Web API Error for ${endpoint}:`, error.message);
            
            if (error.response?.status === 429) {
                // Rate limit exceeded - wait longer
                await new Promise(resolve => setTimeout(resolve, 30000));
                throw new Error('Rate limit exceeded');
            }

            if (error.response?.status === 401) {
                throw new Error('Dark web API authentication failed');
            }
            
            // Return empty data on error to prevent system failure
            return { data: [] };
        }
    }

    async scanForCryptoMentions() {
        try {
            if (!this.isConfigured()) {
                return this.getMockDarkWebData();
            }

            const mentions = [];

            // Scan different dark web sources
            for (const source of this.darkWebSources) {
                try {
                    const data = await this.scanSource(source);
                    mentions.push(...data);

                    // Conservative rate limiting
                    await new Promise(resolve => setTimeout(resolve, 10000));

                } catch (error) {
                    console.error(`Error scanning ${source}:`, error.message);
                    continue;
                }
            }

            return this.filterAndAnalyzeMentions(mentions);

        } catch (error) {
            console.error('Error scanning dark web for crypto mentions:', error);
            return [];
        }
    }

    async scanSource(source) {
        try {
            const data = await this.makeRequest('/scan', {
                source,
                keywords: this.cryptoKeywords.join(','),
                timeframe: '24h',
                language: 'en'
            });

            return data.results || [];

        } catch (error) {
            console.error(`Error scanning source ${source}:`, error);
            return [];
        }
    }

    async monitorCryptoForums() {
        try {
            const forumData = await this.makeRequest('/forums/crypto', {
                timeframe: '6h',
                include_new_projects: true
            });

            return (forumData.posts || []).map(post => ({
                id: post.id,
                title: post.title,
                content: post.content,
                author: post.author || 'anonymous',
                forum: post.forum,
                timestamp: post.timestamp,
                url: post.url,
                replies: post.replies || 0,
                views: post.views || 0,
                crypto_keywords: this.extractCryptoKeywords(post.title + ' ' + post.content),
                risk_level: this.assessRiskLevel(post),
                credibility_score: this.calculateCredibilityScore(post),
                source: 'darkweb_forum',
                type: 'forum_post'
            }));

        } catch (error) {
            console.error('Error monitoring crypto forums:', error);
            return [];
        }
    }

    async monitorMarketplaces() {
        try {
            const marketData = await this.makeRequest('/marketplaces/crypto', {
                timeframe: '12h',
                categories: ['tokens', 'services', 'exchanges']
            });

            return (marketData.listings || []).map(listing => ({
                id: listing.id,
                title: listing.title,
                description: listing.description,
                vendor: listing.vendor || 'anonymous',
                marketplace: listing.marketplace,
                price: listing.price,
                currency: listing.currency,
                timestamp: listing.timestamp,
                category: listing.category,
                crypto_keywords: this.extractCryptoKeywords(listing.title + ' ' + listing.description),
                risk_level: 'high', // Marketplace listings are high risk by default
                legitimacy_score: this.calculateLegitimacyScore(listing),
                source: 'darkweb_marketplace',
                type: 'marketplace_listing'
            }));

        } catch (error) {
            console.error('Error monitoring marketplaces:', error);
            return [];
        }
    }

    async monitorEncryptedChannels() {
        try {
            const channelData = await this.makeRequest('/channels/encrypted', {
                keywords: this.cryptoKeywords.slice(0, 10).join(','),
                timeframe: '24h'
            });

            return (channelData.messages || []).map(message => ({
                id: message.id,
                content: message.content,
                channel: message.channel,
                timestamp: message.timestamp,
                reactions: message.reactions || 0,
                crypto_keywords: this.extractCryptoKeywords(message.content),
                sentiment_score: this.calculateSentiment(message.content),
                influence_score: this.calculateInfluenceScore(message),
                source: 'darkweb_channel',
                type: 'encrypted_message'
            }));

        } catch (error) {
            console.error('Error monitoring encrypted channels:', error);
            return [];
        }
    }

    filterAndAnalyzeMentions(mentions) {
        return mentions
            .filter(mention => this.isRelevantCryptoMention(mention))
            .map(mention => ({
                ...mention,
                analysis: {
                    priority: this.calculatePriority(mention),
                    threat_level: this.assessThreatLevel(mention),
                    actionable: this.isActionable(mention),
                    verification_needed: true // Always require verification for dark web sources
                }
            }))
            .sort((a, b) => b.analysis.priority - a.analysis.priority);
    }

    isRelevantCryptoMention(mention) {
        const text = `${mention.title || ''} ${mention.content || ''}`.toLowerCase();
        
        // Must contain crypto keywords
        const hasCryptoKeywords = this.cryptoKeywords.some(keyword => 
            text.includes(keyword.toLowerCase())
        );

        // Must be recent (within 24 hours)
        const timestamp = new Date(mention.timestamp);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const isRecent = timestamp > twentyFourHoursAgo;

        // Must not be obvious spam
        const isSpam = this.detectSpam(text);

        return hasCryptoKeywords && isRecent && !isSpam;
    }

    detectSpam(text) {
        const spamIndicators = [
            'click here', 'guaranteed profit', 'make money fast',
            'no risk', '100% return', 'get rich quick',
            'limited time offer', 'act now', 'exclusive deal'
        ];

        return spamIndicators.some(indicator => 
            text.toLowerCase().includes(indicator)
        );
    }

    calculatePriority(mention) {
        let priority = 0;

        // Higher priority for new project mentions
        if (mention.crypto_keywords?.includes('new') || 
            mention.content?.toLowerCase().includes('launch')) {
            priority += 30;
        }

        // Higher priority for investment opportunities
        if (mention.content?.toLowerCase().includes('invest') ||
            mention.content?.toLowerCase().includes('ico') ||
            mention.content?.toLowerCase().includes('presale')) {
            priority += 25;
        }

        // Higher priority for high engagement
        if (mention.replies && mention.replies > 10) priority += 15;
        if (mention.views && mention.views > 100) priority += 10;
        if (mention.reactions && mention.reactions > 5) priority += 10;

        // Higher priority for credible sources
        if (mention.credibility_score > 0.7) priority += 20;

        return Math.min(100, priority);
    }

    assessThreatLevel(mention) {
        let threatScore = 0;

        // Check for scam indicators
        const scamWords = ['scam', 'ponzi', 'pyramid', 'rugpull', 'exit scam'];
        const text = mention.content?.toLowerCase() || '';
        
        scamWords.forEach(word => {
            if (text.includes(word)) threatScore += 20;
        });

        // High threat for marketplace listings
        if (mention.source === 'darkweb_marketplace') threatScore += 30;

        // High threat for anonymous authors
        if (mention.author === 'anonymous' || !mention.author) threatScore += 15;

        if (threatScore >= 60) return 'high';
        if (threatScore >= 30) return 'medium';
        return 'low';
    }

    assessRiskLevel(mention) {
        const riskFactors = [
            'anonymous', 'untraceable', 'offshore', 'unregulated',
            'guaranteed', 'risk-free', 'insider', 'exclusive'
        ];

        const text = `${mention.title || ''} ${mention.content || ''}`.toLowerCase();
        const riskCount = riskFactors.filter(factor => text.includes(factor)).length;

        if (riskCount >= 3) return 'high';
        if (riskCount >= 2) return 'medium';
        return 'low';
    }

    calculateCredibilityScore(mention) {
        let score = 0.5; // Base score

        // Positive indicators
        if (mention.replies && mention.replies > 5) score += 0.1;
        if (mention.views && mention.views > 50) score += 0.1;
        if (mention.author && mention.author !== 'anonymous') score += 0.2;

        // Negative indicators
        if (mention.content?.length < 50) score -= 0.2;
        if (this.detectSpam(mention.content || '')) score -= 0.4;

        return Math.max(0, Math.min(1, score));
    }

    calculateLegitimacyScore(listing) {
        let score = 0.3; // Lower base score for marketplace listings

        // Positive indicators
        if (listing.vendor && listing.vendor !== 'anonymous') score += 0.2;
        if (listing.description && listing.description.length > 100) score += 0.1;
        if (listing.price && listing.price > 0) score += 0.1;

        // Negative indicators
        if (listing.title?.toLowerCase().includes('guaranteed')) score -= 0.3;
        if (listing.description?.toLowerCase().includes('risk-free')) score -= 0.3;

        return Math.max(0, Math.min(1, score));
    }

    extractCryptoKeywords(text) {
        if (!text) return [];
        
        const lowercaseText = text.toLowerCase();
        return this.cryptoKeywords.filter(keyword => 
            lowercaseText.includes(keyword.toLowerCase())
        );
    }

    calculateSentiment(text) {
        if (!text) return 0;

        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'profitable', 'bullish'];
        const negativeWords = ['bad', 'terrible', 'scam', 'fraud', 'risky', 'bearish'];
        
        const lowercaseText = text.toLowerCase();
        let score = 0;

        positiveWords.forEach(word => {
            if (lowercaseText.includes(word)) score += 1;
        });

        negativeWords.forEach(word => {
            if (lowercaseText.includes(word)) score -= 1;
        });

        return Math.max(-1, Math.min(1, score / 5));
    }

    calculateInfluenceScore(mention) {
        const reactions = mention.reactions || 0;
        const replies = mention.replies || 0;
        
        return Math.min(100, (reactions * 2) + (replies * 5));
    }

    isActionable(mention) {
        // Consider a mention actionable if it's about new projects or opportunities
        const actionableKeywords = [
            'new', 'launch', 'presale', 'ico', 'ido', 'airdrop',
            'listing', 'announcement', 'release'
        ];

        const text = `${mention.title || ''} ${mention.content || ''}`.toLowerCase();
        return actionableKeywords.some(keyword => text.includes(keyword));
    }

    // Mock data for when API is not configured
    getMockDarkWebData() {
        return [
            {
                id: 'mock_1',
                title: 'New DeFi Protocol Launch on Hidden Forum',
                content: 'Anonymous team launching new yield farming protocol with 500% APY...',
                author: 'anonymous_trader',
                source: 'darkweb_forum',
                type: 'forum_post',
                timestamp: new Date().toISOString(),
                crypto_keywords: ['new', 'defi', 'yield farming'],
                risk_level: 'high',
                credibility_score: 0.3
            },
            {
                id: 'mock_2',
                title: 'Exclusive ICO Pre-Sale Access',
                content: 'Get early access to revolutionary blockchain project before public launch...',
                author: 'crypto_insider',
                source: 'darkweb_channel',
                type: 'encrypted_message',
                timestamp: new Date().toISOString(),
                crypto_keywords: ['ico', 'presale', 'blockchain'],
                risk_level: 'high',
                credibility_score: 0.2
            }
        ];
    }

    isConfigured() {
        return !!(this.apiKey && 
                 this.apiKey !== 'your_darkweb_monitoring_api_key_here' &&
                 this.apiKey !== 'your_threat_intel_api_key_here');
    }

    async getComprehensiveReport() {
        try {
            const [forumMentions, marketplaceListings, channelMessages] = await Promise.all([
                this.monitorCryptoForums(),
                this.monitorMarketplaces(),
                this.monitorEncryptedChannels()
            ]);

            const allMentions = [...forumMentions, ...marketplaceListings, ...channelMessages];
            const filteredMentions = this.filterAndAnalyzeMentions(allMentions);

            return {
                total_mentions: allMentions.length,
                actionable_mentions: filteredMentions.filter(m => m.analysis.actionable).length,
                high_priority: filteredMentions.filter(m => m.analysis.priority >= 70).length,
                high_threat: filteredMentions.filter(m => m.analysis.threat_level === 'high').length,
                mentions: filteredMentions.slice(0, 50), // Return top 50
                scan_timestamp: new Date().toISOString(),
                sources_scanned: this.darkWebSources.length
            };

        } catch (error) {
            console.error('Error generating comprehensive dark web report:', error);
            return {
                total_mentions: 0,
                actionable_mentions: 0,
                high_priority: 0,
                high_threat: 0,
                mentions: [],
                scan_timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }
}

module.exports = DarkWebMonitor;
