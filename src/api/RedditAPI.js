const axios = require('axios');

class RedditAPI {
    constructor(credentials) {
        this.clientId = credentials.clientId;
        this.clientSecret = credentials.clientSecret;
        this.baseURL = 'https://oauth.reddit.com';
        this.authURL = 'https://www.reddit.com/api/v1';
        this.userAgent = 'CryptoMonitor/1.0.0';
        this.accessToken = null;
        this.tokenExpiry = null;
        this.rateLimitDelay = 1000; // 1 second between requests
        this.lastRequestTime = 0;

        this.cryptoSubreddits = [
            'CryptoMoonShots', 'CryptoCurrency', 'altcoin', 'defi',
            'ethtrader', 'SatoshiStreetBets', 'CryptoMarkets',
            'Bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot',
            'pancakeswap', 'uniswap', 'binance', 'coinbase'
        ];
    }

    async authenticate() {
        try {
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            
            const response = await axios.post(`${this.authURL}/access_token`, 
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': this.userAgent
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            
            return true;

        } catch (error) {
            console.error('Reddit authentication failed:', error.message);
            return false;
        }
    }

    async makeRequest(endpoint, params = {}) {
        // Check if token is expired
        if (!this.accessToken || Date.now() >= this.tokenExpiry) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Reddit authentication failed');
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
                    'Authorization': `Bearer ${this.accessToken}`,
                    'User-Agent': this.userAgent
                },
                params,
                timeout: 10000
            });

            this.lastRequestTime = Date.now();
            return response.data;

        } catch (error) {
            console.error(`Reddit API Error for ${endpoint}:`, error.message);
            
            if (error.response?.status === 429) {
                const waitTime = 60000; // Wait 1 minute
                console.log(`Reddit rate limit exceeded. Waiting ${waitTime / 1000} seconds.`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                throw new Error('Rate limit exceeded');
            }

            if (error.response?.status === 401) {
                this.accessToken = null;
                throw new Error('Authentication failed');
            }
            
            throw error;
        }
    }

    async getNewPosts(subreddit, limit = 25) {
        try {
            const data = await this.makeRequest(`/r/${subreddit}/new`, {
                limit: Math.min(limit, 100)
            });

            if (!data.data || !data.data.children) {
                return [];
            }

            return data.data.children
                .map(child => this.formatPostData(child.data))
                .filter(post => this.isCryptoRelated(post));

        } catch (error) {
            console.error(`Error fetching new posts from r/${subreddit}:`, error);
            return [];
        }
    }

    async getHotPosts(subreddit, limit = 25) {
        try {
            const data = await this.makeRequest(`/r/${subreddit}/hot`, {
                limit: Math.min(limit, 100)
            });

            if (!data.data || !data.data.children) {
                return [];
            }

            return data.data.children
                .map(child => this.formatPostData(child.data))
                .filter(post => this.isCryptoRelated(post));

        } catch (error) {
            console.error(`Error fetching hot posts from r/${subreddit}:`, error);
            return [];
        }
    }

    async getTrendingPosts(subreddit, timeframe = 'day', limit = 25) {
        try {
            const data = await this.makeRequest(`/r/${subreddit}/top`, {
                limit: Math.min(limit, 100),
                t: timeframe // hour, day, week, month, year, all
            });

            if (!data.data || !data.data.children) {
                return [];
            }

            return data.data.children
                .map(child => this.formatPostData(child.data))
                .filter(post => this.isCryptoRelated(post));

        } catch (error) {
            console.error(`Error fetching trending posts from r/${subreddit}:`, error);
            return [];
        }
    }

    async searchPosts(query, subreddit = null, limit = 25) {
        try {
            const endpoint = subreddit ? `/r/${subreddit}/search` : '/search';
            const params = {
                q: query,
                limit: Math.min(limit, 100),
                sort: 'new',
                restrict_sr: subreddit ? 'true' : 'false'
            };

            const data = await this.makeRequest(endpoint, params);

            if (!data.data || !data.data.children) {
                return [];
            }

            return data.data.children.map(child => this.formatPostData(child.data));

        } catch (error) {
            console.error(`Error searching posts for "${query}":`, error);
            return [];
        }
    }

    async getAllCryptoSubredditPosts() {
        try {
            const allPosts = [];

            for (const subreddit of this.cryptoSubreddits) {
                try {
                    const [newPosts, hotPosts] = await Promise.all([
                        this.getNewPosts(subreddit, 10),
                        this.getHotPosts(subreddit, 10)
                    ]);

                    allPosts.push(...newPosts, ...hotPosts);

                    // Rate limiting between subreddits
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`Error fetching posts from r/${subreddit}:`, error.message);
                    continue;
                }
            }

            // Remove duplicates and sort by creation date
            const uniquePosts = this.removeDuplicates(allPosts);
            return uniquePosts.sort((a, b) => b.created_utc - a.created_utc);

        } catch (error) {
            console.error('Error fetching all crypto subreddit posts:', error);
            return [];
        }
    }

    async getPostComments(postId, limit = 50) {
        try {
            const data = await this.makeRequest(`/comments/${postId}`, {
                limit: Math.min(limit, 100),
                sort: 'top'
            });

            if (!data || !data[1] || !data[1].data || !data[1].data.children) {
                return [];
            }

            return data[1].data.children
                .map(child => child.data)
                .filter(comment => comment.body && comment.body !== '[deleted]')
                .map(comment => ({
                    id: comment.id,
                    author: comment.author,
                    body: comment.body,
                    score: comment.score,
                    created_utc: comment.created_utc,
                    replies: comment.replies ? this.extractReplies(comment.replies) : [],
                    source: 'reddit',
                    type: 'comment'
                }));

        } catch (error) {
            console.error(`Error fetching comments for post ${postId}:`, error);
            return [];
        }
    }

    formatPostData(postData) {
        return {
            id: postData.id,
            title: postData.title,
            text: postData.selftext || '',
            author: postData.author,
            subreddit: postData.subreddit,
            score: postData.score,
            upvote_ratio: postData.upvote_ratio,
            num_comments: postData.num_comments,
            created_utc: postData.created_utc,
            url: postData.url,
            permalink: `https://reddit.com${postData.permalink}`,
            flair_text: postData.link_flair_text,
            is_video: postData.is_video,
            is_original_content: postData.is_original_content,
            over_18: postData.over_18,
            spoiler: postData.spoiler,
            locked: postData.locked,
            stickied: postData.stickied,
            distinguished: postData.distinguished,
            gilded: postData.gilded,
            awards: postData.all_awardings || [],
            crypto_keywords: this.extractCryptoKeywords(postData.title + ' ' + postData.selftext),
            sentiment_score: this.calculateBasicSentiment(postData.title + ' ' + postData.selftext),
            engagement_score: this.calculateEngagementScore(postData),
            source: 'reddit',
            type: 'post'
        };
    }

    isCryptoRelated(post) {
        const cryptoKeywords = [
            'crypto', 'cryptocurrency', 'bitcoin', 'btc', 'ethereum', 'eth',
            'altcoin', 'defi', 'nft', 'blockchain', 'token', 'coin',
            'trading', 'pump', 'dump', 'moon', 'hodl', 'lambo',
            'bull', 'bear', 'satoshi', 'whale', 'gem', 'presale'
        ];

        const text = (post.title + ' ' + post.text + ' ' + post.subreddit).toLowerCase();
        
        return cryptoKeywords.some(keyword => text.includes(keyword));
    }

    extractCryptoKeywords(text) {
        const cryptoKeywords = [
            'new crypto', 'new token', 'new coin', 'presale', 'ico', 'ido',
            'airdrop', 'launch', 'listing', 'gem', 'moonshot', 'defi',
            'pump', 'dump', 'hodl', 'diamond hands', 'paper hands',
            'to the moon', 'wen lambo', 'buy the dip', 'rugpull'
        ];

        const lowercaseText = text.toLowerCase();
        return cryptoKeywords.filter(keyword => 
            lowercaseText.includes(keyword.toLowerCase())
        );
    }

    calculateBasicSentiment(text) {
        const positiveWords = ['bull', 'bullish', 'moon', 'pump', 'gain', 'up', 'rise', 'good', 'great', 'amazing', 'rocket'];
        const negativeWords = ['bear', 'bearish', 'dump', 'crash', 'down', 'fall', 'bad', 'terrible', 'scam', 'rug'];
        
        const lowercaseText = text.toLowerCase();
        let score = 0;

        positiveWords.forEach(word => {
            const matches = (lowercaseText.match(new RegExp(word, 'g')) || []).length;
            score += matches;
        });

        negativeWords.forEach(word => {
            const matches = (lowercaseText.match(new RegExp(word, 'g')) || []).length;
            score -= matches;
        });

        return Math.max(-1, Math.min(1, score / 10));
    }

    calculateEngagementScore(postData) {
        const score = postData.score || 0;
        const comments = postData.num_comments || 0;
        const upvoteRatio = postData.upvote_ratio || 0.5;
        const awards = postData.gilded || 0;

        return (score * upvoteRatio) + (comments * 2) + (awards * 10);
    }

    removeDuplicates(posts) {
        const seen = new Set();
        return posts.filter(post => {
            if (seen.has(post.id)) {
                return false;
            }
            seen.add(post.id);
            return true;
        });
    }

    extractReplies(repliesData) {
        if (!repliesData || !repliesData.data || !repliesData.data.children) {
            return [];
        }

        return repliesData.data.children
            .map(child => child.data)
            .filter(reply => reply.body && reply.body !== '[deleted]')
            .map(reply => ({
                id: reply.id,
                author: reply.author,
                body: reply.body,
                score: reply.score,
                created_utc: reply.created_utc
            }));
    }

    isConfigured() {
        return !!(this.clientId && 
                 this.clientSecret && 
                 this.clientId !== 'your_reddit_client_id_here');
    }

    async monitorNewProjectMentions() {
        try {
            const keywords = [
                'new crypto project', 'new token launch', 'new coin listing',
                'presale announcement', 'ico launch', 'ido launch',
                'airdrop announcement', 'gem found', 'moonshot potential'
            ];

            const mentions = [];

            for (const keyword of keywords) {
                const results = await this.searchPosts(keyword, null, 20);
                mentions.push(...results.map(post => ({
                    ...post,
                    search_keyword: keyword,
                    type: 'new_project_mention'
                })));

                // Rate limiting between searches
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return mentions;

        } catch (error) {
            console.error('Error monitoring new project mentions:', error);
            return [];
        }
    }
}

module.exports = RedditAPI;
