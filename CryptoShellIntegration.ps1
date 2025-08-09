# PowerShell Shell Integration for Crypto Monitor
# This script enables enhanced command detection and shell integration

# Enable PSReadLine for better command line experience
if (Get-Module -ListAvailable -Name PSReadLine) {
    Import-Module PSReadLine -Force
    
    # Configure PSReadLine for better command detection
    Set-PSReadLineOption -PredictionSource History
    Set-PSReadLineOption -PredictionViewStyle ListView
    Set-PSReadLineOption -EditMode Windows
    Set-PSReadLineOption -BellStyle None
    
    # Enhanced key handlers for crypto commands
    Set-PSReadLineKeyHandler -Key Ctrl+Shift+C -ScriptBlock {
        [Microsoft.PowerShell.PSConsoleReadLine]::Insert("Get-CryptoData ")
    }
    
    Set-PSReadLineKeyHandler -Key Ctrl+Shift+M -ScriptBlock {
        [Microsoft.PowerShell.PSConsoleReadLine]::Insert("Start-CryptoMonitor ")
    }
    
    Set-PSReadLineKeyHandler -Key Ctrl+Shift+S -ScriptBlock {
        [Microsoft.PowerShell.PSConsoleReadLine]::Insert("Get-CryptoMonitorStatus")
        [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
    }
    
    Set-PSReadLineKeyHandler -Key Ctrl+Shift+T -ScriptBlock {
        [Microsoft.PowerShell.PSConsoleReadLine]::Insert("Test-CryptoNotifications")
        [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
    }
    
    Write-Host "✅ Enhanced shell integration enabled" -ForegroundColor Green
    Write-Host "Shortcuts: Ctrl+Shift+C (crypto), Ctrl+Shift+M (monitor), Ctrl+Shift+S (status), Ctrl+Shift+T (test)" -ForegroundColor Yellow
}

# Tab completion for crypto symbols
$cryptoSymbols = @('BTC', 'ETH', 'ADA', 'DOT', 'LINK', 'XRP', 'LTC', 'BCH', 'EOS', 'XLM', 'ATOM', 'ALGO', 'VET', 'THETA', 'FIL', 'TRX', 'ETC', 'NEO', 'DASH', 'ZEC')

Register-ArgumentCompleter -CommandName Get-CryptoData -ParameterName Symbol -ScriptBlock {
    param($commandName, $parameterName, $wordToComplete, $commandAst, $fakeBoundParameters)
    $cryptoSymbols | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}

Register-ArgumentCompleter -CommandName Start-CryptoMonitor -ParameterName WatchSymbols -ScriptBlock {
    param($commandName, $parameterName, $wordToComplete, $commandAst, $fakeBoundParameters)
    $cryptoSymbols | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}

# Command detection and auto-correction
function Enable-CryptoCommandDetection {
    # Override the command not found handler
    $ExecutionContext.InvokeCommand.CommandNotFoundAction = {
        param($CommandName, $CommandLookupEventArgs)
        
        # Crypto command suggestions
        $suggestions = @{
            'crypto' = 'Get-CryptoData'
            'btc' = 'Get-CryptoData -Symbol BTC'
            'eth' = 'Get-CryptoData -Symbol ETH'
            'monitor' = 'Start-CryptoMonitor'
            'status' = 'Get-CryptoMonitorStatus'
            'alerts' = 'Get-CryptoAlerts'
            'test' = 'Test-CryptoNotifications'
            'prices' = 'Get-CryptoData'
            'portfolio' = 'Get-CryptoPortfolio'
            'trends' = 'Get-CryptoTrendAnalysis'
        }
        
        $lowerCommand = $CommandName.ToLower()
        
        if ($suggestions.ContainsKey($lowerCommand)) {
            $suggestion = $suggestions[$lowerCommand]
            Write-Host "💡 Did you mean: " -NoNewline -ForegroundColor Yellow
            Write-Host $suggestion -ForegroundColor Green
            Write-Host "Press Y to execute, any other key to cancel: " -NoNewline -ForegroundColor Cyan
            
            $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            if ($key.Character -eq 'y' -or $key.Character -eq 'Y') {
                Write-Host "Y" -ForegroundColor Green
                Invoke-Expression $suggestion
                $CommandLookupEventArgs.StopSearch = $true
                return
            } else {
                Write-Host $key.Character -ForegroundColor Red
            }
        }
        
        # Fuzzy matching for crypto commands
        $cryptoCommands = @('Get-CryptoData', 'Start-CryptoMonitor', 'Get-CryptoMonitorStatus', 'Test-CryptoNotifications', 'Get-CryptoAlerts')
        $matches = $cryptoCommands | Where-Object { 
            $_.ToLower().Contains($lowerCommand) -or 
            (Get-LevenshteinDistance $_.ToLower() $lowerCommand) -le 2 
        }
        
        if ($matches.Count -eq 1) {
            Write-Host "💡 Did you mean: " -NoNewline -ForegroundColor Yellow
            Write-Host $matches[0] -ForegroundColor Green
            Write-Host "Press Y to execute, any other key to cancel: " -NoNewline -ForegroundColor Cyan
            
            $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            if ($key.Character -eq 'y' -or $key.Character -eq 'Y') {
                Write-Host "Y" -ForegroundColor Green
                Invoke-Expression $matches[0]
                $CommandLookupEventArgs.StopSearch = $true
                return
            } else {
                Write-Host $key.Character -ForegroundColor Red
            }
        } elseif ($matches.Count -gt 1) {
            Write-Host "💡 Similar crypto commands found:" -ForegroundColor Yellow
            for ($i = 0; $i -lt $matches.Count; $i++) {
                Write-Host "  $($i + 1). $($matches[$i])" -ForegroundColor Green
            }
        }
    }
}

# Levenshtein distance function for fuzzy matching
function Get-LevenshteinDistance {
    param([string]$String1, [string]$String2)
    
    if ($String1.Length -eq 0) { return $String2.Length }
    if ($String2.Length -eq 0) { return $String1.Length }
    
    $matrix = New-Object 'int[,]' ($String1.Length + 1), ($String2.Length + 1)
    
    for ($i = 0; $i -le $String1.Length; $i++) { $matrix[$i, 0] = $i }
    for ($j = 0; $j -le $String2.Length; $j++) { $matrix[0, $j] = $j }
    
    for ($i = 1; $i -le $String1.Length; $i++) {
        for ($j = 1; $j -le $String2.Length; $j++) {
            $cost = if ($String1[$i - 1] -eq $String2[$j - 1]) { 0 } else { 1 }
            $matrix[$i, $j] = [Math]::Min([Math]::Min($matrix[$i - 1, $j] + 1, $matrix[$i, $j - 1] + 1), $matrix[$i - 1, $j - 1] + $cost)
        }
    }
    
    return $matrix[$String1.Length, $String2.Length]
}

# Enhanced prompt with crypto info and shell status
function prompt {
    try {
        $location = Get-Location
        $cryptoIcon = "₿"
        $shellStatus = "🟢"
        
        # Quick crypto status check (non-blocking)
        try {
            $quickStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/crypto" -Method Get -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($quickStatus.success -and $quickStatus.data.Count -gt 0) {
                $btcData = $quickStatus.data | Where-Object { $_.symbol -eq "BTC" }
                if ($btcData) {
                    $price = [math]::Round($btcData.price)
                    $change = [math]::Round($btcData.change_24h, 1)
                    $changeIcon = if ($change -gt 0) { "📈" } else { "📉" }
                    $cryptoIcon = "₿$price$changeIcon$change%"
                }
                $shellStatus = "🟢"
            } else {
                $shellStatus = "🟡"
                $cryptoIcon = "₿offline"
            }
        }
        catch {
            $shellStatus = "🔴"
            $cryptoIcon = "₿offline"
        }
        
        # Check if we're in the crypto directory
        $isInCryptoDir = $location.Path.Contains("cryptoanalysis1")
        $dirIcon = if ($isInCryptoDir) { "🚀" } else { "📁" }
        
        # Build prompt
        Write-Host "[$shellStatus" -NoNewline -ForegroundColor White
        Write-Host "$cryptoIcon" -NoNewline -ForegroundColor Yellow
        Write-Host "] " -NoNewline -ForegroundColor White
        Write-Host "$dirIcon " -NoNewline -ForegroundColor Cyan
        Write-Host "$($location.Path.Split('\')[-1])" -NoNewline -ForegroundColor Cyan
        
        return "> "
    }
    catch {
        return "PS $($executionContext.SessionState.Path.CurrentLocation)> "
    }
}

# Auto-completion for crypto parameters
$cryptoParameterCompleter = {
    param($commandName, $parameterName, $wordToComplete, $commandAst, $fakeBoundParameters)
    
    switch ($parameterName) {
        'Symbol' {
            $cryptoSymbols | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', "Cryptocurrency symbol: $_")
            }
        }
        'RefreshSeconds' {
            @(5, 10, 15, 30, 60) | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', "Refresh interval: $_ seconds")
            }
        }
        'AlertThreshold' {
            @(1, 2, 5, 10, 15) | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', "Alert threshold: ±$_%")
            }
        }
    }
}

# Register completers for all crypto commands
$cryptoCommands = @('Get-CryptoData', 'Start-CryptoMonitor', 'Start-CryptoPriceAlert', 'Get-CryptoPortfolio')
foreach ($command in $cryptoCommands) {
    Register-ArgumentCompleter -CommandName $command -ParameterName Symbol -ScriptBlock $cryptoParameterCompleter
    Register-ArgumentCompleter -CommandName $command -ParameterName RefreshSeconds -ScriptBlock $cryptoParameterCompleter
    Register-ArgumentCompleter -CommandName $command -ParameterName AlertThreshold -ScriptBlock $cryptoParameterCompleter
}

# Smart aliases with context awareness
function Set-CryptoAliases {
    # Remove existing aliases if they exist
    $aliases = @('crypto', 'monitor', 'status', 'alerts', 'test-notify', 'portfolio', 'trends')
    foreach ($alias in $aliases) {
        if (Get-Alias -Name $alias -ErrorAction SilentlyContinue) {
            Remove-Alias -Name $alias -Force
        }
    }
    
    # Set new aliases
    Set-Alias -Name crypto -Value Get-CryptoData -Scope Global
    Set-Alias -Name monitor -Value Start-CryptoMonitor -Scope Global
    Set-Alias -Name status -Value Get-CryptoMonitorStatus -Scope Global
    Set-Alias -Name alerts -Value Get-CryptoAlerts -Scope Global
    Set-Alias -Name test-notify -Value Test-CryptoNotifications -Scope Global
    
    # Context-aware functions
    function btc { Get-CryptoData -Symbol BTC }
    function eth { Get-CryptoData -Symbol ETH }
    function ada { Get-CryptoData -Symbol ADA }
    function portfolio { Get-CryptoPortfolio }
    function trends { Get-CryptoTrendAnalysis }
    function quick-monitor { Start-CryptoMonitor -RefreshSeconds 10 -WatchSymbols @('BTC','ETH','ADA') }
    
    Write-Host "✅ Smart aliases and shortcuts configured" -ForegroundColor Green
}

# Command history analysis for crypto commands
function Show-CryptoUsageStats {
    $history = Get-History | Where-Object { 
        $_.CommandLine -like "*crypto*" -or 
        $_.CommandLine -like "*Get-Crypto*" -or 
        $_.CommandLine -like "*Start-Crypto*" -or
        $_.CommandLine -like "*Test-Crypto*"
    }
    
    if ($history.Count -gt 0) {
        Write-Host "`n📊 Crypto Command Usage Statistics:" -ForegroundColor Cyan
        $grouped = $history | Group-Object { $_.CommandLine.Split(' ')[0] } | Sort-Object Count -Descending
        
        foreach ($group in $grouped) {
            Write-Host "  $($group.Name): $($group.Count) times" -ForegroundColor White
        }
        
        Write-Host "`n⏱️ Most recent crypto command:" -ForegroundColor Yellow
        Write-Host "  $($history[-1].CommandLine)" -ForegroundColor Gray
    } else {
        Write-Host "No crypto command history found" -ForegroundColor Yellow
    }
}

# Initialize shell integration
function Initialize-CryptoShellIntegration {
    Write-Host "`n🚀 Initializing Crypto Shell Integration..." -ForegroundColor Cyan
    
    try {
        # Enable command detection
        Enable-CryptoCommandDetection
        Write-Host "✅ Command detection enabled" -ForegroundColor Green
        
        # Set aliases
        Set-CryptoAliases
        Write-Host "✅ Smart aliases configured" -ForegroundColor Green
        
        # Test server connection
        try {
            $testResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/status" -Method Get -TimeoutSec 3
            Write-Host "✅ Crypto service connection verified" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️ Crypto service not running - use 'node simple-server.js' to start" -ForegroundColor Yellow
        }
        
        Write-Host "`n🎯 Shell Integration Ready!" -ForegroundColor Green
        Write-Host "Quick commands: crypto, monitor, status, alerts, btc, eth, ada" -ForegroundColor Yellow
        Write-Host "Shortcuts: Ctrl+Shift+C/M/S/T for quick access" -ForegroundColor Yellow
        
    }
    catch {
        Write-Error "Failed to initialize shell integration: $($_.Exception.Message)"
    }
}

# Auto-initialize when script is loaded
Initialize-CryptoShellIntegration

# Export functions for external use
Export-ModuleMember -Function @(
    'Enable-CryptoCommandDetection',
    'Set-CryptoAliases', 
    'Show-CryptoUsageStats',
    'Initialize-CryptoShellIntegration'
)
