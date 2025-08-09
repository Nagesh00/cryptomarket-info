import * as vscode from 'vscode';
import { WebSocketManager } from './websocket-manager';
import { NotificationPanel } from './notification-panel';
import { CryptoTreeDataProvider } from './crypto-tree-provider';
import { StatusBarManager } from './statusbar-manager';

let wsManager: WebSocketManager | undefined;
let notificationPanel: NotificationPanel | undefined;
let cryptoTreeProvider: CryptoTreeDataProvider | undefined;
let statusBarManager: StatusBarManager | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Crypto Monitor extension is now active!');

    // Initialize components
    wsManager = new WebSocketManager(context);
    notificationPanel = new NotificationPanel(context);
    cryptoTreeProvider = new CryptoTreeDataProvider(context);
    statusBarManager = new StatusBarManager(context);

    // Register tree data provider
    vscode.window.registerTreeDataProvider('cryptoMonitorView', cryptoTreeProvider);

    // Set initial context
    vscode.commands.executeCommand('setContext', 'cryptoMonitorEnabled', true);
    vscode.commands.executeCommand('setContext', 'cryptoMonitorActive', false);

    // Register commands
    const commands = [
        vscode.commands.registerCommand('crypto-monitor.start', startMonitoring),
        vscode.commands.registerCommand('crypto-monitor.stop', stopMonitoring),
        vscode.commands.registerCommand('crypto-monitor.configure', configureSettings),
        vscode.commands.registerCommand('crypto-monitor.dashboard', openDashboard),
        vscode.commands.registerCommand('crypto-monitor.watchlist', manageWatchlist),
        vscode.commands.registerCommand('crypto-monitor.test', testNotification),
        vscode.commands.registerCommand('crypto-monitor.refresh', () => cryptoTreeProvider?.refresh()),
        vscode.commands.registerCommand('crypto-monitor.viewProject', viewProject),
        vscode.commands.registerCommand('crypto-monitor.addToWatchlist', addToWatchlist)
    ];

    context.subscriptions.push(...commands);

    // Set up event listeners
    setupEventListeners();

    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    if (config.get('autoStart')) {
        startMonitoring();
    }

    // Show welcome message
    showWelcomeMessage();
}

async function startMonitoring() {
    try {
        if (!wsManager) {
            throw new Error('WebSocket manager not initialized');
        }

        const config = vscode.workspace.getConfiguration('cryptoMonitor');
        const serverUrl = config.get<string>('serverUrl', 'ws://localhost:8080');

        await wsManager.connect(serverUrl);
        
        vscode.commands.executeCommand('setContext', 'cryptoMonitorActive', true);
        statusBarManager?.updateStatus('monitoring', 'Crypto Monitor: Active');
        
        vscode.window.showInformationMessage('🚀 Crypto monitoring started successfully!');
        
        // Show the notification panel
        notificationPanel?.show();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to start crypto monitoring: ${errorMessage}`);
        console.error('Error starting monitoring:', error);
    }
}

async function stopMonitoring() {
    try {
        if (wsManager) {
            await wsManager.disconnect();
        }
        
        vscode.commands.executeCommand('setContext', 'cryptoMonitorActive', false);
        statusBarManager?.updateStatus('idle', 'Crypto Monitor: Idle');
        
        vscode.window.showInformationMessage('🛑 Crypto monitoring stopped.');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Error stopping monitoring: ${errorMessage}`);
        console.error('Error stopping monitoring:', error);
    }
}

async function configureSettings() {
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    
    const options = [
        'Server URL',
        'Keywords',
        'Data Sources',
        'Notification Types',
        'Risk Levels',
        'Market Cap Filters',
        'Auto Start'
    ];

    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'What would you like to configure?'
    });

    switch (selection) {
        case 'Server URL':
            await configureServerUrl();
            break;
        case 'Keywords':
            await configureKeywords();
            break;
        case 'Data Sources':
            await configureSources();
            break;
        case 'Notification Types':
            await configureNotifications();
            break;
        case 'Risk Levels':
            await configureRiskLevels();
            break;
        case 'Market Cap Filters':
            await configureMarketCap();
            break;
        case 'Auto Start':
            await configureAutoStart();
            break;
    }
}

async function configureServerUrl() {
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    const currentUrl = config.get<string>('serverUrl', 'ws://localhost:8080');
    
    const newUrl = await vscode.window.showInputBox({
        prompt: 'Enter WebSocket server URL',
        value: currentUrl,
        placeHolder: 'ws://localhost:8080'
    });

    if (newUrl) {
        await config.update('serverUrl', newUrl, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Server URL updated successfully!');
    }
}

async function configureKeywords() {
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    const currentKeywords = config.get<string[]>('keywords', []);
    
    const keywordsString = await vscode.window.showInputBox({
        prompt: 'Enter keywords separated by commas',
        value: currentKeywords.join(', '),
        placeHolder: 'new crypto, new token, presale, ico, ido'
    });

    if (keywordsString) {
        const keywords = keywordsString.split(',').map(k => k.trim()).filter(k => k);
        await config.update('keywords', keywords, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Updated keywords: ${keywords.join(', ')}`);
    }
}

async function configureSources() {
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    const currentSources = config.get<string[]>('sources', []);
    
    const availableSources = [
        'coinmarketcap',
        'coingecko',
        'twitter',
        'reddit',
        'github',
        'darkweb'
    ];

    const selectedSources = await vscode.window.showQuickPick(
        availableSources.map(source => ({
            label: source,
            picked: currentSources.includes(source)
        })),
        {
            canPickMany: true,
            placeHolder: 'Select data sources to monitor'
        }
    );

    if (selectedSources) {
        const sources = selectedSources.map(item => item.label);
        await config.update('sources', sources, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Updated sources: ${sources.join(', ')}`);
    }
}

async function configureNotifications() {
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    const currentTypes = config.get<any>('notificationTypes', {});
    
    const types = [
        { key: 'popup', label: 'Popup Notifications' },
        { key: 'statusBar', label: 'Status Bar Updates' },
        { key: 'sound', label: 'Sound Alerts' }
    ];

    for (const type of types) {
        const enabled = await vscode.window.showQuickPick(
            ['Yes', 'No'],
            {
                placeHolder: `Enable ${type.label}?`
            }
        );

        if (enabled) {
            currentTypes[type.key] = enabled === 'Yes';
        }
    }

    await config.update('notificationTypes', currentTypes, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage('Notification settings updated!');
}

async function configureRiskLevels() {
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    const currentLevels = config.get<string[]>('riskLevels', []);
    
    const availableLevels = ['low', 'medium', 'high'];

    const selectedLevels = await vscode.window.showQuickPick(
        availableLevels.map(level => ({
            label: level,
            picked: currentLevels.includes(level)
        })),
        {
            canPickMany: true,
            placeHolder: 'Select risk levels to include'
        }
    );

    if (selectedLevels) {
        const levels = selectedLevels.map(item => item.label);
        await config.update('riskLevels', levels, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Updated risk levels: ${levels.join(', ')}`);
    }
}

async function configureMarketCap() {
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    
    const minCap = await vscode.window.showInputBox({
        prompt: 'Enter minimum market cap (USD)',
        value: config.get<number>('minMarketCap', 0).toString(),
        placeHolder: '0'
    });

    const maxCap = await vscode.window.showInputBox({
        prompt: 'Enter maximum market cap (USD)',
        value: config.get<number>('maxMarketCap', 100000000).toString(),
        placeHolder: '100000000'
    });

    if (minCap !== undefined) {
        await config.update('minMarketCap', parseInt(minCap), vscode.ConfigurationTarget.Global);
    }

    if (maxCap !== undefined) {
        await config.update('maxMarketCap', parseInt(maxCap), vscode.ConfigurationTarget.Global);
    }

    vscode.window.showInformationMessage('Market cap filters updated!');
}

async function configureAutoStart() {
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    
    const autoStart = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        {
            placeHolder: 'Auto-start monitoring when VS Code opens?'
        }
    );

    if (autoStart) {
        await config.update('autoStart', autoStart === 'Yes', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Auto-start ${autoStart === 'Yes' ? 'enabled' : 'disabled'}!`);
    }
}

async function openDashboard() {
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    const serverUrl = config.get<string>('serverUrl', 'ws://localhost:8080');
    const httpUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    const dashboardUrl = `${httpUrl}/dashboard`;

    const opened = await vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
    
    if (!opened) {
        vscode.window.showErrorMessage('Failed to open dashboard. Please check your server URL.');
    }
}

async function manageWatchlist() {
    const watchlistItems = cryptoTreeProvider?.getWatchlistItems() || [];
    
    if (watchlistItems.length === 0) {
        vscode.window.showInformationMessage('Your watchlist is empty. Add projects by clicking the "Add to Watchlist" button in notifications.');
        return;
    }

    const options = watchlistItems.map(item => ({
        label: `${item.name} (${item.symbol})`,
        description: `$${item.price} | ${item.source}`,
        item
    }));

    const selection = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select a project to view or remove'
    });

    if (selection) {
        const actions = ['View Details', 'Remove from Watchlist'];
        const action = await vscode.window.showQuickPick(actions, {
            placeHolder: `What would you like to do with ${selection.item.name}?`
        });

        if (action === 'View Details') {
            viewProject(selection.item);
        } else if (action === 'Remove from Watchlist') {
            cryptoTreeProvider?.removeFromWatchlist(selection.item.id);
            vscode.window.showInformationMessage(`Removed ${selection.item.name} from watchlist.`);
        }
    }
}

async function testNotification() {
    if (!wsManager?.isConnected()) {
        vscode.window.showWarningMessage('Please start monitoring first to test notifications.');
        return;
    }

    const testProject = {
        id: 'test_' + Date.now(),
        name: 'Test Crypto Project',
        symbol: 'TEST',
        price: 1.23,
        market_cap: 1000000,
        description: 'This is a test notification to verify the system is working correctly.',
        source: 'test',
        type: 'test',
        analysis: {
            sentiment_score: 0.8,
            risk_level: 'low',
            legitimacy_score: 0.9,
            recommendation: 'test'
        }
    };

    notificationPanel?.handleNewProject(testProject);
    vscode.window.showInformationMessage('🧪 Test notification sent!');
}

function viewProject(project: any) {
    const panel = vscode.window.createWebviewPanel(
        'cryptoProjectDetails',
        `${project.name} Details`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getProjectDetailsHtml(project);
}

function addToWatchlist(project: any) {
    cryptoTreeProvider?.addToWatchlist(project);
    vscode.window.showInformationMessage(`Added ${project.name} to watchlist!`);
}

function setupEventListeners() {
    if (wsManager) {
        wsManager.onNewProject((project) => {
            handleNewProject(project);
        });

        wsManager.onConnectionChange((connected) => {
            const status = connected ? 'monitoring' : 'idle';
            const message = connected ? 'Crypto Monitor: Active' : 'Crypto Monitor: Disconnected';
            statusBarManager?.updateStatus(status, message);
            
            if (!connected) {
                vscode.commands.executeCommand('setContext', 'cryptoMonitorActive', false);
            }
        });
    }
}

function handleNewProject(project: any) {
    // Filter based on user preferences
    const config = vscode.workspace.getConfiguration('cryptoMonitor');
    
    if (!shouldShowNotification(project, config)) {
        return;
    }

    // Update tree view
    cryptoTreeProvider?.addProject(project);

    // Show notification panel
    notificationPanel?.handleNewProject(project);

    // Show popup notification if enabled
    const notificationTypes = config.get<any>('notificationTypes', {});
    if (notificationTypes.popup) {
        const message = `🚀 New Crypto Project: ${project.name} (${project.symbol})`;
        vscode.window.showInformationMessage(message, 'View Details', 'Add to Watchlist')
            .then(selection => {
                if (selection === 'View Details') {
                    viewProject(project);
                } else if (selection === 'Add to Watchlist') {
                    addToWatchlist(project);
                }
            });
    }

    // Update status bar if enabled
    if (notificationTypes.statusBar) {
        statusBarManager?.showProjectNotification(project);
    }
}

function shouldShowNotification(project: any, config: vscode.WorkspaceConfiguration): boolean {
    // Check keywords
    const keywords = config.get<string[]>('keywords', []);
    if (keywords.length > 0) {
        const projectText = `${project.name} ${project.description || ''} ${project.crypto_keywords?.join(' ') || ''}`.toLowerCase();
        const hasKeyword = keywords.some(keyword => projectText.includes(keyword.toLowerCase()));
        if (!hasKeyword) return false;
    }

    // Check sources
    const sources = config.get<string[]>('sources', []);
    if (sources.length > 0 && !sources.includes(project.source)) {
        return false;
    }

    // Check risk levels
    const riskLevels = config.get<string[]>('riskLevels', []);
    if (riskLevels.length > 0 && project.analysis?.risk_level && !riskLevels.includes(project.analysis.risk_level)) {
        return false;
    }

    // Check market cap
    const minMarketCap = config.get<number>('minMarketCap', 0);
    const maxMarketCap = config.get<number>('maxMarketCap', 100000000);
    if (project.market_cap && (project.market_cap < minMarketCap || project.market_cap > maxMarketCap)) {
        return false;
    }

    return true;
}

function getProjectDetailsHtml(project: any): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} Details</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                line-height: 1.6;
            }
            .header {
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 20px;
                margin-bottom: 20px;
            }
            .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .symbol {
                color: var(--vscode-textLink-foreground);
                font-size: 18px;
            }
            .section {
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 5px;
            }
            .section-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
                color: var(--vscode-textLink-foreground);
            }
            .metric {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .metric-label {
                font-weight: bold;
            }
            .risk-low { color: #28a745; }
            .risk-medium { color: #ffc107; }
            .risk-high { color: #dc3545; }
            .recommendation {
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
                text-align: center;
                font-weight: bold;
            }
            .rec-strong_buy { background-color: #28a745; color: white; }
            .rec-buy { background-color: #17a2b8; color: white; }
            .rec-hold { background-color: #6c757d; color: white; }
            .rec-research { background-color: #ffc107; color: black; }
            .rec-avoid { background-color: #dc3545; color: white; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">${project.name}</div>
            <div class="symbol">${project.symbol || 'N/A'}</div>
        </div>

        <div class="section">
            <div class="section-title">Market Data</div>
            <div class="metric">
                <span class="metric-label">Price:</span>
                <span>$${project.price || project.current_price || 'N/A'}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Market Cap:</span>
                <span>$${formatNumber(project.market_cap || 0)}</span>
            </div>
            <div class="metric">
                <span class="metric-label">24h Volume:</span>
                <span>$${formatNumber(project.volume_24h || project.total_volume || 0)}</span>
            </div>
            <div class="metric">
                <span class="metric-label">24h Change:</span>
                <span>${(project.percent_change_24h || project.price_change_percentage_24h || 0).toFixed(2)}%</span>
            </div>
        </div>

        ${project.analysis ? `
        <div class="section">
            <div class="section-title">Analysis</div>
            <div class="metric">
                <span class="metric-label">Sentiment Score:</span>
                <span>${(project.analysis.sentiment_score * 100).toFixed(1)}%</span>
            </div>
            <div class="metric">
                <span class="metric-label">Risk Level:</span>
                <span class="risk-${project.analysis.risk_level}">${project.analysis.risk_level}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Legitimacy Score:</span>
                <span>${(project.analysis.legitimacy_score * 100).toFixed(1)}%</span>
            </div>
            ${project.analysis.recommendation ? `
            <div class="recommendation rec-${project.analysis.recommendation}">
                Recommendation: ${project.analysis.recommendation.replace(/_/g, ' ').toUpperCase()}
            </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">Details</div>
            <div class="metric">
                <span class="metric-label">Source:</span>
                <span>${project.source}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Type:</span>
                <span>${project.type?.replace(/_/g, ' ') || 'N/A'}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Detected:</span>
                <span>${new Date(project.timestamp || Date.now()).toLocaleString()}</span>
            </div>
            ${project.crypto_keywords ? `
            <div class="metric">
                <span class="metric-label">Keywords:</span>
                <span>${project.crypto_keywords.join(', ')}</span>
            </div>
            ` : ''}
        </div>

        ${project.description ? `
        <div class="section">
            <div class="section-title">Description</div>
            <p>${project.description}</p>
        </div>
        ` : ''}

        <script>
            function formatNumber(num) {
                if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
                if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
                if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
                return num.toFixed(2);
            }
        </script>
    </body>
    </html>
    `;
}

function formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function showWelcomeMessage() {
    const hasSeenWelcome = vscode.workspace.getConfiguration('cryptoMonitor').get('hasSeenWelcome', false);
    
    if (!hasSeenWelcome) {
        vscode.window.showInformationMessage(
            '🚀 Welcome to Crypto Monitor! Start monitoring to receive real-time notifications about new crypto projects.',
            'Start Monitoring',
            'Configure Settings',
            'Don\'t show again'
        ).then(selection => {
            if (selection === 'Start Monitoring') {
                startMonitoring();
            } else if (selection === 'Configure Settings') {
                configureSettings();
            } else if (selection === 'Don\'t show again') {
                vscode.workspace.getConfiguration('cryptoMonitor').update('hasSeenWelcome', true, vscode.ConfigurationTarget.Global);
            }
        });
    }
}

export function deactivate() {
    console.log('🛑 Crypto Monitor extension is being deactivated.');
    
    if (wsManager) {
        wsManager.disconnect();
    }
    
    if (notificationPanel) {
        notificationPanel.dispose();
    }
    
    if (statusBarManager) {
        statusBarManager.dispose();
    }
}
