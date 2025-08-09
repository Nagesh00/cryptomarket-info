const axios = require('axios');

class CoinGeckoAPI {
    constructor(apiKey = null) {
        this.apiKey = apiKey;
        this.baseURL = apiKey ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
        this.rateLimitDelay = apiKey ? 500 : 1200; // Pro API: 500ms, Free API: 1.2s
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
            const headers = {
                'Accept': 'application/json'
            };

            if (this.apiKey) {
                headers['x-cg-pro-api-key'] = this.apiKey;
            }

            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                headers,
                params,
                timeout: 15000
            });

            this.lastRequestTime = Date.now();
            return response.data;

        } catch (error) {
            console.error(`CoinGecko API Error for ${endpoint}:`, error.message);
            
            if (error.response?.status === 429) {
                // Rate limit hit
                await new Promise(resolve => setTimeout(resolve, 10000));
                throw new Error('Rate limit exceeded');
            }
            
            throw error;
        }
    }

    async getTrending() {
        try {
            const data = await this.makeRequest('/search/trending');
            
            const trendingCoins = data.coins?.map(item => ({
                id: item.item.id,
                name: item.item.name,
                symbol: item.item.symbol,
                market_cap_rank: item.item.market_cap_rank,
                thumb: item.item.thumb,
                small: item.item.small,
                large: item.item.large,
                slug: item.item.slug,
                price_btc: item.item.price_btc,
                score: item.item.score,
                source: 'coingecko',
                type: 'trending_coin'
            })) || [];

            return trendingCoins;

        } catch (error) {
            console.error('Error fetching CoinGecko trending:', error);
            return [];
        }
    }

    async getTrendingNFTs() {
        try {
            const data = await this.makeRequest('/search/trending');
            
            const trendingNFTs = data.nfts?.map(item => ({
                id: item.id,
                name: item.name,
                symbol: item.symbol,
                thumb: item.thumb,
                nft_contract_id: item.nft_contract_id,
                native_currency_symbol: item.native_currency_symbol,
                floor_price_in_native_currency: item.floor_price_in_native_currency,
                floor_price_24h_percentage_change: item.floor_price_24h_percentage_change,
                source: 'coingecko',
                type: 'trending_nft'
            })) || [];

            return trendingNFTs;

        } catch (error) {
            console.error('Error fetching CoinGecko trending NFTs:', error);
            return [];
        }
    }

    async getTrendingSearches() {
        try {
            const data = await this.makeRequest('/search/trending');
            
            const categories = data.categories?.map(item => ({
                id: item.id,
                name: item.name,
                market_cap_1h_change: item.market_cap_1h_change,
                slug: item.slug,
                coins_count: item.coins_count,
                source: 'coingecko',
                type: 'trending_category'
            })) || [];

            return categories;

        } catch (error) {
            console.error('Error fetching CoinGecko trending searches:', error);
            return [];
        }
    }

    async getNewListings() {
        try {
            // Get recently added coins (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const data = await this.makeRequest('/coins/markets', {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 250,
                page: 1,
                sparkline: false,
                price_change_percentage: '24h,7d'
            });

            // Filter for coins added in the last 30 days
            const newCoins = data.filter(coin => {
                const addedDate = new Date(coin.atl_date);
                return addedDate >= thirtyDaysAgo;
            });

            return newCoins.map(coin => ({
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                image: coin.image,
                current_price: coin.current_price,
                market_cap: coin.market_cap,
                market_cap_rank: coin.market_cap_rank,
                fully_diluted_valuation: coin.fully_diluted_valuation,
                total_volume: coin.total_volume,
                high_24h: coin.high_24h,
                low_24h: coin.low_24h,
                price_change_24h: coin.price_change_24h,
                price_change_percentage_24h: coin.price_change_percentage_24h,
                price_change_percentage_7d_in_currency: coin.price_change_percentage_7d_in_currency,
                market_cap_change_24h: coin.market_cap_change_24h,
                market_cap_change_percentage_24h: coin.market_cap_change_percentage_24h,
                circulating_supply: coin.circulating_supply,
                total_supply: coin.total_supply,
                max_supply: coin.max_supply,
                ath: coin.ath,
                ath_change_percentage: coin.ath_change_percentage,
                ath_date: coin.ath_date,
                atl: coin.atl,
                atl_change_percentage: coin.atl_change_percentage,
                atl_date: coin.atl_date,
                last_updated: coin.last_updated,
                source: 'coingecko',
                type: 'new_listing'
            }));

        } catch (error) {
            console.error('Error fetching CoinGecko new listings:', error);
            return [];
        }
    }

    async getTopGainers() {
        try {
            const data = await this.makeRequest('/coins/markets', {
                vs_currency: 'usd',
                order: 'price_change_percentage_24h_desc',
                per_page: 50,
                page: 1,
                sparkline: false,
                price_change_percentage: '24h'
            });

            return data.map(coin => ({
                ...this.formatCoinData(coin),
                type: 'top_gainer'
            }));

        } catch (error) {
            console.error('Error fetching CoinGecko top gainers:', error);
            return [];
        }
    }

    async getCoinData(coinId) {
        try {
            const data = await this.makeRequest(`/coins/${coinId}`, {
                localization: false,
                tickers: false,
                market_data: true,
                community_data: true,
                developer_data: true,
                sparkline: false
            });

            return {
                id: data.id,
                symbol: data.symbol,
                name: data.name,
                description: data.description?.en,
                links: data.links,
                image: data.image,
                market_cap_rank: data.market_cap_rank,
                coingecko_rank: data.coingecko_rank,
                coingecko_score: data.coingecko_score,
                developer_score: data.developer_score,
                community_score: data.community_score,
                liquidity_score: data.liquidity_score,
                public_interest_score: data.public_interest_score,
                market_data: data.market_data,
                community_data: data.community_data,
                developer_data: data.developer_data,
                public_interest_stats: data.public_interest_stats,
                status_updates: data.status_updates,
                last_updated: data.last_updated,
                source: 'coingecko'
            };

        } catch (error) {
            console.error(`Error fetching CoinGecko coin data for ${coinId}:`, error);
            return null;
        }
    }

    async searchCoins(query) {
        try {
            const data = await this.makeRequest('/search', { query });
            
            const coins = data.coins?.map(coin => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                market_cap_rank: coin.market_cap_rank,
                thumb: coin.thumb,
                large: coin.large,
                source: 'coingecko',
                type: 'search_result'
            })) || [];

            return coins;

        } catch (error) {
            console.error('Error searching CoinGecko coins:', error);
            return [];
        }
    }

    async getGlobalData() {
        try {
            const data = await this.makeRequest('/global');
            
            return {
                active_cryptocurrencies: data.data.active_cryptocurrencies,
                upcoming_icos: data.data.upcoming_icos,
                ongoing_icos: data.data.ongoing_icos,
                ended_icos: data.data.ended_icos,
                markets: data.data.markets,
                total_market_cap: data.data.total_market_cap,
                total_volume: data.data.total_volume,
                market_cap_percentage: data.data.market_cap_percentage,
                market_cap_change_percentage_24h_usd: data.data.market_cap_change_percentage_24h_usd,
                updated_at: data.data.updated_at,
                source: 'coingecko'
            };

        } catch (error) {
            console.error('Error fetching CoinGecko global data:', error);
            return null;
        }
    }

    async getDefiProtocols() {
        try {
            const data = await this.makeRequest('/coins/markets', {
                vs_currency: 'usd',
                category: 'decentralized-finance-defi',
                order: 'market_cap_desc',
                per_page: 100,
                page: 1,
                sparkline: false,
                price_change_percentage: '24h,7d'
            });

            return data.map(coin => ({
                ...this.formatCoinData(coin),
                type: 'defi_protocol'
            }));

        } catch (error) {
            console.error('Error fetching CoinGecko DeFi protocols:', error);
            return [];
        }
    }

    formatCoinData(coin) {
        return {
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            image: coin.image,
            current_price: coin.current_price,
            market_cap: coin.market_cap,
            market_cap_rank: coin.market_cap_rank,
            total_volume: coin.total_volume,
            price_change_24h: coin.price_change_24h,
            price_change_percentage_24h: coin.price_change_percentage_24h,
            price_change_percentage_7d_in_currency: coin.price_change_percentage_7d_in_currency,
            circulating_supply: coin.circulating_supply,
            total_supply: coin.total_supply,
            max_supply: coin.max_supply,
            last_updated: coin.last_updated,
            source: 'coingecko'
        };
    }

    isConfigured() {
        return true; // CoinGecko works without API key (with rate limits)
    }
}

module.exports = CoinGeckoAPI;
