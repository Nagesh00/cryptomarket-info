const Sentiment = require('sentiment');
const natural = require('natural');

class SentimentAnalyzer {
    constructor() {
        this.sentiment = new Sentiment();
        this.stemmer = natural.PorterStemmer;
        
        // Custom crypto-specific sentiment words
        this.cryptoSentiment = {
            positive: {
                'moon': 5,
                'bullish': 4,
                'hodl': 3,
                'diamond hands': 5,
                'buy the dip': 3,
                'pump': 4,
                'rocket': 5,
                'lambo': 3,
                'gains': 4,
                'gem': 4,
                'undervalued': 3,
                'potential': 2,
                'innovation': 3,
                'revolutionary': 4,
                'disruptive': 3,
                'adoption': 3,
                'partnership': 3,
                'mainstream': 3,
                'utility': 2,
                'fundamentals': 2,
                'solid': 2,
                'strong': 2,
                'promising': 3,
                'breakthrough': 4,
                'game-changer': 4
            },
            negative: {
                'dump': -4,
                'bearish': -4,
                'crash': -5,
                'rug pull': -5,
                'rugpull': -5,
                'scam': -5,
                'ponzi': -5,
                'pyramid': -4,
                'paper hands': -3,
                'panic': -3,
                'fud': -3,
                'bubble': -3,
                'overvalued': -3,
                'risky': -2,
                'volatile': -2,
                'unstable': -2,
                'declining': -2,
                'falling': -2,
                'loss': -2,
                'red': -1,
                'concerning': -2,
                'warning': -2,
                'suspicious': -3,
                'fake': -4,
                'fraud': -5,
                'exit scam': -5
            }
        };

        // Add custom words to sentiment analyzer
        this.sentiment.registerLanguage('crypto', this.cryptoSentiment);
    }

    async analyze(project) {
        try {
            // Combine all text content
            const textContent = this.extractTextContent(project);
            
            if (!textContent || textContent.length < 10) {
                return 0; // Neutral score for insufficient data
            }

            // Perform sentiment analysis
            const sentimentResult = await this.performSentimentAnalysis(textContent);
            
            // Normalize score to -1 to 1 range
            const normalizedScore = this.normalizeScore(sentimentResult);

            return normalizedScore;

        } catch (error) {
            console.error('Error in sentiment analysis:', error);
            return 0; // Return neutral on error
        }
    }

    extractTextContent(project) {
        const textParts = [];

        // Project name and symbol
        if (project.name) textParts.push(project.name);
        if (project.symbol) textParts.push(project.symbol);

        // Description
        if (project.description) textParts.push(project.description);

        // Social media content
        if (project.text) textParts.push(project.text);
        if (project.content) textParts.push(project.content);
        if (project.title) textParts.push(project.title);

        // Tags and keywords
        if (project.tags && Array.isArray(project.tags)) {
            textParts.push(...project.tags);
        }
        if (project.topics && Array.isArray(project.topics)) {
            textParts.push(...project.topics);
        }
        if (project.crypto_keywords && Array.isArray(project.crypto_keywords)) {
            textParts.push(...project.crypto_keywords);
        }

        // Comments and replies (for social media posts)
        if (project.comments && Array.isArray(project.comments)) {
            project.comments.forEach(comment => {
                if (comment.body) textParts.push(comment.body);
                if (comment.text) textParts.push(comment.text);
            });
        }

        return textParts.join(' ').toLowerCase();
    }

    async performSentimentAnalysis(text) {
        // Clean and preprocess text
        const cleanedText = this.preprocessText(text);
        
        // Get base sentiment score
        const baseSentiment = this.sentiment.analyze(cleanedText);
        
        // Apply crypto-specific sentiment analysis
        const cryptoSentiment = this.analyzeCryptoSentiment(cleanedText);
        
        // Combine scores with weights
        const combinedScore = {
            score: Math.round((baseSentiment.score * 0.6) + (cryptoSentiment.score * 0.4)),
            comparative: (baseSentiment.comparative * 0.6) + (cryptoSentiment.comparative * 0.4),
            tokens: baseSentiment.tokens,
            words: [...baseSentiment.words, ...cryptoSentiment.words],
            positive: [...baseSentiment.positive, ...cryptoSentiment.positive],
            negative: [...baseSentiment.negative, ...cryptoSentiment.negative]
        };

        return combinedScore;
    }

    preprocessText(text) {
        // Remove URLs
        text = text.replace(/https?:\/\/[^\s]+/g, '');
        
        // Remove email addresses
        text = text.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '');
        
        // Remove excessive punctuation
        text = text.replace(/[!]{2,}/g, '!');
        text = text.replace(/[?]{2,}/g, '?');
        
        // Replace crypto slang with standard words
        const slangReplacements = {
            'hodl': 'hold',
            'rekt': 'wrecked',
            'btfd': 'buy the dip',
            'fomo': 'fear of missing out',
            'fud': 'fear uncertainty doubt',
            'ath': 'all time high',
            'atl': 'all time low',
            'mcap': 'market cap',
            'defi': 'decentralized finance',
            'nft': 'non fungible token',
            'dao': 'decentralized autonomous organization'
        };

        Object.entries(slangReplacements).forEach(([slang, replacement]) => {
            const regex = new RegExp(`\\b${slang}\\b`, 'gi');
            text = text.replace(regex, replacement);
        });

        return text;
    }

    analyzeCryptoSentiment(text) {
        const tokens = this.tokenize(text);
        let score = 0;
        const words = [];
        const positive = [];
        const negative = [];

        tokens.forEach(token => {
            const stemmed = this.stemmer.stem(token);
            
            // Check positive words
            if (this.cryptoSentiment.positive[token]) {
                const value = this.cryptoSentiment.positive[token];
                score += value;
                words.push(token);
                positive.push(token);
            } else if (this.cryptoSentiment.positive[stemmed]) {
                const value = this.cryptoSentiment.positive[stemmed];
                score += value;
                words.push(stemmed);
                positive.push(stemmed);
            }

            // Check negative words
            if (this.cryptoSentiment.negative[token]) {
                const value = this.cryptoSentiment.negative[token];
                score += value; // Value is already negative
                words.push(token);
                negative.push(token);
            } else if (this.cryptoSentiment.negative[stemmed]) {
                const value = this.cryptoSentiment.negative[stemmed];
                score += value; // Value is already negative
                words.push(stemmed);
                negative.push(stemmed);
            }
        });

        return {
            score,
            comparative: tokens.length > 0 ? score / tokens.length : 0,
            tokens,
            words,
            positive,
            negative
        };
    }

    tokenize(text) {
        // Simple tokenization - split by whitespace and punctuation
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 2);
    }

    normalizeScore(sentimentResult) {
        // Use comparative score for normalization
        let score = sentimentResult.comparative;

        // Apply bounds
        score = Math.max(-1, Math.min(1, score));

        // Apply crypto-specific adjustments
        if (sentimentResult.positive.length > 0 && sentimentResult.negative.length === 0) {
            score = Math.max(score, 0.1); // Ensure positive minimum
        }
        
        if (sentimentResult.negative.length > 0 && sentimentResult.positive.length === 0) {
            score = Math.min(score, -0.1); // Ensure negative maximum
        }

        return parseFloat(score.toFixed(3));
    }

    async analyzeBatch(projects) {
        try {
            const results = await Promise.all(
                projects.map(async (project) => ({
                    id: project.id || project.name,
                    sentiment: await this.analyze(project)
                }))
            );

            return results;

        } catch (error) {
            console.error('Error in batch sentiment analysis:', error);
            return projects.map(p => ({ id: p.id || p.name, sentiment: 0 }));
        }
    }

    async analyzeHistoricalTrend(textHistory) {
        try {
            if (!Array.isArray(textHistory) || textHistory.length === 0) {
                return { trend: 'neutral', confidence: 0, scores: [] };
            }

            const scores = [];
            for (const text of textHistory) {
                const result = await this.performSentimentAnalysis(text);
                scores.push(this.normalizeScore(result));
            }

            const trend = this.calculateTrend(scores);
            const confidence = this.calculateConfidence(scores);

            return {
                trend,
                confidence,
                scores,
                average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
                latest: scores[scores.length - 1] || 0
            };

        } catch (error) {
            console.error('Error in historical trend analysis:', error);
            return { trend: 'neutral', confidence: 0, scores: [] };
        }
    }

    calculateTrend(scores) {
        if (scores.length < 2) return 'neutral';

        const recentScores = scores.slice(-3); // Last 3 scores
        const olderScores = scores.slice(0, -3);

        if (olderScores.length === 0) return 'neutral';

        const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length;

        const difference = recentAvg - olderAvg;

        if (difference > 0.1) return 'improving';
        if (difference < -0.1) return 'declining';
        return 'stable';
    }

    calculateConfidence(scores) {
        if (scores.length === 0) return 0;

        // Calculate variance
        const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);

        // Lower standard deviation = higher confidence
        const confidence = Math.max(0, 1 - (stdDev * 2));
        return parseFloat(confidence.toFixed(3));
    }

    getSentimentLabel(score) {
        if (score > 0.6) return 'Very Positive';
        if (score > 0.2) return 'Positive';
        if (score > -0.2) return 'Neutral';
        if (score > -0.6) return 'Negative';
        return 'Very Negative';
    }

    getSentimentEmoji(score) {
        if (score > 0.6) return '😍';
        if (score > 0.2) return '😊';
        if (score > -0.2) return '😐';
        if (score > -0.6) return '😟';
        return '😠';
    }

    async getDetailedAnalysis(project) {
        try {
            const textContent = this.extractTextContent(project);
            
            if (!textContent) {
                return {
                    score: 0,
                    label: 'Neutral',
                    emoji: '😐',
                    confidence: 0,
                    details: 'Insufficient text data for analysis'
                };
            }

            const sentimentResult = await this.performSentimentAnalysis(textContent);
            const normalizedScore = this.normalizeScore(sentimentResult);

            return {
                score: normalizedScore,
                label: this.getSentimentLabel(normalizedScore),
                emoji: this.getSentimentEmoji(normalizedScore),
                confidence: this.calculateConfidence([normalizedScore]),
                tokens: sentimentResult.tokens.length,
                positive_words: sentimentResult.positive,
                negative_words: sentimentResult.negative,
                comparative: sentimentResult.comparative,
                raw_score: sentimentResult.score,
                details: `Analyzed ${sentimentResult.tokens.length} tokens with ${sentimentResult.positive.length} positive and ${sentimentResult.negative.length} negative indicators`
            };

        } catch (error) {
            console.error('Error in detailed sentiment analysis:', error);
            return {
                score: 0,
                label: 'Error',
                emoji: '❓',
                confidence: 0,
                details: 'Analysis failed: ' + error.message
            };
        }
    }
}

module.exports = SentimentAnalyzer;
