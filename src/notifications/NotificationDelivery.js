const BullMQ = require('bullmq');
const Redis = require('redis');

const EmailNotifier = require('./channels/EmailNotifier');
const TelegramNotifier = require('./channels/TelegramNotifier');
const DiscordNotifier = require('./channels/DiscordNotifier');
const WebSocketNotifier = require('./channels/WebSocketNotifier');
const PushNotifier = require('./channels/PushNotifier');

class NotificationDelivery {
    constructor() {
        this.redis = null;
        this.notificationQueue = null;
        this.worker = null;
        
        this.channels = {
            email: new EmailNotifier(),
            telegram: new TelegramNotifier(),
            discord: new DiscordNotifier(),
            websocket: new WebSocketNotifier(),
            push: new PushNotifier()
        };

        this.deliveryStats = {
            sent: 0,
            failed: 0,
            pending: 0,
            channels: {}
        };
    }

    async initialize() {
        try {
            // Initialize Redis connection
            this.redis = Redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            await this.redis.connect();
            console.log('✅ Redis connected for notifications');

            // Initialize notification queue
            this.notificationQueue = new BullMQ.Queue('crypto-notifications', {
                connection: this.redis
            });

            // Initialize worker to process notifications
            this.worker = new BullMQ.Worker('crypto-notifications', 
                async (job) => await this.processNotification(job),
                {
                    connection: this.redis,
                    concurrency: 5 // Process up to 5 notifications concurrently
                }
            );

            // Initialize notification channels
            await this.initializeChannels();

            // Set up event listeners
            this.setupEventListeners();

            console.log('✅ Notification delivery system initialized');

        } catch (error) {
            console.error('❌ Failed to initialize notification delivery:', error);
            throw error;
        }
    }

    async initializeChannels() {
        for (const [channelName, channel] of Object.entries(this.channels)) {
            try {
                if (channel.initialize) {
                    await channel.initialize();
                }
                this.deliveryStats.channels[channelName] = {
                    sent: 0,
                    failed: 0,
                    configured: channel.isConfigured()
                };
            } catch (error) {
                console.error(`❌ Failed to initialize ${channelName} channel:`, error);
                this.deliveryStats.channels[channelName] = {
                    sent: 0,
                    failed: 0,
                    configured: false,
                    error: error.message
                };
            }
        }
    }

    setupEventListeners() {
        this.worker.on('completed', (job) => {
            this.deliveryStats.sent++;
            console.log(`✅ Notification ${job.id} delivered successfully`);
        });

        this.worker.on('failed', (job, err) => {
            this.deliveryStats.failed++;
            console.error(`❌ Notification ${job.id} failed:`, err.message);
        });

        this.worker.on('error', (err) => {
            console.error('❌ Notification worker error:', err);
        });

        this.notificationQueue.on('error', (err) => {
            console.error('❌ Notification queue error:', err);
        });
    }

    async deliver(notification, userPreferences = null) {
        try {
            // Add notification to queue for processing
            const job = await this.notificationQueue.add('deliver-notification', {
                notification,
                userPreferences
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                },
                delay: notification.priority === 'high' ? 0 : 5000 // High priority notifications are sent immediately
            });

            this.deliveryStats.pending++;
            
            console.log(`📋 Notification queued for delivery: ${job.id}`);
            return job.id;

        } catch (error) {
            console.error('❌ Error queuing notification:', error);
            throw error;
        }
    }

    async processNotification(job) {
        const { notification, userPreferences } = job.data;
        
        try {
            console.log(`🔄 Processing notification: ${notification.id}`);

            // Get user preferences (if not provided, use defaults)
            const preferences = userPreferences || await this.getDefaultPreferences();

            // Determine which channels to use
            const channelsToUse = this.determineChannels(notification, preferences);

            // Send notification through selected channels
            const deliveryPromises = channelsToUse.map(async (channelName) => {
                try {
                    const channel = this.channels[channelName];
                    if (channel && channel.isConfigured()) {
                        await channel.send(notification, preferences);
                        this.deliveryStats.channels[channelName].sent++;
                        return { channel: channelName, status: 'success' };
                    } else {
                        console.warn(`⚠️ Channel ${channelName} not configured`);
                        return { channel: channelName, status: 'not_configured' };
                    }
                } catch (error) {
                    console.error(`❌ Error sending via ${channelName}:`, error);
                    this.deliveryStats.channels[channelName].failed++;
                    return { channel: channelName, status: 'failed', error: error.message };
                }
            });

            const results = await Promise.allSettled(deliveryPromises);
            
            // Log results
            const successCount = results.filter(r => r.value?.status === 'success').length;
            const failedCount = results.filter(r => r.value?.status === 'failed').length;

            console.log(`📊 Notification ${notification.id} delivery: ${successCount} succeeded, ${failedCount} failed`);

            // Store delivery record
            await this.storeDeliveryRecord(notification, results);

            this.deliveryStats.pending--;

        } catch (error) {
            console.error(`❌ Error processing notification ${notification.id}:`, error);
            throw error;
        }
    }

    determineChannels(notification, preferences) {
        const channels = [];

        // Always send via WebSocket for real-time updates
        channels.push('websocket');

        // Determine other channels based on priority and preferences
        if (notification.priority === 'high') {
            // High priority: send via all configured channels
            if (preferences.email && this.channels.email.isConfigured()) {
                channels.push('email');
            }
            if (preferences.telegram && this.channels.telegram.isConfigured()) {
                channels.push('telegram');
            }
            if (preferences.discord && this.channels.discord.isConfigured()) {
                channels.push('discord');
            }
            if (preferences.push && this.channels.push.isConfigured()) {
                channels.push('push');
            }
        } else if (notification.priority === 'medium') {
            // Medium priority: send via preferred channels
            if (preferences.emailMedium && this.channels.email.isConfigured()) {
                channels.push('email');
            }
            if (preferences.telegramMedium && this.channels.telegram.isConfigured()) {
                channels.push('telegram');
            }
        }
        // Low priority: only WebSocket (already added)

        // Check keyword filters
        if (preferences.keywords && preferences.keywords.length > 0) {
            const notificationText = JSON.stringify(notification.data).toLowerCase();
            const hasMatchingKeyword = preferences.keywords.some(keyword => 
                notificationText.includes(keyword.toLowerCase())
            );

            if (hasMatchingKeyword) {
                // Add additional channels for keyword matches
                if (!channels.includes('email') && this.channels.email.isConfigured()) {
                    channels.push('email');
                }
                if (!channels.includes('telegram') && this.channels.telegram.isConfigured()) {
                    channels.push('telegram');
                }
            }
        }

        return [...new Set(channels)]; // Remove duplicates
    }

    async getDefaultPreferences() {
        return {
            email: true,
            telegram: true,
            discord: false,
            push: false,
            emailMedium: false,
            telegramMedium: true,
            keywords: ['new', 'launch', 'presale', 'ico', 'ido'],
            minPrice: 0,
            maxPrice: 1000000,
            minMarketCap: 0,
            maxMarketCap: 100000000,
            sources: ['coinmarketcap', 'coingecko', 'twitter', 'reddit', 'github'],
            riskLevels: ['low', 'medium', 'high']
        };
    }

    async storeDeliveryRecord(notification, results) {
        try {
            const record = {
                notification_id: notification.id,
                timestamp: new Date(),
                channels_used: results.map(r => r.value),
                success_count: results.filter(r => r.value?.status === 'success').length,
                failure_count: results.filter(r => r.value?.status === 'failed').length
            };

            // Store in Redis with expiration (7 days)
            await this.redis.setEx(
                `delivery:${notification.id}`, 
                7 * 24 * 60 * 60, 
                JSON.stringify(record)
            );

        } catch (error) {
            console.error('❌ Error storing delivery record:', error);
        }
    }

    async getDeliveryStats() {
        try {
            const queueStats = await this.notificationQueue.getWaiting();
            this.deliveryStats.pending = queueStats.length;

            return {
                ...this.deliveryStats,
                queue_size: queueStats.length,
                worker_status: this.worker ? 'running' : 'stopped',
                channels_configured: Object.keys(this.deliveryStats.channels)
                    .filter(ch => this.deliveryStats.channels[ch].configured).length
            };

        } catch (error) {
            console.error('❌ Error getting delivery stats:', error);
            return this.deliveryStats;
        }
    }

    async testNotification() {
        try {
            const testNotification = {
                id: `test_${Date.now()}`,
                timestamp: new Date(),
                source: 'system',
                type: 'test',
                data: {
                    name: 'Test Crypto Project',
                    symbol: 'TEST',
                    price: 1.23,
                    market_cap: 1000000,
                    description: 'This is a test notification to verify the system is working correctly.',
                    analysis: {
                        sentiment_score: 0.8,
                        risk_level: 'low',
                        legitimacy_score: 0.9,
                        recommendation: 'test'
                    }
                },
                priority: 'medium',
                channels: ['websocket', 'email', 'telegram']
            };

            await this.deliver(testNotification);
            console.log('✅ Test notification sent');
            return true;

        } catch (error) {
            console.error('❌ Error sending test notification:', error);
            return false;
        }
    }

    async shutdown() {
        try {
            console.log('🛑 Shutting down notification delivery system...');

            if (this.worker) {
                await this.worker.close();
                console.log('✅ Notification worker closed');
            }

            if (this.notificationQueue) {
                await this.notificationQueue.close();
                console.log('✅ Notification queue closed');
            }

            if (this.redis) {
                await this.redis.disconnect();
                console.log('✅ Redis disconnected');
            }

            console.log('✅ Notification delivery system shutdown complete');

        } catch (error) {
            console.error('❌ Error shutting down notification delivery:', error);
        }
    }

    // Utility methods for managing notifications
    async getPendingNotifications() {
        try {
            const waiting = await this.notificationQueue.getWaiting();
            const delayed = await this.notificationQueue.getDelayed();
            return { waiting, delayed };
        } catch (error) {
            console.error('❌ Error getting pending notifications:', error);
            return { waiting: [], delayed: [] };
        }
    }

    async cancelNotification(jobId) {
        try {
            const job = await this.notificationQueue.getJob(jobId);
            if (job) {
                await job.remove();
                console.log(`✅ Notification ${jobId} cancelled`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`❌ Error cancelling notification ${jobId}:`, error);
            return false;
        }
    }

    async retryFailedNotifications() {
        try {
            const failed = await this.notificationQueue.getFailed();
            let retryCount = 0;

            for (const job of failed) {
                try {
                    await job.retry();
                    retryCount++;
                } catch (error) {
                    console.error(`❌ Error retrying job ${job.id}:`, error);
                }
            }

            console.log(`✅ Retried ${retryCount} failed notifications`);
            return retryCount;

        } catch (error) {
            console.error('❌ Error retrying failed notifications:', error);
            return 0;
        }
    }
}

module.exports = NotificationDelivery;
