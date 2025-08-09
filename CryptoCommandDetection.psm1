# Advanced Command Detection and Shell Enhancement for Crypto Monitor
# This module provides intelligent command detection and shell improvements

# Import required modules for enhanced functionality
if (Get-Module -ListAvailable -Name PSReadLine) {
    Import-Module PSReadLine -Force
}

# Command detection patterns
$Global:CryptoCommandPatterns = @{
    # Direct command mappings
    'crypto' = @{
        Command = 'Get-CryptoData'
        Description = 'Get cryptocurrency data'
        Examples = @('crypto', 'crypto -Symbol BTC', 'crypto -Json')
    }
    'btc' = @{
        Command = 'Get-CryptoData -Symbol BTC'
        Description = 'Get Bitcoin data'
        Examples = @('btc')
    }
    'eth' = @{
        Command = 'Get-CryptoData -Symbol ETH'
        Description = 'Get Ethereum data'
        Examples = @('eth')
    }
    'monitor' = @{
        Command = 'Start-CryptoMonitor'
        Description = 'Start real-time crypto monitoring'
        Examples = @('monitor', 'monitor -RefreshSeconds 10', 'monitor -WatchSymbols @("BTC","ETH")')
    }
    'status' = @{
        Command = 'Get-CryptoMonitorStatus'
        Description = 'Check system status'
        Examples = @('status')
    }
    'alerts' = @{
        Command = 'Get-CryptoAlerts'
        Description = 'View recent alerts'
        Examples = @('alerts', 'alerts -Count 20')
    }
    'test-notify' = @{
        Command = 'Test-CryptoNotifications'
        Description = 'Test notification system'
        Examples = @('test-notify')
    }
    'portfolio' = @{
        Command = 'Get-CryptoPortfolio'
        Description = 'Analyze crypto portfolio'
        Examples = @('portfolio')
    }
    'trends' = @{
        Command = 'Get-CryptoTrendAnalysis'
        Description = 'Analyze price trends'
        Examples = @('trends', 'trends -Symbols @("BTC","ETH")')
    }
    'prices' = @{
        Command = 'Get-CryptoData'
        Description = 'Get current crypto prices'
        Examples = @('prices')
    }
    'export' = @{
        Command = 'Export-CryptoData'
        Description = 'Export crypto data'
        Examples = @('export', 'export -Format JSON')
    }
    
    # Natural language patterns
    'show me bitcoin' = @{
        Command = 'Get-CryptoData -Symbol BTC'
        Description = 'Show Bitcoin information'
    }
    'start monitoring' = @{
        Command = 'Start-CryptoMonitor'
        Description = 'Start crypto monitoring'
    }
    'check status' = @{
        Command = 'Get-CryptoMonitorStatus'
        Description = 'Check system status'
    }
    'test notifications' = @{
        Command = 'Test-CryptoNotifications'
        Description = 'Test notification system'
    }
    'show alerts' = @{
        Command = 'Get-CryptoAlerts'
        Description = 'Show recent alerts'
    }
    'get prices' = @{
        Command = 'Get-CryptoData'
        Description = 'Get current prices'
    }
}

# Enhanced command detection function
function Invoke-CryptoCommandDetection {
    param(
        [string]$InputText,
        [switch]$ShowSuggestions,
        [switch]$AutoExecute
    )
    
    $inputLower = $InputText.ToLower().Trim()
    
    # Direct pattern matching
    if ($Global:CryptoCommandPatterns.ContainsKey($inputLower)) {
        $pattern = $Global:CryptoCommandPatterns[$inputLower]
        
        if ($AutoExecute) {
            Write-Host "🔍 Detected: $($pattern.Description)" -ForegroundColor Green
            Write-Host "🚀 Executing: $($pattern.Command)" -ForegroundColor Cyan
            Invoke-Expression $pattern.Command
            return $true
        } elseif ($ShowSuggestions) {
            Write-Host "💡 Suggestion: $($pattern.Command)" -ForegroundColor Yellow
            Write-Host "   Description: $($pattern.Description)" -ForegroundColor Gray
            return $pattern
        }
    }
    
    # Fuzzy matching for similar commands
    $matches = @()
    foreach ($key in $Global:CryptoCommandPatterns.Keys) {
        $distance = Get-LevenshteinDistance $inputLower $key
        if ($distance -le 2 -and $distance -gt 0) {
            $matches += @{
                Pattern = $key
                Command = $Global:CryptoCommandPatterns[$key]
                Distance = $distance
            }
        }
    }
    
    if ($matches.Count -gt 0) {
        $bestMatch = $matches | Sort-Object Distance | Select-Object -First 1
        
        if ($ShowSuggestions) {
            Write-Host "💡 Did you mean: $($bestMatch.Pattern)?" -ForegroundColor Yellow
            Write-Host "   Command: $($bestMatch.Command.Command)" -ForegroundColor Gray
            Write-Host "   Description: $($bestMatch.Command.Description)" -ForegroundColor Gray
            return $bestMatch
        }
    }
    
    # Partial matching for crypto symbols
    $cryptoSymbols = @('BTC', 'ETH', 'ADA', 'DOT', 'LINK', 'XRP', 'LTC', 'BCH', 'EOS', 'XLM')
    foreach ($symbol in $cryptoSymbols) {
        if ($inputLower -eq $symbol.ToLower()) {
            $command = "Get-CryptoData -Symbol $symbol"
            if ($AutoExecute) {
                Write-Host "🔍 Detected crypto symbol: $symbol" -ForegroundColor Green
                Write-Host "🚀 Executing: $command" -ForegroundColor Cyan
                Invoke-Expression $command
                return $true
            } elseif ($ShowSuggestions) {
                Write-Host "💡 Crypto symbol detected: $command" -ForegroundColor Yellow
                return @{ Command = $command; Description = "Get $symbol data" }
            }
        }
    }
    
    return $false
}

# Intelligent command prediction
function Get-CryptoCommandPredictions {
    param([string]$PartialInput)
    
    $predictions = @()
    $inputLower = $PartialInput.ToLower()
    
    # Find matching patterns
    foreach ($key in $Global:CryptoCommandPatterns.Keys) {
        if ($key.StartsWith($inputLower) -or $key.Contains($inputLower)) {
            $predictions += @{
                Text = $key
                Command = $Global:CryptoCommandPatterns[$key].Command
                Description = $Global:CryptoCommandPatterns[$key].Description
                Relevance = if ($key.StartsWith($inputLower)) { 2 } else { 1 }
            }
        }
    }
    
    # Sort by relevance
    return $predictions | Sort-Object Relevance -Descending | Select-Object -First 5
}

# Enhanced tab completion
function Register-CryptoTabCompletion {
    # Register custom tab completion for crypto commands
    Register-ArgumentCompleter -Native -CommandName crypto -ScriptBlock {
        param($wordToComplete, $commandAst, $cursorPosition)
        
        $predictions = Get-CryptoCommandPredictions $wordToComplete
        foreach ($prediction in $predictions) {
            [System.Management.Automation.CompletionResult]::new(
                $prediction.Text,
                $prediction.Text,
                'Command',
                $prediction.Description
            )
        }
    }
    
    # Register for common crypto terms
    $cryptoTerms = @('bitcoin', 'ethereum', 'cardano', 'polkadot', 'chainlink')
    foreach ($term in $cryptoTerms) {
        Register-ArgumentCompleter -Native -CommandName $term -ScriptBlock {
            param($wordToComplete, $commandAst, $cursorPosition)
            
            $symbol = switch ($term) {
                'bitcoin' { 'BTC' }
                'ethereum' { 'ETH' }
                'cardano' { 'ADA' }
                'polkadot' { 'DOT' }
                'chainlink' { 'LINK' }
                default { $term.ToUpper() }
            }
            
            [System.Management.Automation.CompletionResult]::new(
                "Get-CryptoData -Symbol $symbol",
                "Get-CryptoData -Symbol $symbol",
                'Command',
                "Get $symbol cryptocurrency data"
            )
        }
    }
}

# Context-aware help system
function Show-CryptoContextHelp {
    param([string]$Context = "general")
    
    switch ($Context.ToLower()) {
        'data' {
            Write-Host "`n📊 Data Commands Help:" -ForegroundColor Cyan
            Write-Host "  crypto           - Get all crypto data" -ForegroundColor White
            Write-Host "  crypto -Symbol X - Get specific crypto data" -ForegroundColor White
            Write-Host "  btc, eth, ada    - Quick symbol shortcuts" -ForegroundColor White
            Write-Host "  export           - Export data to file" -ForegroundColor White
        }
        'monitoring' {
            Write-Host "`n📈 Monitoring Commands Help:" -ForegroundColor Cyan
            Write-Host "  monitor                    - Start monitoring all cryptos" -ForegroundColor White
            Write-Host "  monitor -RefreshSeconds 10 - Custom refresh interval" -ForegroundColor White
            Write-Host "  monitor -WatchSymbols @()  - Monitor specific cryptos" -ForegroundColor White
            Write-Host "  status                     - Check system status" -ForegroundColor White
        }
        'alerts' {
            Write-Host "`n🚨 Alert Commands Help:" -ForegroundColor Cyan
            Write-Host "  alerts           - View recent alerts" -ForegroundColor White
            Write-Host "  test-notify      - Test notification system" -ForegroundColor White
            Write-Host "  alerts -Count 20 - View more alerts" -ForegroundColor White
        }
        'analysis' {
            Write-Host "`n📈 Analysis Commands Help:" -ForegroundColor Cyan
            Write-Host "  portfolio - Analyze your portfolio" -ForegroundColor White
            Write-Host "  trends    - Analyze price trends" -ForegroundColor White
        }
        default {
            Write-Host "`n🚀 Crypto Monitor Context Help:" -ForegroundColor Cyan
            Write-Host "Available contexts:" -ForegroundColor Yellow
            Write-Host "  data       - Data retrieval commands" -ForegroundColor White
            Write-Host "  monitoring - Real-time monitoring" -ForegroundColor White
            Write-Host "  alerts     - Alert and notification commands" -ForegroundColor White
            Write-Host "  analysis   - Portfolio and trend analysis" -ForegroundColor White
            Write-Host "`nExample: Show-CryptoContextHelp 'data'" -ForegroundColor Gray
        }
    }
}

# Smart command execution with confirmation
function Invoke-SmartCryptoCommand {
    param(
        [string]$InputText,
        [switch]$RequireConfirmation = $true
    )
    
    $detection = Invoke-CryptoCommandDetection $InputText -ShowSuggestions
    
    if ($detection) {
        if ($RequireConfirmation) {
            Write-Host "Execute command? " -NoNewline -ForegroundColor Yellow
            Write-Host $detection.Command -NoNewline -ForegroundColor Green
            Write-Host " (Y/N): " -NoNewline -ForegroundColor Yellow
            
            $response = Read-Host
            if ($response -eq 'Y' -or $response -eq 'y' -or $response -eq 'yes') {
                Invoke-Expression $detection.Command
            } else {
                Write-Host "Command cancelled" -ForegroundColor Gray
            }
        } else {
            Invoke-Expression $detection.Command
        }
    } else {
        Write-Host "No crypto command detected for: $InputText" -ForegroundColor Yellow
        Write-Host "Try 'Show-CryptoHelp' for available commands" -ForegroundColor Gray
    }
}

# Command usage analytics
function Get-CryptoCommandUsage {
    $history = Get-History | Where-Object {
        $_.CommandLine -match "(crypto|Get-Crypto|Start-Crypto|Test-Crypto|bitcoin|ethereum|btc|eth|monitor|status|alerts)"
    }
    
    if ($history.Count -gt 0) {
        Write-Host "`n📊 Crypto Command Usage Analytics:" -ForegroundColor Cyan
        
        # Most used commands
        $commandGroups = $history | Group-Object { 
            ($_.CommandLine -split ' ')[0] 
        } | Sort-Object Count -Descending | Select-Object -First 5
        
        Write-Host "`n🏆 Top Commands:" -ForegroundColor Yellow
        foreach ($group in $commandGroups) {
            Write-Host "  $($group.Name): $($group.Count) times" -ForegroundColor White
        }
        
        # Recent activity
        $recent = $history | Select-Object -Last 5
        Write-Host "`n⏱️ Recent Commands:" -ForegroundColor Yellow
        foreach ($cmd in $recent) {
            Write-Host "  $($cmd.CommandLine)" -ForegroundColor Gray
        }
        
        # Usage patterns
        $timeGroups = $history | Group-Object { 
            $_.StartExecutionTime.Hour 
        } | Sort-Object Name
        
        Write-Host "`n⏰ Usage by Hour:" -ForegroundColor Yellow
        foreach ($group in $timeGroups) {
            $hour = "{0:D2}:00" -f [int]$group.Name
            $bar = "█" * [Math]::Min($group.Count, 20)
            Write-Host "  $hour $bar ($($group.Count))" -ForegroundColor Green
        }
    } else {
        Write-Host "No crypto command history found" -ForegroundColor Yellow
    }
}

# Initialize enhanced command detection
function Initialize-EnhancedCommandDetection {
    Write-Host "🔧 Initializing enhanced command detection..." -ForegroundColor Cyan
    
    try {
        # Register tab completion
        Register-CryptoTabCompletion
        Write-Host "✅ Tab completion registered" -ForegroundColor Green
        
        # Set up PSReadLine if available
        if (Get-Module -Name PSReadLine) {
            Set-PSReadLineOption -PredictionSource HistoryAndPlugin
            Set-PSReadLineOption -PredictionViewStyle ListView
            Write-Host "✅ PSReadLine enhancements enabled" -ForegroundColor Green
        }
        
        Write-Host "✅ Enhanced command detection ready!" -ForegroundColor Green
        
    } catch {
        Write-Warning "⚠️ Some enhancements may not be available: $($_.Exception.Message)"
    }
}

# Export functions
Export-ModuleMember -Function @(
    'Invoke-CryptoCommandDetection',
    'Get-CryptoCommandPredictions',
    'Show-CryptoContextHelp',
    'Invoke-SmartCryptoCommand',
    'Get-CryptoCommandUsage',
    'Initialize-EnhancedCommandDetection'
)

# Auto-initialize
Initialize-EnhancedCommandDetection
