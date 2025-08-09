const nodemailer = require('nodemailer');

class EmailNotifier {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.setupTransporter();
    }

    async initialize() {
        if (!this.isConfigured) {
            console.log('⚠️ Email notifier not configured');
            return;
        }

        try {
            // Verify the connection configuration
            await this.transporter.verify();
            console.log('✅ Email server connection verified');
        } catch (error) {
            console.error('❌ Email server connection failed:', error.message);
            throw error;
        }
    }

    setupTransporter() {
        const emailHost = process.env.EMAIL_HOST;
        const emailPort = process.env.EMAIL_PORT || 587;
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (!emailHost || !emailUser || !emailPass) {
            console.log('⚠️ Email configuration incomplete');
            return;
        }

        this.transporter = nodemailer.createTransporter({
            host: emailHost,
            port: parseInt(emailPort),
            secure: emailPort == 465, // true for 465, false for other ports
            auth: {
                user: emailUser,
                pass: emailPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        this.isConfigured = true;
    }

    async send(notification, preferences = {}) {
        if (!this.isConfigured) {
            throw new Error('Email notifier not configured');
        }

        try {
            const emailAddress = preferences.email || process.env.EMAIL_DEFAULT_RECIPIENT;
            if (!emailAddress) {
                throw new Error('No email address configured');
            }

            const mailOptions = {
                from: `"Crypto Monitor" <${process.env.EMAIL_USER}>`,
                to: emailAddress,
                subject: this.getSubject(notification),
                html: this.getHtmlContent(notification),
                text: this.getTextContent(notification)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email notification sent to ${emailAddress}`);
            return result;

        } catch (error) {
            console.error('❌ Error sending email notification:', error.message);
            throw error;
        }
    }

    getSubject(notification) {
        const data = notification.data;
        const priorityPrefix = {
            'high': '🚨 HIGH PRIORITY',
            'medium': '⚡ MEDIUM',
            'low': '📢 INFO'
        };

        const prefix = priorityPrefix[notification.priority] || '📢';
        return `${prefix}: New Crypto Project - ${data.name} (${data.symbol || 'N/A'})`;
    }

    getHtmlContent(notification) {
        const data = notification.data;
        const analysis = data.analysis || {};

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Crypto Project Alert</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; }
                .project-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
                .metrics { display: flex; justify-content: space-between; flex-wrap: wrap; margin: 15px 0; }
                .metric { background: white; padding: 10px; border-radius: 6px; margin: 5px; flex: 1; min-width: 150px; text-align: center; }
                .analysis { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .risk-low { color: #28a745; font-weight: bold; }
                .risk-medium { color: #ffc107; font-weight: bold; }
                .risk-high { color: #dc3545; font-weight: bold; }
                .recommendation { padding: 10px; border-radius: 6px; margin: 10px 0; text-align: center; font-weight: bold; }
                .rec-strong_buy { background: #28a745; color: white; }
                .rec-buy { background: #17a2b8; color: white; }
                .rec-hold { background: #6c757d; color: white; }
                .rec-research { background: #ffc107; color: black; }
                .rec-avoid { background: #dc3545; color: white; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                .btn { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 New Crypto Project Alert</h1>
                    <p>Real-time monitoring has detected a new cryptocurrency project</p>
                </div>
                
                <div class="content">
                    <div class="project-info">
                        <h2>${data.name || 'Unknown Project'}</h2>
                        <p><strong>Symbol:</strong> ${data.symbol || 'N/A'}</p>
                        <p><strong>Source:</strong> ${notification.source}</p>
                        <p><strong>Type:</strong> ${(data.type || 'unknown').replace(/_/g, ' ')}</p>
                        <p><strong>Detected:</strong> ${new Date(notification.timestamp).toLocaleString()}</p>
                    </div>

                    <div class="metrics">
                        ${data.price || data.current_price ? `
                        <div class="metric">
                            <h4>💰 Price</h4>
                            <p>$${this.formatNumber(data.price || data.current_price)}</p>
                        </div>
                        ` : ''}
                        
                        ${data.market_cap ? `
                        <div class="metric">
                            <h4>📈 Market Cap</h4>
                            <p>$${this.formatNumber(data.market_cap)}</p>
                        </div>
                        ` : ''}
                        
                        ${data.volume_24h || data.total_volume ? `
                        <div class="metric">
                            <h4>📊 24h Volume</h4>
                            <p>$${this.formatNumber(data.volume_24h || data.total_volume)}</p>
                        </div>
                        ` : ''}
                        
                        ${data.percent_change_24h || data.price_change_percentage_24h ? `
                        <div class="metric">
                            <h4>📊 24h Change</h4>
                            <p>${(data.percent_change_24h || data.price_change_percentage_24h).toFixed(2)}%</p>
                        </div>
                        ` : ''}
                    </div>

                    ${Object.keys(analysis).length > 0 ? `
                    <div class="analysis">
                        <h3>📊 Analysis Results</h3>
                        
                        ${analysis.sentiment_score !== undefined ? `
                        <p><strong>Sentiment Score:</strong> ${this.formatSentiment(analysis.sentiment_score)} (${(analysis.sentiment_score * 100).toFixed(1)}%)</p>
                        ` : ''}
                        
                        ${analysis.risk_level ? `
                        <p><strong>Risk Level:</strong> <span class="risk-${analysis.risk_level}">${analysis.risk_level.toUpperCase()}</span></p>
                        ` : ''}
                        
                        ${analysis.legitimacy_score ? `
                        <p><strong>Legitimacy Score:</strong> ${(analysis.legitimacy_score * 100).toFixed(1)}%</p>
                        ` : ''}
                        
                        ${analysis.recommendation ? `
                        <div class="recommendation rec-${analysis.recommendation}">
                            Recommendation: ${analysis.recommendation.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}

                    ${data.description ? `
                    <div class="project-info">
                        <h3>📝 Description</h3>
                        <p>${data.description}</p>
                    </div>
                    ` : ''}

                    ${data.crypto_keywords && data.crypto_keywords.length > 0 ? `
                    <div class="project-info">
                        <h3>🏷️ Keywords</h3>
                        <p>${data.crypto_keywords.join(', ')}</p>
                    </div>
                    ` : ''}

                    <div style="text-align: center; margin: 20px 0;">
                        ${data.symbol ? `
                        <a href="https://coinmarketcap.com/currencies/${data.slug || data.symbol.toLowerCase()}/" class="btn">📊 View Charts</a>
                        ` : ''}
                        
                        ${data.id ? `
                        <a href="https://www.coingecko.com/en/coins/${data.id}" class="btn">🔍 Research</a>
                        ` : ''}
                        
                        ${data.homepage || data.urls?.website?.[0] ? `
                        <a href="${data.homepage || data.urls.website[0]}" class="btn">🌐 Website</a>
                        ` : ''}
                    </div>
                </div>
                
                <div class="footer">
                    <p>This alert was generated by Crypto Project Monitor</p>
                    <p>For support, please contact your system administrator</p>
                    <p><em>Remember: Always do your own research before investing</em></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    getTextContent(notification) {
        const data = notification.data;
        const analysis = data.analysis || {};

        let content = `🚀 NEW CRYPTO PROJECT ALERT\n\n`;
        
        content += `Project: ${data.name || 'Unknown'}\n`;
        content += `Symbol: ${data.symbol || 'N/A'}\n`;
        content += `Source: ${notification.source}\n`;
        content += `Type: ${(data.type || 'unknown').replace(/_/g, ' ')}\n`;
        content += `Detected: ${new Date(notification.timestamp).toLocaleString()}\n\n`;

        if (data.price || data.current_price) {
            content += `Price: $${this.formatNumber(data.price || data.current_price)}\n`;
        }
        
        if (data.market_cap) {
            content += `Market Cap: $${this.formatNumber(data.market_cap)}\n`;
        }
        
        if (data.volume_24h || data.total_volume) {
            content += `24h Volume: $${this.formatNumber(data.volume_24h || data.total_volume)}\n`;
        }
        
        if (data.percent_change_24h || data.price_change_percentage_24h) {
            content += `24h Change: ${(data.percent_change_24h || data.price_change_percentage_24h).toFixed(2)}%\n`;
        }

        if (Object.keys(analysis).length > 0) {
            content += `\nANALYSIS:\n`;
            
            if (analysis.sentiment_score !== undefined) {
                content += `Sentiment: ${this.formatSentiment(analysis.sentiment_score)} (${(analysis.sentiment_score * 100).toFixed(1)}%)\n`;
            }
            
            if (analysis.risk_level) {
                content += `Risk Level: ${analysis.risk_level.toUpperCase()}\n`;
            }
            
            if (analysis.legitimacy_score) {
                content += `Legitimacy Score: ${(analysis.legitimacy_score * 100).toFixed(1)}%\n`;
            }
            
            if (analysis.recommendation) {
                content += `Recommendation: ${analysis.recommendation.replace(/_/g, ' ').toUpperCase()}\n`;
            }
        }

        if (data.description) {
            content += `\nDescription: ${data.description}\n`;
        }

        if (data.crypto_keywords && data.crypto_keywords.length > 0) {
            content += `\nKeywords: ${data.crypto_keywords.join(', ')}\n`;
        }

        content += `\n---\nThis alert was generated by Crypto Project Monitor\n`;
        content += `Remember: Always do your own research before investing\n`;

        return content;
    }

    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(2);
    }

    formatSentiment(score) {
        if (score > 0.7) return 'Very Positive';
        if (score > 0.3) return 'Positive';
        if (score > -0.3) return 'Neutral';
        if (score > -0.7) return 'Negative';
        return 'Very Negative';
    }

    async sendCustomEmail(to, subject, content, isHtml = false) {
        if (!this.isConfigured) {
            throw new Error('Email notifier not configured');
        }

        try {
            const mailOptions = {
                from: `"Crypto Monitor" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                [isHtml ? 'html' : 'text']: content
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Custom email sent to ${to}`);
            return result;

        } catch (error) {
            console.error('❌ Error sending custom email:', error.message);
            throw error;
        }
    }

    isConfigured() {
        return this.isConfigured;
    }
}

module.exports = EmailNotifier;
