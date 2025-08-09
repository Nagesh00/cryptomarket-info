# PowerShell Crypto Monitor Integration Module
# Author: Crypto Monitor Team
# Description: PowerShell commands for crypto monitoring and system management

# Import required modules
Add-Type -AssemblyName System.Web

# Global configuration
$Global:CryptoMonitorConfig = @{
    ApiUrl = "http://localhost:3000"
    RefreshInterval = 15
    AlertThreshold = 5.0
    LogPath = "$env:USERPROFILE\cryptoanalysis1\logs"
}

# Function to get crypto data
function Get-CryptoData {
    [CmdletBinding()]
    param(
        [string]$Symbol = "",
        [switch]$ShowAll,
        [switch]$Json
    )
    
    try {
        Write-Host "📡 Fetching crypto data..." -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri "$($Global:CryptoMonitorConfig.ApiUrl)/api/crypto" -Method Get
        
        if ($response.success) {
            $data = $response.data
            
            # Filter by symbol if specified
            if ($Symbol) {
                $data = $data | Where-Object { $_.symbol -eq $Symbol.ToUpper() }
            }
            
            if ($Json) {
                return $data | ConvertTo-Json -Depth 10
            }
            
            # Format output
            $data | ForEach-Object {
                $changeIcon = if ($_.change_24h -ge 0) { "📈" } else { "📉" }
                $changeColor = if ($_.change_24h -ge 0) { "Green" } else { "Red" }
                
                Write-Host "`n🪙 $($_.name) ($($_.symbol))" -ForegroundColor Yellow
                Write-Host "   💰 Price: $([math]::Round($_.price, 6))" -ForegroundColor White
                Write-Host "   $changeIcon Change: $([math]::Round($_.change_24h, 2))%" -ForegroundColor $changeColor
                Write-Host "   📊 Market Cap: $([math]::Round($_.market_cap / 1000000000, 2))B" -ForegroundColor Gray
                Write-Host "   📈 Volume: $([math]::Round($_.volume_24h / 1000000, 2))M" -ForegroundColor Gray
                Write-Host "   🕒 Updated: $(Get-Date $_.timestamp -Format 'HH:mm:ss')" -ForegroundColor DarkGray
            }
            
            Write-Host "`n✅ Total cryptocurrencies: $($data.Count)" -ForegroundColor Green
        }
        else {
            Write-Error "❌ Failed to fetch crypto data"
        }
    }
    catch {
        Write-Error "❌ Error: $($_.Exception.Message)"
    }
}

# Function to monitor crypto prices continuously
function Start-CryptoMonitor {
    [CmdletBinding()]
    param(
        [int]$RefreshSeconds = 30,
        [string[]]$WatchSymbols = @(),
        [double]$AlertThreshold = 5.0
    )
    
    Write-Host "🚀 Starting PowerShell Crypto Monitor..." -ForegroundColor Cyan
    Write-Host "⏱️ Refresh interval: $RefreshSeconds seconds" -ForegroundColor Yellow
    Write-Host "🚨 Alert threshold: ±$AlertThreshold%" -ForegroundColor Yellow
    Write-Host "📊 Watching: $(if ($WatchSymbols.Count -gt 0) { $WatchSymbols -join ', ' } else { 'All cryptocurrencies' })" -ForegroundColor Yellow
    Write-Host "`nPress Ctrl+C to stop monitoring`n" -ForegroundColor Gray
    
    $previousPrices = @{}
    
    while ($true) {
        try {
            Clear-Host
            Write-Host "🚀 PowerShell Crypto Monitor - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
            Write-Host "=" * 80 -ForegroundColor DarkGray
            
            $response = Invoke-RestMethod -Uri "$($Global:CryptoMonitorConfig.ApiUrl)/api/crypto" -Method Get
            
            if ($response.success) {
                $data = $response.data
                
                # Filter by watch symbols if specified
                if ($WatchSymbols.Count -gt 0) {
                    $data = $data | Where-Object { $_.symbol -in $WatchSymbols }
                }
                
                foreach ($coin in $data) {
                    $symbol = $coin.symbol
                    $currentPrice = $coin.price
                    $change24h = $coin.change_24h
                    
                    # Check for price alerts
                    if ($previousPrices.ContainsKey($symbol)) {
                        $priceChange = (($currentPrice - $previousPrices[$symbol]) / $previousPrices[$symbol]) * 100
                        
                        if ([math]::Abs($priceChange) -ge $AlertThreshold) {
                            $alertIcon = if ($priceChange -gt 0) { "🚀" } else { "⚠️" }
                            Write-Host "$alertIcon ALERT: $symbol moved $([math]::Round($priceChange, 2))% in the last interval!" -ForegroundColor Magenta
                        }
                    }
                    
                    # Display coin info
                    $changeIcon = if ($change24h -ge 0) { "📈" } else { "📉" }
                    $changeColor = if ($change24h -ge 0) { "Green" } else { "Red" }
                    
                    Write-Host "$($coin.name.PadRight(15)) $($symbol.PadRight(8)) $" -NoNewline -ForegroundColor White
                    Write-Host "$([math]::Round($currentPrice, 6))".PadLeft(12) -NoNewline -ForegroundColor Yellow
                    Write-Host " $changeIcon " -NoNewline
                    Write-Host "$([math]::Round($change24h, 2))%".PadLeft(8) -ForegroundColor $changeColor
                    
                    # Store current price for next comparison
                    $previousPrices[$symbol] = $currentPrice
                }
                
                Write-Host "`n📊 Monitoring $($data.Count) cryptocurrencies" -ForegroundColor Green
                Write-Host "⏱️ Next update in $RefreshSeconds seconds..." -ForegroundColor DarkGray
            }
            else {
                Write-Host "❌ Failed to fetch data" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds $RefreshSeconds
    }
}

# Function to get system status
function Get-CryptoMonitorStatus {
    try {
        Write-Host "🔍 Checking Crypto Monitor status..." -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri "$($Global:CryptoMonitorConfig.ApiUrl)/api/status" -Method Get
        
        Write-Host "`n✅ System Status" -ForegroundColor Green
        Write-Host "   📛 Name: $($response.name)" -ForegroundColor White
        Write-Host "   🔢 Version: $($response.version)" -ForegroundColor White
        Write-Host "   🟢 Status: $($response.status)" -ForegroundColor Green
        Write-Host "   ⏱️ Uptime: $([math]::Round($response.uptime / 3600, 2)) hours" -ForegroundColor White
        Write-Host "   📊 Data Count: $($response.data_count)" -ForegroundColor White
        Write-Host "   🕒 Last Update: $($response.last_update)" -ForegroundColor Gray
        
        Write-Host "`n🔑 API Keys Status:" -ForegroundColor Yellow
        foreach ($key in $response.api_keys.PSObject.Properties) {
            $status = if ($key.Value) { "✅" } else { "❌" }
            Write-Host "   $status $($key.Name): $($key.Value)" -ForegroundColor White
        }
        
        Write-Host "`n💾 Memory Usage:" -ForegroundColor Cyan
        Write-Host "   RSS: $([math]::Round($response.memory.rss / 1024 / 1024, 2)) MB" -ForegroundColor White
        Write-Host "   Heap Used: $([math]::Round($response.memory.heapUsed / 1024 / 1024, 2)) MB" -ForegroundColor White
        Write-Host "   External: $([math]::Round($response.memory.external / 1024 / 1024, 2)) MB" -ForegroundColor White
    }
    catch {
        Write-Error "❌ Failed to get status: $($_.Exception.Message)"
    }
}

# Function to send notifications
function Send-CryptoAlert {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Symbol,
        [Parameter(Mandatory)]
        [string]$Message,
        [string]$Type = "info"
    )
    
    $alertIcon = switch ($Type.ToLower()) {
        "warning" { "⚠️" }
        "error" { "❌" }
        "success" { "✅" }
        default { "ℹ️" }
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $alertMessage = "$alertIcon [$timestamp] $Symbol - $Message"
    
    # Display alert
    Write-Host $alertMessage -ForegroundColor Yellow
    
    # Log to file
    $logFile = Join-Path $Global:CryptoMonitorConfig.LogPath "crypto-alerts.log"
    if (!(Test-Path (Split-Path $logFile))) {
        New-Item -ItemType Directory -Path (Split-Path $logFile) -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $alertMessage
    
    # Windows notification (optional)
    try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        Add-Type -AssemblyName System.Windows.Forms
        
        $balloon = New-Object System.Windows.Forms.NotifyIcon
        $balloon.Icon = [System.Drawing.SystemIcons]::Information
        $balloon.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
        $balloon.BalloonTipText = $Message
        $balloon.BalloonTipTitle = "Crypto Alert: $Symbol"
        $balloon.Visible = $true
        $balloon.ShowBalloonTip(5000)
        
        Start-Sleep -Seconds 1
        $balloon.Dispose()
    }
    catch {
        # Silently fail if notifications aren't available
    }
}

# Function to manage the crypto service
function Restart-CryptoMonitor {
    Write-Host "🔄 Restarting Crypto Monitor service..." -ForegroundColor Cyan
    
    try {
        # Try to gracefully stop any running instances
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
            $_.MainWindowTitle -like "*crypto*" -or $_.ProcessName -eq "node"
        }
        
        if ($processes) {
            Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
            $processes | Stop-Process -Force
            Start-Sleep -Seconds 3
        }
        
        # Start new instance
        Write-Host "🚀 Starting new Crypto Monitor instance..." -ForegroundColor Green
        $workingDir = Split-Path $PSScriptRoot
        
        Start-Process -FilePath "node" -ArgumentList "simple-server.js" -WorkingDirectory $workingDir -WindowStyle Minimized
        
        # Wait and check if it started
        Start-Sleep -Seconds 5
        
        try {
            $response = Invoke-RestMethod -Uri "$($Global:CryptoMonitorConfig.ApiUrl)/api/status" -Method Get -TimeoutSec 10
            Write-Host "✅ Crypto Monitor restarted successfully!" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️ Service may still be starting up..." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Error "❌ Failed to restart: $($_.Exception.Message)"
    }
}

# Function to show help
function Show-CryptoHelp {
    Write-Host "`n🚀 PowerShell Crypto Monitor Commands" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor DarkGray
    
    Write-Host "`nℹ️ Data Commands:" -ForegroundColor Yellow
    Write-Host "   Get-CryptoData [-Symbol BTC] [-Json]" -ForegroundColor White
    Write-Host "   Get-CryptoMonitorStatus" -ForegroundColor White
    
    Write-Host "`n📊 Monitoring Commands:" -ForegroundColor Yellow
    Write-Host "   Start-CryptoMonitor [-RefreshSeconds 30] [-WatchSymbols @('BTC','ETH')]" -ForegroundColor White
    Write-Host "   Send-CryptoAlert -Symbol 'BTC' -Message 'Price alert' [-Type 'warning']" -ForegroundColor White
    
    Write-Host "`n🔧 Service Commands:" -ForegroundColor Yellow
    Write-Host "   Restart-CryptoMonitor" -ForegroundColor White
    Write-Host "   Show-CryptoHelp" -ForegroundColor White
    
    Write-Host "`n📝 Examples:" -ForegroundColor Green
    Write-Host "   Get-CryptoData -Symbol BTC" -ForegroundColor Gray
    Write-Host "   Start-CryptoMonitor -RefreshSeconds 10 -WatchSymbols @('BTC','ETH','ADA')" -ForegroundColor Gray
    Write-Host "   Get-CryptoData | ConvertTo-Csv | Out-File crypto-data.csv" -ForegroundColor Gray
    
    Write-Host "`n🌐 Web Interface: http://localhost:3000" -ForegroundColor Cyan
}

# Export functions for module use
Export-ModuleMember -Function @(
    'Get-CryptoData',
    'Start-CryptoMonitor', 
    'Get-CryptoMonitorStatus',
    'Send-CryptoAlert',
    'Restart-CryptoMonitor',
    'Show-CryptoHelp'
)

# Auto-display help when module is imported
Write-Host "`n🚀 PowerShell Crypto Monitor Module Loaded!" -ForegroundColor Green
Write-Host "Type 'Show-CryptoHelp' for available commands" -ForegroundColor Cyan
