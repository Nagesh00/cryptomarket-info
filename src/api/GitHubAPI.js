const axios = require('axios');

class GitHubAPI {
    constructor(token) {
        this.token = token;
        this.baseURL = 'https://api.github.com';
        this.rateLimitDelay = 1000; // 1 second between requests for authenticated requests
        this.lastRequestTime = 0;
        
        this.cryptoKeywords = [
            'cryptocurrency', 'blockchain', 'bitcoin', 'ethereum', 'defi',
            'smart-contract', 'token', 'coin', 'crypto', 'web3',
            'solidity', 'erc20', 'erc721', 'nft', 'dao',
            'dapp', 'decentralized', 'consensus', 'mining', 'staking'
        ];
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
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'CryptoMonitor/1.0.0'
            };

            if (this.token) {
                headers['Authorization'] = `token ${this.token}`;
            }

            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                headers,
                params,
                timeout: 15000
            });

            this.lastRequestTime = Date.now();
            
            // Check rate limit headers
            const remaining = response.headers['x-ratelimit-remaining'];
            const reset = response.headers['x-ratelimit-reset'];
            
            if (remaining && parseInt(remaining) < 10) {
                const resetTime = parseInt(reset) * 1000;
                const waitTime = resetTime - Date.now() + 1000;
                if (waitTime > 0) {
                    console.log(`GitHub rate limit low. Waiting ${waitTime / 1000} seconds.`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }

            return response.data;

        } catch (error) {
            console.error(`GitHub API Error for ${endpoint}:`, error.message);
            
            if (error.response?.status === 403) {
                const resetTime = error.response.headers['x-ratelimit-reset'];
                if (resetTime) {
                    const waitTime = (parseInt(resetTime) * 1000) - Date.now() + 1000;
                    console.log(`GitHub rate limit exceeded. Waiting ${waitTime / 1000} seconds.`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                throw new Error('Rate limit exceeded');
            }

            if (error.response?.status === 401) {
                throw new Error('GitHub authentication failed');
            }
            
            throw error;
        }
    }

    async searchRepositories(query, sort = 'updated', order = 'desc', perPage = 30) {
        try {
            const params = {
                q: query,
                sort,
                order,
                per_page: Math.min(perPage, 100)
            };

            const data = await this.makeRequest('/search/repositories', params);
            
            if (!data.items) {
                return [];
            }

            const repositories = data.items.map(repo => this.formatRepositoryData(repo));
            
            // Filter for crypto-related repositories
            return repositories.filter(repo => this.isCryptoRelated(repo));

        } catch (error) {
            console.error('Error searching GitHub repositories:', error);
            return [];
        }
    }

    async getNewCryptoRepositories() {
        try {
            const today = new Date();
            const threeDaysAgo = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000));
            const dateString = threeDaysAgo.toISOString().split('T')[0];

            const queries = [
                `cryptocurrency created:>=${dateString}`,
                `blockchain created:>=${dateString}`,
                `defi created:>=${dateString}`,
                `smart-contract created:>=${dateString}`,
                `token created:>=${dateString}`,
                `ethereum created:>=${dateString}`,
                `solidity created:>=${dateString}`,
                `web3 created:>=${dateString}`
            ];

            const allRepos = [];

            for (const query of queries) {
                try {
                    const repos = await this.searchRepositories(query, 'created', 'desc', 50);
                    allRepos.push(...repos);

                    // Rate limiting between queries
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`Error searching for "${query}":`, error.message);
                    continue;
                }
            }

            // Remove duplicates and sort by creation date
            const uniqueRepos = this.removeDuplicates(allRepos);
            return uniqueRepos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        } catch (error) {
            console.error('Error fetching new crypto repositories:', error);
            return [];
        }
    }

    async getTrendingCryptoRepositories() {
        try {
            const today = new Date();
            const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
            const dateString = oneWeekAgo.toISOString().split('T')[0];

            const queries = [
                `cryptocurrency created:>=${dateString}`,
                `blockchain stars:>5 created:>=${dateString}`,
                `defi stars:>10 created:>=${dateString}`,
                `ethereum stars:>5 created:>=${dateString}`
            ];

            const allRepos = [];

            for (const query of queries) {
                try {
                    const repos = await this.searchRepositories(query, 'stars', 'desc', 30);
                    allRepos.push(...repos.map(repo => ({
                        ...repo,
                        type: 'trending_crypto_repo'
                    })));

                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`Error searching trending for "${query}":`, error.message);
                    continue;
                }
            }

            return this.removeDuplicates(allRepos);

        } catch (error) {
            console.error('Error fetching trending crypto repositories:', error);
            return [];
        }
    }

    async getRepositoryDetails(owner, repo) {
        try {
            const [repoData, languages, contributors, releases] = await Promise.all([
                this.makeRequest(`/repos/${owner}/${repo}`),
                this.makeRequest(`/repos/${owner}/${repo}/languages`).catch(() => ({})),
                this.makeRequest(`/repos/${owner}/${repo}/contributors`, { per_page: 10 }).catch(() => []),
                this.makeRequest(`/repos/${owner}/${repo}/releases`, { per_page: 5 }).catch(() => [])
            ]);

            return {
                ...this.formatRepositoryData(repoData),
                languages,
                contributors: contributors.slice(0, 10),
                recent_releases: releases.slice(0, 5),
                analysis: await this.analyzeRepository(repoData, languages)
            };

        } catch (error) {
            console.error(`Error fetching repository details for ${owner}/${repo}:`, error);
            return null;
        }
    }

    async analyzeRepository(repoData, languages = {}) {
        try {
            const analysis = {
                legitimacy_score: 0,
                crypto_relevance: 0,
                development_activity: 0,
                community_engagement: 0,
                risk_factors: [],
                positive_indicators: []
            };

            // Calculate legitimacy score based on various factors
            if (repoData.stargazers_count > 50) analysis.legitimacy_score += 0.2;
            if (repoData.forks_count > 10) analysis.legitimacy_score += 0.2;
            if (repoData.open_issues_count < repoData.stargazers_count * 0.1) analysis.legitimacy_score += 0.1;
            if (repoData.description && repoData.description.length > 50) analysis.legitimacy_score += 0.1;
            if (repoData.homepage) analysis.legitimacy_score += 0.1;
            if (repoData.license) analysis.legitimacy_score += 0.1;
            if (!repoData.archived && !repoData.disabled) analysis.legitimacy_score += 0.2;

            // Crypto relevance
            const cryptoKeywordCount = this.countCryptoKeywords(
                `${repoData.name} ${repoData.description || ''} ${repoData.topics?.join(' ') || ''}`
            );
            analysis.crypto_relevance = Math.min(1, cryptoKeywordCount / 3);

            // Development activity
            const daysSinceUpdate = (Date.now() - new Date(repoData.updated_at)) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 7) analysis.development_activity = 1;
            else if (daysSinceUpdate < 30) analysis.development_activity = 0.7;
            else if (daysSinceUpdate < 90) analysis.development_activity = 0.4;
            else analysis.development_activity = 0.1;

            // Community engagement
            const engagement = repoData.stargazers_count + (repoData.forks_count * 2) + (repoData.watchers_count * 0.5);
            analysis.community_engagement = Math.min(1, Math.log10(engagement + 1) / 3);

            // Risk factors
            if (repoData.stargazers_count === 0) analysis.risk_factors.push('No stars');
            if (repoData.forks_count === 0) analysis.risk_factors.push('No forks');
            if (!repoData.description) analysis.risk_factors.push('No description');
            if (!repoData.license) analysis.risk_factors.push('No license');
            if (daysSinceUpdate > 180) analysis.risk_factors.push('Inactive development');

            // Positive indicators
            if (repoData.stargazers_count > 100) analysis.positive_indicators.push('Popular repository');
            if (repoData.forks_count > 20) analysis.positive_indicators.push('Active community');
            if (repoData.license) analysis.positive_indicators.push('Open source license');
            if (repoData.homepage) analysis.positive_indicators.push('Has website');
            if (languages.Solidity) analysis.positive_indicators.push('Solidity smart contracts');
            if (languages.JavaScript || languages.TypeScript) analysis.positive_indicators.push('Web3 development');

            return analysis;

        } catch (error) {
            console.error('Error analyzing repository:', error);
            return {
                legitimacy_score: 0.5,
                crypto_relevance: 0,
                development_activity: 0,
                community_engagement: 0,
                risk_factors: ['Analysis failed'],
                positive_indicators: []
            };
        }
    }

    formatRepositoryData(repo) {
        return {
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            owner: {
                login: repo.owner.login,
                id: repo.owner.id,
                avatar_url: repo.owner.avatar_url,
                type: repo.owner.type
            },
            description: repo.description,
            url: repo.html_url,
            homepage: repo.homepage,
            language: repo.language,
            languages_url: repo.languages_url,
            stargazers_count: repo.stargazers_count,
            watchers_count: repo.watchers_count,
            forks_count: repo.forks_count,
            open_issues_count: repo.open_issues_count,
            license: repo.license,
            topics: repo.topics || [],
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            pushed_at: repo.pushed_at,
            size: repo.size,
            archived: repo.archived,
            disabled: repo.disabled,
            private: repo.private,
            fork: repo.fork,
            default_branch: repo.default_branch,
            crypto_keywords: this.extractCryptoKeywords(
                `${repo.name} ${repo.description || ''} ${repo.topics?.join(' ') || ''}`
            ),
            source: 'github',
            type: 'repository'
        };
    }

    isCryptoRelated(repo) {
        const text = `${repo.name} ${repo.description || ''} ${repo.topics?.join(' ') || ''} ${repo.language || ''}`.toLowerCase();
        
        return this.cryptoKeywords.some(keyword => text.includes(keyword.toLowerCase())) ||
               repo.topics?.some(topic => this.cryptoKeywords.includes(topic.toLowerCase()));
    }

    extractCryptoKeywords(text) {
        const lowercaseText = text.toLowerCase();
        return this.cryptoKeywords.filter(keyword => 
            lowercaseText.includes(keyword.toLowerCase())
        );
    }

    countCryptoKeywords(text) {
        const lowercaseText = text.toLowerCase();
        return this.cryptoKeywords.reduce((count, keyword) => {
            return count + (lowercaseText.includes(keyword.toLowerCase()) ? 1 : 0);
        }, 0);
    }

    removeDuplicates(repos) {
        const seen = new Set();
        return repos.filter(repo => {
            if (seen.has(repo.id)) {
                return false;
            }
            seen.add(repo.id);
            return true;
        });
    }

    async getRepositoryReadme(owner, repo) {
        try {
            const data = await this.makeRequest(`/repos/${owner}/${repo}/readme`);
            
            if (data.content) {
                const content = Buffer.from(data.content, 'base64').toString('utf-8');
                return {
                    content,
                    encoding: data.encoding,
                    size: data.size,
                    crypto_mentions: this.extractCryptoKeywords(content),
                    has_roadmap: content.toLowerCase().includes('roadmap'),
                    has_tokenomics: content.toLowerCase().includes('tokenomics'),
                    has_whitepaper: content.toLowerCase().includes('whitepaper')
                };
            }

            return null;

        } catch (error) {
            console.error(`Error fetching README for ${owner}/${repo}:`, error);
            return null;
        }
    }

    async monitorUserActivity(username) {
        try {
            const [user, repos, events] = await Promise.all([
                this.makeRequest(`/users/${username}`),
                this.makeRequest(`/users/${username}/repos`, { 
                    sort: 'updated', 
                    per_page: 10 
                }),
                this.makeRequest(`/users/${username}/events/public`, { 
                    per_page: 30 
                })
            ]);

            const cryptoRepos = repos.filter(repo => this.isCryptoRelated(this.formatRepositoryData(repo)));
            const cryptoEvents = events.filter(event => 
                event.repo && this.isCryptoRelated({ 
                    name: event.repo.name, 
                    description: '' 
                })
            );

            return {
                user,
                crypto_repositories: cryptoRepos,
                recent_crypto_activity: cryptoEvents,
                crypto_activity_score: this.calculateCryptoActivityScore(cryptoRepos, cryptoEvents)
            };

        } catch (error) {
            console.error(`Error monitoring user activity for ${username}:`, error);
            return null;
        }
    }

    calculateCryptoActivityScore(repos, events) {
        const repoScore = repos.length * 10;
        const eventScore = events.length * 2;
        const recentActivity = events.filter(event => {
            const eventDate = new Date(event.created_at);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return eventDate > sevenDaysAgo;
        }).length * 5;

        return Math.min(100, repoScore + eventScore + recentActivity);
    }

    isConfigured() {
        return !!(this.token && this.token !== 'your_github_token_here');
    }
}

module.exports = GitHubAPI;
