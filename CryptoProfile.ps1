# Enhanced PowerShell Profile for Crypto Monitor with Shell Integration
# This script automatically loads when PowerShell starts

# Set console properties
$Host.UI.RawUI.WindowTitle = "🚀 Crypto Monitor PowerShell - Enhanced Shell"
$Host.UI.RawUI.BackgroundColor = "DarkBlue"

# Load shell integration first
$shellIntegrationFile = Join-Path $PSScriptRoot "CryptoShellIntegration.ps1"
if (Test-Path $shellIntegrationFile) {
    . $shellIntegrationFile
    Write-Host "✅ Shell integration loaded" -ForegroundColor Green
} else {
    Write-Warning "⚠️ Shell integration not found at: $shellIntegrationFile"
}

# Import the Crypto Monitor module
$moduleFile = Join-Path $PSScriptRoot "CryptoMonitor.psm1"
if (Test-Path $moduleFile) {
    Import-Module $moduleFile -Force
    Write-Host "✅ Crypto Monitor module loaded successfully!" -ForegroundColor Green
} else {
    Write-Warning "⚠️ Crypto Monitor module not found at: $moduleFile"
}

# Import advanced analysis module
$analysisModuleFile = Join-Path $PSScriptRoot "CryptoAnalysis.psm1"
if (Test-Path $analysisModuleFile) {
    Import-Module $analysisModuleFile -Force
    Write-Host "✅ Crypto Analysis module loaded" -ForegroundColor Green
}

# Import advanced command detection module
$commandDetectionModuleFile = Join-Path $PSScriptRoot "CryptoCommandDetection.psm1"
if (Test-Path $commandDetectionModuleFile) {
    Import-Module $commandDetectionModuleFile -Force
    Write-Host "✅ Advanced command detection loaded" -ForegroundColor Green
} else {
    Write-Warning "⚠️ Command detection module not found at: $commandDetectionModuleFile"
}

# Enhanced startup check
function Start-CryptoEnvironmentCheck {
    Write-Host "`n🔍 Crypto Environment Check:" -ForegroundColor Cyan
    
    # Check if Node.js is available
    try {
        $nodeVersion = node --version 2>$null
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
    }
    
    # Check if crypto service is running
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/status" -Method Get -TimeoutSec 3
        Write-Host "✅ Crypto Service: Running (v$($response.version))" -ForegroundColor Green
        Write-Host "   📊 Data: $($response.data_count) cryptocurrencies" -ForegroundColor Gray
        Write-Host "   🚨 Alerts: $($response.alert_count) total, $($response.recent_alerts) recent" -ForegroundColor Gray
        Write-Host "   📧 Email: $($response.notifications.email.configured ? '✅' : '❌')" -ForegroundColor Gray
        Write-Host "   📱 Telegram: $($response.notifications.telegram.configured ? '✅' : '❌')" -ForegroundColor Gray
    }
    catch {
        Write-Host "❌ Crypto Service: Not running" -ForegroundColor Red
        Write-Host "   💡 Start with: node simple-server.js" -ForegroundColor Yellow
    }
    
    # Check environment variables
    $envVars = @('COINMARKETCAP_API_KEY', 'COINGECKO_API_KEY', 'TELEGRAM_BOT_TOKEN', 'EMAIL_USER')
    foreach ($var in $envVars) {
        $value = [Environment]::GetEnvironmentVariable($var)
        if ($value) {
            Write-Host "✅ $var: Configured" -ForegroundColor Green
        } else {
            Write-Host "❌ $var: Not set" -ForegroundColor Red
        }
    }
}

# Quick action menu
function Show-CryptoQuickMenu {
    Write-Host "`n🚀 Crypto Monitor Quick Actions:" -ForegroundColor Cyan
    Write-Host "=" * 40 -ForegroundColor DarkGray
    Write-Host "1. 📊 Get Crypto Data (crypto)" -ForegroundColor White
    Write-Host "2. 📈 Start Monitor (monitor)" -ForegroundColor White
    Write-Host "3. 🔍 Check Status (status)" -ForegroundColor White
    Write-Host "4. 🚨 View Alerts (alerts)" -ForegroundColor White
    Write-Host "5. 📱 Test Notifications (test-notify)" -ForegroundColor White
    Write-Host "6. 💼 Portfolio Analysis (portfolio)" -ForegroundColor White
    Write-Host "7. 📈 Trend Analysis (trends)" -ForegroundColor White
    Write-Host "8. 🛠️ Environment Check" -ForegroundColor White
    Write-Host "9. 📚 Show Help" -ForegroundColor White
    Write-Host "`nType the number or command name: " -NoNewline -ForegroundColor Yellow
    
    $choice = Read-Host
    
    switch ($choice) {
        '1' { Get-CryptoData }
        '2' { Start-CryptoMonitor }
        '3' { Get-CryptoMonitorStatus }
        '4' { Get-CryptoAlerts }
        '5' { Test-CryptoNotifications }
        '6' { Get-CryptoPortfolio }
        '7' { Get-CryptoTrendAnalysis }
        '8' { Start-CryptoEnvironmentCheck }
        '9' { Show-CryptoHelp }
        'crypto' { Get-CryptoData }
        'monitor' { Start-CryptoMonitor }
        'status' { Get-CryptoMonitorStatus }
        'alerts' { Get-CryptoAlerts }
        'test-notify' { Test-CryptoNotifications }
        'portfolio' { Get-CryptoPortfolio }
        'trends' { Get-CryptoTrendAnalysis }
        default { Write-Host "Invalid choice" -ForegroundColor Red }
    }
}

# Custom functions for quick access
function Start-CryptoServer {
    Write-Host "🚀 Starting Crypto Monitor Server..." -ForegroundColor Cyan
    Start-Process -FilePath "node" -ArgumentList "simple-server.js" -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
    Start-Sleep 3
    Write-Host "✅ Server started! Testing connection..." -ForegroundColor Green
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/status" -Method Get -TimeoutSec 5
        Write-Host "✅ Server is running successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Server may still be starting up..." -ForegroundColor Yellow
    }
}

function Stop-CryptoServer {
    Write-Host "🛑 Stopping Crypto Monitor Server..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*crypto*" -or $_.ProcessName -eq "node" } | Stop-Process -Force
    Write-Host "✅ Server stopped" -ForegroundColor Green
}

function Restart-CryptoServer {
    Stop-CryptoServer
    Start-Sleep 2
    Start-CryptoServer
}

function Open-CryptoDashboard {
    Start-Process "http://localhost:3000/simple.html"
}

# Set additional aliases for convenience
Set-Alias -Name menu -Value Show-CryptoQuickMenu
Set-Alias -Name start-server -Value Start-CryptoServer
Set-Alias -Name stop-server -Value Stop-CryptoServer
Set-Alias -Name restart-server -Value Restart-CryptoServer
Set-Alias -Name dashboard -Value Open-CryptoDashboard

# Enhanced command aliases for natural language processing
Set-Alias -Name crypto -Value Get-CryptoData
Set-Alias -Name monitor -Value Start-CryptoMonitor
Set-Alias -Name status -Value Get-CryptoMonitorStatus
Set-Alias -Name alerts -Value Get-CryptoAlerts
Set-Alias -Name test-notify -Value Test-CryptoNotifications
Set-Alias -Name portfolio -Value Get-CryptoPortfolio
Set-Alias -Name trends -Value Get-CryptoTrendAnalysis
Set-Alias -Name prices -Value Get-CryptoData
Set-Alias -Name export -Value Export-CryptoData

# Quick crypto symbol aliases
Set-Alias -Name btc -Value { Get-CryptoData -Symbol BTC }
Set-Alias -Name eth -Value { Get-CryptoData -Symbol ETH }
Set-Alias -Name ada -Value { Get-CryptoData -Symbol ADA }
Set-Alias -Name dot -Value { Get-CryptoData -Symbol DOT }
Set-Alias -Name link -Value { Get-CryptoData -Symbol LINK }
Set-Alias -Name xrp -Value { Get-CryptoData -Symbol XRP }

# Smart command interpreter function
function Invoke-CryptoCommand {
    param([string]$Command)
    
    # Use the advanced command detection system
    $result = Invoke-CryptoCommandDetection $Command -AutoExecute
    
    if (-not $result) {
        Write-Host "❓ Command not recognized. Try:" -ForegroundColor Yellow
        Write-Host "  Show-CryptoHelp - For available commands" -ForegroundColor Gray
        Write-Host "  Show-CryptoContextHelp - For context-specific help" -ForegroundColor Gray
    }
}

# Natural language command processor
function Invoke-NaturalCryptoCommand {
    param([string]$Input)
    
    $input = $Input.ToLower().Trim()
    
    # Natural language patterns
    switch -regex ($input) {
        '^(show|get|display)\s+(bitcoin|btc)' { Get-CryptoData -Symbol BTC; return }
        '^(show|get|display)\s+(ethereum|eth)' { Get-CryptoData -Symbol ETH; return }
        '^(start|begin)\s+monitor' { Start-CryptoMonitor; return }
        '^(check|get)\s+status' { Get-CryptoMonitorStatus; return }
        '^(show|get|display)\s+alert' { Get-CryptoAlerts; return }
        '^test\s+notification' { Test-CryptoNotifications; return }
        '^(start|launch)\s+server' { Start-CryptoServer; return }
        '^(stop|kill)\s+server' { Stop-CryptoServer; return }
        '^(restart|reboot)\s+server' { Restart-CryptoServer; return }
        '^(open|show)\s+dashboard' { Open-CryptoDashboard; return }
        '^(help|what)' { Show-CryptoQuickMenu; return }
        default { 
            Write-Host "🤔 I didn't understand that. Try 'help' for options." -ForegroundColor Yellow
        }
    }
}

# Set alias for natural language processing
Set-Alias -Name ask -Value Invoke-NaturalCryptoCommand
Set-Alias -Name tell -Value Invoke-NaturalCryptoCommand
Set-Alias -Name crypto-help -Value Show-CryptoContextHelp

# Welcome message with environment check
Write-Host "`n🚀 Welcome to Enhanced Crypto Monitor PowerShell!" -ForegroundColor Cyan
Write-Host "🔧 Advanced Shell Integration & Command Detection Active" -ForegroundColor Green

# Auto-run environment check
Start-CryptoEnvironmentCheck

Write-Host "`n🎯 Quick Commands:" -ForegroundColor Yellow
Write-Host "  crypto, monitor, status, alerts, test-notify" -ForegroundColor White
Write-Host "  btc, eth, ada, dot, link, xrp - Quick symbol data" -ForegroundColor White
Write-Host "  menu - Quick action menu" -ForegroundColor White
Write-Host "  start-server, stop-server, restart-server" -ForegroundColor White
Write-Host "  dashboard - Open web dashboard" -ForegroundColor White

Write-Host "`n💬 Natural Language Commands:" -ForegroundColor Yellow
Write-Host "  ask 'show bitcoin' - Natural language queries" -ForegroundColor White
Write-Host "  tell 'start monitor' - Conversational commands" -ForegroundColor White
Write-Host "  crypto-help 'data' - Context-specific help" -ForegroundColor White

Write-Host "`n🔍 Smart Features:" -ForegroundColor Yellow
Write-Host "  Tab completion for all commands" -ForegroundColor White
Write-Host "  Fuzzy matching and suggestions" -ForegroundColor White
Write-Host "  Command usage analytics" -ForegroundColor White
Write-Host "  Auto-detection and correction" -ForegroundColor White

Write-Host "`nType 'menu' for interactive options or 'crypto-help' for detailed help" -ForegroundColor Cyan

Write-Host "`n⚡ Keyboard Shortcuts:" -ForegroundColor Yellow
Write-Host "  Ctrl+Shift+C - Get crypto data" -ForegroundColor White
Write-Host "  Ctrl+Shift+M - Start monitoring" -ForegroundColor White
Write-Host "  Ctrl+Shift+S - Check status" -ForegroundColor White
Write-Host "  Ctrl+Shift+T - Test notifications" -ForegroundColor White

Write-Host "`nType 'menu' for quick actions or 'Show-CryptoHelp' for full help`n" -ForegroundColor Gray
