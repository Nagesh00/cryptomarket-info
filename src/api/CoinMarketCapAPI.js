const axios = require('axios');

class CoinMarketCapAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://pro-api.coinmarketcap.com/v1';
        this.headers = {
            'X-CMC_PRO_API_KEY': apiKey,
            'Accept': 'application/json',
            'Accept-Encoding': 'deflate, gzip'
        };
        
        this.rateLimitDelay = 1000; // 1 second between requests
        this.lastRequestTime = 0;
    }

    async makeRequest(endpoint, params = {}) {
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
                headers: this.headers,
                params,
                timeout: 10000
            });

            this.lastRequestTime = Date.now();
            return response.data;

        } catch (error) {
            console.error(`CMC API Error for ${endpoint}:`, error.message);
            
            if (error.response?.status === 429) {
                // Rate limit hit, wait longer
                await new Promise(resolve => setTimeout(resolve, 5000));
                throw new Error('Rate limit exceeded');
            }
            
            throw error;
        }
    }

    async getTrending() {
        try {
            const data = await this.makeRequest('/cryptocurrency/trending/latest');
            
            return data.data.map(coin => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                price: coin.quote?.USD?.price || 0,
                market_cap: coin.quote?.USD?.market_cap || 0,
                volume_24h: coin.quote?.USD?.volume_24h || 0,
                percent_change_24h: coin.quote?.USD?.percent_change_24h || 0,
                percent_change_7d: coin.quote?.USD?.percent_change_7d || 0,
                rank: coin.cmc_rank,
                slug: coin.slug,
                max_supply: coin.max_supply,
                circulating_supply: coin.circulating_supply,
                total_supply: coin.total_supply,
                platform: coin.platform,
                tags: coin.tags || [],
                date_added: coin.date_added,
                last_updated: coin.last_updated,
                source: 'coinmarketcap',
                type: 'trending'
            }));

        } catch (error) {
            console.error('Error fetching CMC trending:', error);
            return [];
        }
    }

    async getNewListings(limit = 100) {
        try {
            const data = await this.makeRequest('/cryptocurrency/listings/new', {
                limit,
                convert: 'USD'
            });

            return data.data.map(coin => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                price: coin.quote?.USD?.price || 0,
                market_cap: coin.quote?.USD?.market_cap || 0,
                volume_24h: coin.quote?.USD?.volume_24h || 0,
                percent_change_24h: coin.quote?.USD?.percent_change_24h || 0,
                percent_change_7d: coin.quote?.USD?.percent_change_7d || 0,
                rank: coin.cmc_rank,
                slug: coin.slug,
                max_supply: coin.max_supply,
                circulating_supply: coin.circulating_supply,
                total_supply: coin.total_supply,
                platform: coin.platform,
                tags: coin.tags || [],
                date_added: coin.date_added,
                last_updated: coin.last_updated,
                source: 'coinmarketcap',
                type: 'new_listing'
            }));

        } catch (error) {
            console.error('Error fetching CMC new listings:', error);
            return [];
        }
    }

    async getGainersLosers() {
        try {
            const data = await this.makeRequest('/cryptocurrency/trending/gainers-losers');
            
            const gainers = data.data.gainers?.map(coin => ({
                ...this.formatCoinData(coin),
                type: 'gainer'
            })) || [];

            const losers = data.data.losers?.map(coin => ({
                ...this.formatCoinData(coin),
                type: 'loser'
            })) || [];

            return [...gainers, ...losers];

        } catch (error) {
            console.error('Error fetching CMC gainers/losers:', error);
            return [];
        }
    }

    async getMostVisited() {
        try {
            const data = await this.makeRequest('/cryptocurrency/trending/most-visited');
            
            return data.data.map(coin => ({
                ...this.formatCoinData(coin),
                type: 'most_visited'
            }));

        } catch (error) {
            console.error('Error fetching CMC most visited:', error);
            return [];
        }
    }

    async getCoinInfo(id) {
        try {
            const data = await this.makeRequest('/cryptocurrency/info', { id });
            
            const coinInfo = data.data[id];
            if (!coinInfo) return null;

            return {
                id: coinInfo.id,
                name: coinInfo.name,
                symbol: coinInfo.symbol,
                category: coinInfo.category,
                description: coinInfo.description,
                logo: coinInfo.logo,
                subreddit: coinInfo.subreddit,
                notice: coinInfo.notice,
                tags: coinInfo.tags || [],
                platform: coinInfo.platform,
                date_added: coinInfo.date_added,
                twitter_username: coinInfo.twitter_username,
                is_hidden: coinInfo.is_hidden,
                date_launched: coinInfo.date_launched,
                contract_address: coinInfo.contract_address,
                self_reported_circulating_supply: coinInfo.self_reported_circulating_supply,
                self_reported_tags: coinInfo.self_reported_tags,
                self_reported_market_cap: coinInfo.self_reported_market_cap,
                urls: coinInfo.urls || {}
            };

        } catch (error) {
            console.error(`Error fetching CMC coin info for ${id}:`, error);
            return null;
        }
    }

    formatCoinData(coin) {
        return {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            price: coin.quote?.USD?.price || 0,
            market_cap: coin.quote?.USD?.market_cap || 0,
            volume_24h: coin.quote?.USD?.volume_24h || 0,
            percent_change_24h: coin.quote?.USD?.percent_change_24h || 0,
            percent_change_7d: coin.quote?.USD?.percent_change_7d || 0,
            rank: coin.cmc_rank,
            slug: coin.slug,
            source: 'coinmarketcap'
        };
    }

    async getQuotes(symbols) {
        try {
            const data = await this.makeRequest('/cryptocurrency/quotes/latest', {
                symbol: Array.isArray(symbols) ? symbols.join(',') : symbols,
                convert: 'USD'
            });

            return Object.values(data.data).map(coin => this.formatCoinData(coin));

        } catch (error) {
            console.error('Error fetching CMC quotes:', error);
            return [];
        }
    }

    async searchCryptocurrencies(query) {
        try {
            // Note: CMC doesn't have a direct search endpoint in the free tier
            // This would need to be implemented using the listings endpoint
            // and filtering client-side
            const listings = await this.getNewListings(1000);
            
            return listings.filter(coin => 
                coin.name.toLowerCase().includes(query.toLowerCase()) ||
                coin.symbol.toLowerCase().includes(query.toLowerCase())
            );

        } catch (error) {
            console.error('Error searching CMC cryptocurrencies:', error);
            return [];
        }
    }

    isConfigured() {
        return !!this.apiKey && this.apiKey !== 'your_cmc_api_key_here';
    }
}

module.exports = CoinMarketCapAPI;
