import * as vscode from 'vscode';
import * as WebSocket from 'ws';

export class WebSocketManager {
    private ws: WebSocket | undefined;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 5000;
    private isConnecting = false;
    private connectionUrl = '';
    private eventHandlers: Map<string, Function[]> = new Map();

    constructor(private context: vscode.ExtensionContext) {
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.eventHandlers.set('new_project', []);
        this.eventHandlers.set('connection_change', []);
        this.eventHandlers.set('error', []);
    }

    async connect(url: string): Promise<boolean> {
        if (this.isConnecting) {
            console.log('Connection already in progress');
            return false;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Already connected');
            return true;
        }

        this.connectionUrl = url;
        this.isConnecting = true;

        try {
            console.log(`🔌 Connecting to crypto monitor server at ${url}`);

            this.ws = new WebSocket(url);

            return new Promise((resolve, reject) => {
                if (!this.ws) {
                    reject(new Error('WebSocket not initialized'));
                    return;
                }

                this.ws.onopen = () => {
                    console.log('✅ Connected to crypto monitor server');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.emitConnectionChange(true);
                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onclose = (event) => {
                    console.log(`🔌 WebSocket connection closed: ${event.code} - ${event.reason}`);
                    this.isConnecting = false;
                    this.emitConnectionChange(false);
                    
                    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.isConnecting = false;
                    this.emitError(error);
                    reject(new Error('WebSocket connection failed'));
                };

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (this.isConnecting) {
                        this.isConnecting = false;
                        if (this.ws) {
                            this.ws.close();
                        }
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);
            });

        } catch (error) {
            this.isConnecting = false;
            console.error('❌ Error connecting to WebSocket:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        console.log('🔌 Disconnecting from crypto monitor server');
        
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
        
        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
            this.ws = undefined;
        }
        
        this.emitConnectionChange(false);
    }

    private handleMessage(data: string) {
        try {
            const message = JSON.parse(data);
            console.log('📨 Received message:', message.type);

            switch (message.type) {
                case 'new_project':
                    this.emitNewProject(message.data);
                    break;
                case 'trending_update':
                    this.emitTrendingUpdate(message.data);
                    break;
                case 'market_update':
                    this.emitMarketUpdate(message.data);
                    break;
                case 'ping':
                    this.sendPong();
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }

        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    }

    private sendPong() {
        if (this.isConnected()) {
            this.ws!.send(JSON.stringify({ type: 'pong' }));
        }
    }

    private scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        
        console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay / 1000}s`);
        
        setTimeout(async () => {
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                try {
                    await this.connect(this.connectionUrl);
                } catch (error) {
                    console.error('❌ Reconnection attempt failed:', error);
                }
            } else {
                console.log('❌ Max reconnection attempts reached');
                vscode.window.showErrorMessage(
                    'Lost connection to crypto monitor server. Please check your connection and restart monitoring.',
                    'Retry'
                ).then(selection => {
                    if (selection === 'Retry') {
                        this.reconnectAttempts = 0;
                        this.connect(this.connectionUrl);
                    }
                });
            }
        }, delay);
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    getConnectionStatus(): string {
        if (!this.ws) return 'disconnected';
        
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'closed';
            default: return 'unknown';
        }
    }

    // Event emitters
    private emitNewProject(project: any) {
        const handlers = this.eventHandlers.get('new_project') || [];
        handlers.forEach(handler => {
            try {
                handler(project);
            } catch (error) {
                console.error('❌ Error in new project handler:', error);
            }
        });
    }

    private emitTrendingUpdate(data: any) {
        const handlers = this.eventHandlers.get('trending_update') || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error('❌ Error in trending update handler:', error);
            }
        });
    }

    private emitMarketUpdate(data: any) {
        const handlers = this.eventHandlers.get('market_update') || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error('❌ Error in market update handler:', error);
            }
        });
    }

    private emitConnectionChange(connected: boolean) {
        const handlers = this.eventHandlers.get('connection_change') || [];
        handlers.forEach(handler => {
            try {
                handler(connected);
            } catch (error) {
                console.error('❌ Error in connection change handler:', error);
            }
        });
    }

    private emitError(error: any) {
        const handlers = this.eventHandlers.get('error') || [];
        handlers.forEach(handler => {
            try {
                handler(error);
            } catch (error) {
                console.error('❌ Error in error handler:', error);
            }
        });
    }

    // Event listeners
    onNewProject(handler: (project: any) => void) {
        const handlers = this.eventHandlers.get('new_project') || [];
        handlers.push(handler);
        this.eventHandlers.set('new_project', handlers);
    }

    onTrendingUpdate(handler: (data: any) => void) {
        const handlers = this.eventHandlers.get('trending_update') || [];
        handlers.push(handler);
        this.eventHandlers.set('trending_update', handlers);
    }

    onMarketUpdate(handler: (data: any) => void) {
        const handlers = this.eventHandlers.get('market_update') || [];
        handlers.push(handler);
        this.eventHandlers.set('market_update', handlers);
    }

    onConnectionChange(handler: (connected: boolean) => void) {
        const handlers = this.eventHandlers.get('connection_change') || [];
        handlers.push(handler);
        this.eventHandlers.set('connection_change', handlers);
    }

    onError(handler: (error: any) => void) {
        const handlers = this.eventHandlers.get('error') || [];
        handlers.push(handler);
        this.eventHandlers.set('error', handlers);
    }

    // Send custom messages to server
    sendMessage(type: string, data: any) {
        if (!this.isConnected()) {
            console.warn('⚠️ Cannot send message - not connected');
            return false;
        }

        try {
            const message = { type, data, timestamp: new Date().toISOString() };
            this.ws!.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('❌ Error sending message:', error);
            return false;
        }
    }

    // Subscribe to specific data feeds
    subscribeToFeed(feedType: string, filters?: any) {
        return this.sendMessage('subscribe', { feedType, filters });
    }

    unsubscribeFromFeed(feedType: string) {
        return this.sendMessage('unsubscribe', { feedType });
    }

    // Request historical data
    requestHistoricalData(timeframe: string, limit?: number) {
        return this.sendMessage('get_historical', { timeframe, limit });
    }

    // Send user preferences
    updatePreferences(preferences: any) {
        return this.sendMessage('update_preferences', preferences);
    }

    // Ping server
    ping() {
        return this.sendMessage('ping', {});
    }

    // Get connection statistics
    getStats(): any {
        return {
            connected: this.isConnected(),
            status: this.getConnectionStatus(),
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            connectionUrl: this.connectionUrl
        };
    }

    // Test connection
    async testConnection(url?: string): Promise<boolean> {
        const testUrl = url || this.connectionUrl;
        
        return new Promise((resolve) => {
            const testWs = new WebSocket(testUrl);
            
            const timeout = setTimeout(() => {
                testWs.close();
                resolve(false);
            }, 5000);

            testWs.onopen = () => {
                clearTimeout(timeout);
                testWs.close();
                resolve(true);
            };

            testWs.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };
        });
    }
}
