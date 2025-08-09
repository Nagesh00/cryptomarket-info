# PowerShell Profile for Crypto Monitor
# This script automatically loads when PowerShell starts

# Set console title
$Host.UI.RawUI.WindowTitle = "🚀 Crypto Monitor PowerShell"

# Import the Crypto Monitor module
$moduleFile = Join-Path $PSScriptRoot "CryptoMonitor.psm1"
if (Test-Path $moduleFile) {
    Import-Module $moduleFile -Force
    Write-Host "✅ Crypto Monitor module loaded successfully!" -ForegroundColor Green
} else {
    Write-Warning "⚠️ Crypto Monitor module not found at: $moduleFile"
}

# Set aliases for convenience
Set-Alias -Name crypto -Value Get-CryptoData
Set-Alias -Name monitor -Value Start-CryptoMonitor
Set-Alias -Name status -Value Get-CryptoMonitorStatus
Set-Alias -Name restart -Value Restart-CryptoMonitor

# Custom prompt with crypto info
function prompt {
    $location = Get-Location
    $cryptoIcon = "₿"
    
    # Try to get quick status (non-blocking)
    try {
        $quickStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/crypto" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($quickStatus.success -and $quickStatus.data.Count -gt 0) {
            $btcPrice = ($quickStatus.data | Where-Object { $_.symbol -eq "BTC" }).price
            if ($btcPrice) {
                $cryptoIcon = "₿$([math]::Round($btcPrice))"
            }
        }
    }
    catch {
        # Silently continue if service is not running
    }
    
    Write-Host "[$cryptoIcon] " -NoNewline -ForegroundColor Yellow
    Write-Host "$location" -NoNewline -ForegroundColor Cyan
    return "> "
}

# Welcome message
Write-Host "`n🚀 Welcome to Crypto Monitor PowerShell!" -ForegroundColor Cyan
Write-Host "Quick commands:" -ForegroundColor Yellow
Write-Host "  crypto     - Get crypto data" -ForegroundColor White
Write-Host "  monitor    - Start monitoring" -ForegroundColor White
Write-Host "  status     - Check system status" -ForegroundColor White
Write-Host "  restart    - Restart service" -ForegroundColor White
Write-Host "`nType 'Show-CryptoHelp' for full command list`n" -ForegroundColor Gray
