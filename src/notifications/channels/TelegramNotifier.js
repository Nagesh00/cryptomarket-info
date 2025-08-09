const axios = require('axios');

class TelegramNotifier {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.baseURL = 'https://api.telegram.org/bot';
        this.defaultChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID;
        this.maxMessageLength = 4096;
    }

    async initialize() {
        if (!this.isConfigured()) {
            console.log('⚠️ Telegram notifier not configured');
            return;
        }

        try {
            // Test the bot token by getting bot info
            const response = await axios.get(`${this.baseURL}${this.botToken}/getMe`);
            console.log(`✅ Telegram bot connected: @${response.data.result.username}`);
        } catch (error) {
            console.error('❌ Telegram bot connection failed:', error.message);
            throw error;
        }
    }

    async send(notification, preferences = {}) {
        if (!this.isConfigured()) {
            throw new Error('Telegram notifier not configured');
        }

        try {
            const chatId = preferences.telegramChatId || this.defaultChatId;
            if (!chatId) {
                throw new Error('No Telegram chat ID configured');
            }

            const message = this.formatMessage(notification);
            const keyboard = this.createInlineKeyboard(notification);

            const payload = {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: false
            };

            if (keyboard) {
                payload.reply_markup = { inline_keyboard: keyboard };
            }

            const response = await axios.post(
                `${this.baseURL}${this.botToken}/sendMessage`,
                payload
            );

            console.log(`✅ Telegram notification sent to chat ${chatId}`);
            return response.data;

        } catch (error) {
            console.error('❌ Error sending Telegram notification:', error.message);
            throw error;
        }
    }

    formatMessage(notification) {
        const data = notification.data;
        const analysis = data.analysis || {};
        
        let message = '';

        // Header with emoji based on priority
        const priorityEmoji = {
            'high': '🚨',
            'medium': '⚡',
            'low': '📢'
        };

        message += `${priorityEmoji[notification.priority] || '📢'} <b>New Crypto Project Alert!</b>\n\n`;

        // Basic project info
        message += `📊 <b>${data.name || 'Unknown'}</b>`;
        if (data.symbol) {
            message += ` (${data.symbol})`;
        }
        message += '\n';

        // Price and market data
        if (data.price || data.current_price) {
            const price = data.price || data.current_price;
            message += `💰 <b>Price:</b> $${this.formatNumber(price)}\n`;
        }

        if (data.market_cap) {
            message += `📈 <b>Market Cap:</b> $${this.formatNumber(data.market_cap)}\n`;
        }

        if (data.volume_24h || data.total_volume) {
            const volume = data.volume_24h || data.total_volume;
            message += `📊 <b>24h Volume:</b> $${this.formatNumber(volume)}\n`;
        }

        // Price changes
        if (data.percent_change_24h || data.price_change_percentage_24h) {
            const change = data.percent_change_24h || data.price_change_percentage_24h;
            const changeEmoji = change >= 0 ? '📈' : '📉';
            message += `${changeEmoji} <b>24h Change:</b> ${change.toFixed(2)}%\n`;
        }

        message += '\n';

        // Source and type
        message += `🔍 <b>Source:</b> ${notification.source}\n`;
        if (data.type) {
            message += `📋 <b>Type:</b> ${data.type.replace(/_/g, ' ')}\n`;
        }

        // Analysis results
        if (analysis.sentiment_score !== undefined) {
            const sentimentEmoji = this.getSentimentEmoji(analysis.sentiment_score);
            message += `${sentimentEmoji} <b>Sentiment:</b> ${this.formatSentiment(analysis.sentiment_score)}\n`;
        }

        if (analysis.risk_level) {
            const riskEmoji = this.getRiskEmoji(analysis.risk_level);
            message += `${riskEmoji} <b>Risk Level:</b> ${analysis.risk_level}\n`;
        }

        if (analysis.legitimacy_score) {
            const legScore = Math.round(analysis.legitimacy_score * 100);
            message += `🎯 <b>Legitimacy Score:</b> ${legScore}%\n`;
        }

        if (analysis.recommendation) {
            const recEmoji = this.getRecommendationEmoji(analysis.recommendation);
            message += `${recEmoji} <b>Recommendation:</b> ${analysis.recommendation.replace(/_/g, ' ')}\n`;
        }

        message += '\n';

        // Description (truncated if too long)
        if (data.description) {
            let desc = data.description;
            if (desc.length > 200) {
                desc = desc.substring(0, 200) + '...';
            }
            message += `📝 <b>Description:</b> ${desc}\n\n`;
        }

        // Crypto keywords if any
        if (data.crypto_keywords && data.crypto_keywords.length > 0) {
            message += `🏷️ <b>Keywords:</b> ${data.crypto_keywords.slice(0, 5).join(', ')}\n`;
        }

        // Timestamp
        message += `⏰ <b>Detected:</b> ${new Date(notification.timestamp).toLocaleString()}\n`;

        // Ensure message doesn't exceed Telegram's limit
        if (message.length > this.maxMessageLength) {
            message = message.substring(0, this.maxMessageLength - 100) + '\n\n... (truncated)';
        }

        return message;
    }

    createInlineKeyboard(notification) {
        const data = notification.data;
        const keyboard = [];

        // First row: View charts and research
        const firstRow = [];

        if (data.symbol) {
            firstRow.push({
                text: '📊 View Charts',
                url: `https://coinmarketcap.com/currencies/${data.slug || data.symbol.toLowerCase()}/`
            });
        }

        if (data.id) {
            firstRow.push({
                text: '🔍 Research',
                url: `https://www.coingecko.com/en/coins/${data.id}`
            });
        }

        if (firstRow.length > 0) {
            keyboard.push(firstRow);
        }

        // Second row: Additional links
        const secondRow = [];

        if (data.homepage || data.urls?.website?.[0]) {
            const website = data.homepage || data.urls.website[0];
            secondRow.push({
                text: '🌐 Website',
                url: website
            });
        }

        if (data.twitter_username || data.urls?.twitter?.[0]) {
            const twitter = data.twitter_username 
                ? `https://twitter.com/${data.twitter_username}`
                : data.urls.twitter[0];
            secondRow.push({
                text: '🐦 Twitter',
                url: twitter
            });
        }

        if (secondRow.length > 0) {
            keyboard.push(secondRow);
        }

        // Third row: Actions
        const thirdRow = [
            {
                text: '⭐ Add to Watchlist',
                callback_data: `watchlist_add_${data.id || data.symbol}`
            },
            {
                text: '📊 Get Analysis',
                callback_data: `analysis_${data.id || data.symbol}`
            }
        ];

        keyboard.push(thirdRow);

        return keyboard.length > 0 ? keyboard : null;
    }

    getSentimentEmoji(score) {
        if (score > 0.5) return '😊';
        if (score > 0) return '😐';
        return '😞';
    }

    getRiskEmoji(level) {
        switch (level) {
            case 'low': return '🟢';
            case 'medium': return '🟡';
            case 'high': return '🔴';
            default: return '⚪';
        }
    }

    getRecommendationEmoji(recommendation) {
        switch (recommendation) {
            case 'strong_buy': return '🚀';
            case 'buy': return '📈';
            case 'hold': return '✋';
            case 'research': return '🔍';
            case 'avoid': return '⛔';
            default: return '❓';
        }
    }

    formatSentiment(score) {
        if (score > 0.7) return 'Very Positive';
        if (score > 0.3) return 'Positive';
        if (score > -0.3) return 'Neutral';
        if (score > -0.7) return 'Negative';
        return 'Very Negative';
    }

    formatNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        }
        if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        }
        if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toFixed(2);
    }

    async sendCustomMessage(chatId, message, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('Telegram notifier not configured');
        }

        try {
            const payload = {
                chat_id: chatId,
                text: message,
                parse_mode: options.parseMode || 'HTML',
                ...options
            };

            const response = await axios.post(
                `${this.baseURL}${this.botToken}/sendMessage`,
                payload
            );

            return response.data;

        } catch (error) {
            console.error('❌ Error sending custom Telegram message:', error.message);
            throw error;
        }
    }

    async sendPhoto(chatId, photoUrl, caption = '', options = {}) {
        if (!this.isConfigured()) {
            throw new Error('Telegram notifier not configured');
        }

        try {
            const payload = {
                chat_id: chatId,
                photo: photoUrl,
                caption: caption,
                parse_mode: 'HTML',
                ...options
            };

            const response = await axios.post(
                `${this.baseURL}${this.botToken}/sendPhoto`,
                payload
            );

            return response.data;

        } catch (error) {
            console.error('❌ Error sending Telegram photo:', error.message);
            throw error;
        }
    }

    async handleCallback(callbackQuery) {
        try {
            const data = callbackQuery.data;
            const chatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id;

            if (data.startsWith('watchlist_add_')) {
                const symbol = data.replace('watchlist_add_', '');
                await this.sendCustomMessage(chatId, `✅ Added ${symbol} to your watchlist!`);
            } else if (data.startsWith('analysis_')) {
                const symbol = data.replace('analysis_', '');
                await this.sendCustomMessage(chatId, `📊 Fetching detailed analysis for ${symbol}...`);
            }

            // Answer the callback query to remove the loading state
            await axios.post(
                `${this.baseURL}${this.botToken}/answerCallbackQuery`,
                { callback_query_id: callbackQuery.id }
            );

        } catch (error) {
            console.error('❌ Error handling Telegram callback:', error.message);
        }
    }

    async getBotInfo() {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            const response = await axios.get(`${this.baseURL}${this.botToken}/getMe`);
            return response.data.result;
        } catch (error) {
            console.error('❌ Error getting Telegram bot info:', error.message);
            return null;
        }
    }

    isConfigured() {
        return !!(this.botToken && 
                 this.botToken !== 'your_telegram_bot_token_here' &&
                 this.botToken.length > 10);
    }
}

module.exports = TelegramNotifier;
