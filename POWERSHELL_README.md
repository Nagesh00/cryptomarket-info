# 🚀 PowerShell Integration for Crypto Monitor

This comprehensive PowerShell integration enables command-line crypto monitoring, analysis, and automation directly from your Windows PowerShell environment.

## ✨ Features

### 📊 Core Commands
- **Get-CryptoData** - Fetch real-time cryptocurrency data
- **Start-CryptoMonitor** - Real-time console monitoring with alerts
- **Get-CryptoMonitorStatus** - System health and API status
- **Send-CryptoAlert** - Custom alerts with Windows notifications
- **Restart-CryptoMonitor** - Service management

### 📈 Advanced Analysis
- **Get-CryptoTrendAnalysis** - Multi-sample trend analysis
- **Export-CryptoData** - Export to CSV, JSON, XML
- **Start-CryptoPriceAlert** - Price threshold monitoring
- **Get-CryptoPortfolio** - Portfolio tracking and analysis

### ⚡ Quick Aliases
- `crypto` → `Get-CryptoData`
- `monitor` → `Start-CryptoMonitor`
- `status` → `Get-CryptoMonitorStatus`

## 🛠️ Installation

### Automatic Setup
```powershell
# Run the setup script (recommended)
.\Setup-PowerShellIntegration.ps1
```

### Manual Setup
```powershell
# Import the module
Import-Module .\CryptoMonitor.psm1

# Set up aliases
Set-Alias crypto Get-CryptoData
Set-Alias monitor Start-CryptoMonitor
Set-Alias status Get-CryptoMonitorStatus
```

## 📋 Usage Examples

### Basic Commands
```powershell
# Get all crypto data
Get-CryptoData

# Get specific cryptocurrency
Get-CryptoData -Symbol BTC

# Get data in JSON format
Get-CryptoData -Json

# Check system status
Get-CryptoMonitorStatus
```

### Real-Time Monitoring
```powershell
# Monitor all cryptocurrencies (refresh every 30s)
Start-CryptoMonitor

# Monitor specific coins with custom interval
Start-CryptoMonitor -RefreshSeconds 10 -WatchSymbols @('BTC','ETH','ADA')

# Monitor with custom alert threshold
Start-CryptoMonitor -AlertThreshold 2.5
```

### Advanced Analysis
```powershell
# Trend analysis over 20 samples
Get-CryptoTrendAnalysis -Symbols @('BTC','ETH') -SampleCount 20 -IntervalSeconds 15

# Export data to CSV
Export-CryptoData -OutputPath "crypto-$(Get-Date -Format 'yyyyMMdd').csv"

# Price alerts
Start-CryptoPriceAlert -Symbol BTC -TargetPrice 50000 -Condition above

# Portfolio analysis
Get-CryptoPortfolio -Holdings @{ "BTC" = 0.5; "ETH" = 10; "ADA" = 1000 }
```

### Data Export & Analysis
```powershell
# Export to different formats
Export-CryptoData -Format CSV
Export-CryptoData -Format JSON -OutputPath "crypto-data.json"
Export-CryptoData -Format XML

# Pipeline operations
Get-CryptoData | Where-Object { $_.change_24h -gt 5 } | Select-Object name, symbol, price, change_24h

# Sort by market cap
Get-CryptoData | Sort-Object market_cap -Descending | Select-Object -First 10
```

### Automation Scripts
```powershell
# Daily portfolio check
$portfolio = @{ "BTC" = 0.1; "ETH" = 2.5; "ADA" = 1000 }
Get-CryptoPortfolio -Holdings $portfolio | Out-File "daily-portfolio-$(Get-Date -Format 'yyyyMMdd').txt"

# Price monitoring loop
while ($true) {
    $btc = Get-CryptoData -Symbol BTC
    if ($btc.price -gt 50000) {
        Send-CryptoAlert -Symbol BTC -Message "Price above $50k!" -Type warning
        break
    }
    Start-Sleep 300 # Check every 5 minutes
}
```

## 🎯 Custom Prompt

The integration includes a custom PowerShell prompt showing live BTC price:

```
[₿45000] C:\Users\Nagnath\cryptoanalysis1>
```

## 📁 File Structure

```
cryptoanalysis1/
├── CryptoMonitor.psm1         # Main PowerShell module
├── CryptoAnalysis.psm1        # Advanced analysis functions
├── CryptoProfile.ps1          # PowerShell profile setup
├── Setup-PowerShellIntegration.ps1  # Automatic setup script
└── logs/                      # Alert logs directory
    └── crypto-alerts.log      # Alert history
```

## ⚙️ Configuration

### Global Settings
```powershell
# Modify global configuration
$Global:CryptoMonitorConfig.ApiUrl = "http://localhost:3000"
$Global:CryptoMonitorConfig.RefreshInterval = 15
$Global:CryptoMonitorConfig.AlertThreshold = 5.0
$Global:CryptoMonitorConfig.LogPath = "$env:USERPROFILE\cryptoanalysis1\logs"
```

### Custom Functions
```powershell
# Create custom monitoring function
function Watch-MyPortfolio {
    $myHoldings = @{
        "BTC" = 0.5
        "ETH" = 10
        "ADA" = 1000
        "DOT" = 100
    }
    
    Start-CryptoMonitor -WatchSymbols @($myHoldings.Keys) -RefreshSeconds 20
}
```

## 🔔 Notifications

### Windows Notifications
- Automatic balloon notifications for price alerts
- System tray integration
- Custom alert messages with icons

### Logging
- All alerts logged to `logs/crypto-alerts.log`
- Timestamped entries with alert details
- Configurable log path

## 🚨 Error Handling

### Service Not Running
If the crypto service isn't running:
```powershell
# Start the service
node simple-server.js

# Or restart via PowerShell
Restart-CryptoMonitor
```

### Module Import Issues
```powershell
# Force reload module
Import-Module .\CryptoMonitor.psm1 -Force

# Check module commands
Get-Command -Module CryptoMonitor
```

## 📊 Performance Tips

### Efficient Monitoring
- Use specific symbols instead of monitoring all cryptocurrencies
- Adjust refresh intervals based on your needs (10-60 seconds)
- Use pipeline operations for data filtering

### Memory Management
```powershell
# Clear variable caches
Remove-Variable crypto* -Force -ErrorAction SilentlyContinue

# Restart PowerShell session periodically for long-running monitors
```

## 🔧 Troubleshooting

### Common Issues

1. **Execution Policy Error**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
   ```

2. **Module Not Found**
   ```powershell
   # Ensure you're in the correct directory
   Set-Location "C:\Users\Nagnath\cryptoanalysis1"
   Import-Module .\CryptoMonitor.psm1 -Force
   ```

3. **API Connection Failed**
   ```powershell
   # Check if service is running
   Test-NetConnection -ComputerName localhost -Port 3000
   
   # Start the service
   node simple-server.js
   ```

### Debug Mode
```powershell
# Enable verbose output
$VerbosePreference = "Continue"
Get-CryptoData -Verbose
```

## 🚀 Quick Start Checklist

1. ✅ **Start Crypto Service**: `node simple-server.js`
2. ✅ **Run Setup**: `.\Setup-PowerShellIntegration.ps1`
3. ✅ **Test Commands**: `crypto`, `status`, `monitor`
4. ✅ **Set Alerts**: `Start-CryptoPriceAlert -Symbol BTC -TargetPrice 50000`
5. ✅ **Export Data**: `Export-CryptoData`

## 🎉 Advanced Use Cases

### Trading Automation
```powershell
# Simple trading signal
$btc = Get-CryptoData -Symbol BTC
if ($btc.change_24h -gt 10) {
    Send-CryptoAlert -Symbol BTC -Message "Strong uptrend detected!" -Type success
}
```

### Portfolio Rebalancing
```powershell
$portfolio = Get-CryptoPortfolio
$btcPercentage = ($portfolio | Where-Object Symbol -eq 'BTC').PercentOfPortfolio
if ($btcPercentage -gt 60) {
    Write-Host "Consider rebalancing - BTC is $btcPercentage% of portfolio" -ForegroundColor Yellow
}
```

### Historical Data Collection
```powershell
# Collect data every hour for analysis
while ($true) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    Export-CryptoData -OutputPath "historical\crypto-$timestamp.csv"
    Start-Sleep 3600 # 1 hour
}
```

---

🎯 **Ready to start?** Run `.\Setup-PowerShellIntegration.ps1` and begin monitoring cryptocurrencies from PowerShell!
