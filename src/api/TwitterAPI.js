const axios = require('axios');

class TwitterAPI {
    constructor(credentials) {
        this.credentials = credentials;
        this.baseURL = 'https://api.twitter.com/2';
        this.rateLimitDelay = 1000;
        this.lastRequestTime = 0;
        this.bearerToken = null;
        
        this.cryptoKeywords = [
            'new crypto', 'new token', 'new coin', 'presale', 'ICO', 'IDO',
            'airdrop', 'launch', 'listing', 'gem', 'moonshot', 'defi',
            'cryptocurrency', 'blockchain', 'altcoin', 'bullish', 'bearish',
            '$BTC', '$ETH', '$SOL', '$ADA', '$DOT', '$MATIC', '$AVAX',
            'pump', 'dump', 'hodl', 'diamond hands', 'paper hands',
            'to the moon', 'wen lambo', 'buy the dip', 'rugpull'
        ];
    }

    async authenticate() {
        try {
            // For OAuth 2.0 Bearer Token authentication
            const response = await axios.post('https://api.twitter.com/oauth2/token', 
                'grant_type=client_credentials',
                {
                    auth: {
                        username: this.credentials.apiKey,
                        password: this.credentials.apiSecret
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                    }
                }
            );

            this.bearerToken = response.data.access_token;
            return true;

        } catch (error) {
            console.error('Twitter authentication failed:', error.message);
            return false;
        }
    }

    async makeRequest(endpoint, params = {}) {
        if (!this.bearerToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Twitter authentication failed');
            }
        }

        // Rate limiting
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
                    'Authorization': `Bearer ${this.bearerToken}`,
                    'Content-Type': 'application/json'
                },
                params,
                timeout: 10000
            });

            this.lastRequestTime = Date.now();
            return response.data;

        } catch (error) {
            console.error(`Twitter API Error for ${endpoint}:`, error.message);
            
            if (error.response?.status === 429) {
                // Rate limit exceeded
                const resetTime = error.response.headers['x-rate-limit-reset'];
                const waitTime = resetTime ? (resetTime * 1000 - Date.now()) : 15 * 60 * 1000;
                console.log(`Rate limit exceeded. Waiting ${waitTime / 1000} seconds.`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                throw new Error('Rate limit exceeded');
            }

            if (error.response?.status === 401) {
                // Token expired, re-authenticate
                this.bearerToken = null;
                throw new Error('Authentication failed');
            }
            
            throw error;
        }
    }

    async searchTweets(keywords = this.cryptoKeywords, maxResults = 100) {
        try {
            // Create search query
            const query = Array.isArray(keywords) ? keywords.join(' OR ') : keywords;
            
            const params = {
                query: `(${query}) -is:retweet lang:en`,
                max_results: Math.min(maxResults, 100),
                'tweet.fields': 'created_at,author_id,public_metrics,context_annotations,entities,referenced_tweets',
                'user.fields': 'username,name,verified,public_metrics,description',
                'expansions': 'author_id,referenced_tweets.id'
            };

            const data = await this.makeRequest('/tweets/search/recent', params);
            
            return this.formatTweetData(data);

        } catch (error) {
            console.error('Error searching tweets:', error);
            return [];
        }
    }

    async getTrendingTopics(woeid = 1) { // 1 = Worldwide
        try {
            // Note: This endpoint requires different authentication (OAuth 1.0a)
            // For now, we'll use a mock implementation
            
            const trendingTopics = [
                { name: '#Bitcoin', volume: 50000, category: 'crypto' },
                { name: '#Ethereum', volume: 30000, category: 'crypto' },
                { name: '#DeFi', volume: 15000, category: 'crypto' },
                { name: '#NFT', volume: 25000, category: 'crypto' },
                { name: '#Altcoin', volume: 10000, category: 'crypto' }
            ];

            return trendingTopics.filter(topic => topic.category === 'crypto');

        } catch (error) {
            console.error('Error fetching trending topics:', error);
            return [];
        }
    }

    async getCryptoInfluencerTweets() {
        try {
            const influencers = [
                'elonmusk', 'VitalikButerin', 'cz_binance', 'novogratz',
                'saylor', 'aantonop', 'naval', 'balajis', 'tylerwinklevoss'
            ];

            const tweets = [];
            
            for (const username of influencers) {
                try {
                    const userData = await this.makeRequest('/users/by/username/' + username, {
                        'user.fields': 'public_metrics,verified,description'
                    });

                    if (userData.data) {
                        const userTweets = await this.makeRequest(`/users/${userData.data.id}/tweets`, {
                            max_results: 10,
                            'tweet.fields': 'created_at,public_metrics,context_annotations,entities',
                            exclude: 'retweets,replies'
                        });

                        if (userTweets.data) {
                            const cryptoTweets = userTweets.data.filter(tweet => 
                                this.containsCryptoKeywords(tweet.text)
                            );

                            tweets.push(...cryptoTweets.map(tweet => ({
                                ...tweet,
                                author: userData.data,
                                influence_score: this.calculateInfluenceScore(userData.data, tweet),
                                source: 'twitter',
                                type: 'influencer_tweet'
                            })));
                        }
                    }

                    // Rate limiting between influencer requests
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`Error fetching tweets for ${username}:`, error.message);
                    continue;
                }
            }

            return tweets;

        } catch (error) {
            console.error('Error fetching crypto influencer tweets:', error);
            return [];
        }
    }

    async monitorHashtags(hashtags = ['#NewCrypto', '#NewToken', '#ICO', '#IDO', '#Presale']) {
        try {
            const allTweets = [];

            for (const hashtag of hashtags) {
                const tweets = await this.searchTweets(hashtag, 50);
                allTweets.push(...tweets.map(tweet => ({
                    ...tweet,
                    monitored_hashtag: hashtag,
                    type: 'hashtag_mention'
                })));

                // Rate limiting between hashtag searches
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return allTweets;

        } catch (error) {
            console.error('Error monitoring hashtags:', error);
            return [];
        }
    }

    formatTweetData(data) {
        if (!data.data) return [];

        const users = data.includes?.users || [];
        const userMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {});

        return data.data.map(tweet => {
            const author = userMap[tweet.author_id];
            
            return {
                id: tweet.id,
                text: tweet.text,
                created_at: tweet.created_at,
                author_id: tweet.author_id,
                author: author ? {
                    username: author.username,
                    name: author.name,
                    verified: author.verified,
                    followers_count: author.public_metrics?.followers_count || 0,
                    following_count: author.public_metrics?.following_count || 0,
                    tweet_count: author.public_metrics?.tweet_count || 0,
                    description: author.description
                } : null,
                public_metrics: tweet.public_metrics || {},
                context_annotations: tweet.context_annotations || [],
                entities: tweet.entities || {},
                referenced_tweets: tweet.referenced_tweets || [],
                crypto_keywords: this.extractCryptoKeywords(tweet.text),
                sentiment_score: this.calculateBasicSentiment(tweet.text),
                engagement_score: this.calculateEngagementScore(tweet.public_metrics),
                source: 'twitter',
                type: 'tweet'
            };
        });
    }

    containsCryptoKeywords(text) {
        const lowercaseText = text.toLowerCase();
        return this.cryptoKeywords.some(keyword => 
            lowercaseText.includes(keyword.toLowerCase())
        );
    }

    extractCryptoKeywords(text) {
        const lowercaseText = text.toLowerCase();
        return this.cryptoKeywords.filter(keyword => 
            lowercaseText.includes(keyword.toLowerCase())
        );
    }

    calculateBasicSentiment(text) {
        const positiveWords = ['bull', 'bullish', 'moon', 'pump', 'gain', 'up', 'rise', 'good', 'great', 'amazing'];
        const negativeWords = ['bear', 'bearish', 'dump', 'crash', 'down', 'fall', 'bad', 'terrible', 'scam'];
        
        const lowercaseText = text.toLowerCase();
        let score = 0;

        positiveWords.forEach(word => {
            if (lowercaseText.includes(word)) score += 1;
        });

        negativeWords.forEach(word => {
            if (lowercaseText.includes(word)) score -= 1;
        });

        return Math.max(-1, Math.min(1, score / 10)); // Normalize to -1 to 1
    }

    calculateEngagementScore(metrics) {
        if (!metrics) return 0;
        
        const { retweet_count = 0, like_count = 0, reply_count = 0, quote_count = 0 } = metrics;
        
        // Weighted engagement score
        return (retweet_count * 3) + (like_count * 1) + (reply_count * 2) + (quote_count * 2);
    }

    calculateInfluenceScore(user, tweet) {
        if (!user || !user.public_metrics) return 0;
        
        const followers = user.public_metrics.followers_count || 0;
        const verified = user.verified ? 1000 : 0;
        const engagement = this.calculateEngagementScore(tweet.public_metrics);
        
        return Math.log10(followers + verified + engagement + 1);
    }

    isConfigured() {
        return !!(this.credentials.apiKey && 
                 this.credentials.apiSecret && 
                 this.credentials.apiKey !== 'your_twitter_api_key_here');
    }

    // Stream tweets in real-time (requires different setup)
    async streamTweets(keywords = this.cryptoKeywords) {
        try {
            // This would require the Twitter Streaming API
            // For now, return a mock implementation
            console.log('Twitter streaming not implemented in this version');
            return null;

        } catch (error) {
            console.error('Error setting up Twitter stream:', error);
            return null;
        }
    }
}

module.exports = TwitterAPI;
