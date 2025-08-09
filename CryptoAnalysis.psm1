# Advanced Crypto Analysis PowerShell Scripts
# Collection of useful functions for crypto trading and analysis

function Get-CryptoTrendAnalysis {
    [CmdletBinding()]
    param(
        [string[]]$Symbols = @("BTC", "ETH", "ADA", "DOT", "LINK"),
        [int]$SampleCount = 10,
        [int]$IntervalSeconds = 30
    )
    
    Write-Host "📊 Starting Crypto Trend Analysis..." -ForegroundColor Cyan
    Write-Host "Symbols: $($Symbols -join ', ')" -ForegroundColor Yellow
    Write-Host "Samples: $SampleCount every $IntervalSeconds seconds`n" -ForegroundColor Yellow
    
    $trends = @{}
    $samples = @{}
    
    # Initialize tracking
    foreach ($symbol in $Symbols) {
        $trends[$symbol] = @()
        $samples[$symbol] = @()
    }
    
    for ($i = 1; $i -le $SampleCount; $i++) {
        Write-Host "📈 Sample $i/$SampleCount - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
        
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/crypto" -Method Get
            
            if ($response.success) {
                foreach ($symbol in $Symbols) {
                    $coin = $response.data | Where-Object { $_.symbol -eq $symbol }
                    if ($coin) {
                        $samples[$symbol] += [PSCustomObject]@{
                            Timestamp = Get-Date
                            Price = $coin.price
                            Change24h = $coin.change_24h
                            Volume = $coin.volume_24h
                        }
                        
                        Write-Host "   $symbol`: $([math]::Round($coin.price, 4))" -ForegroundColor White
                    }
                }
            }
        }
        catch {
            Write-Warning "Failed to get data for sample $i"
        }
        
        if ($i -lt $SampleCount) {
            Start-Sleep -Seconds $IntervalSeconds
        }
    }
    
    # Analyze trends
    Write-Host "`n📊 Trend Analysis Results:" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor DarkGray
    
    foreach ($symbol in $Symbols) {
        if ($samples[$symbol].Count -ge 2) {
            $data = $samples[$symbol]
            $firstPrice = $data[0].Price
            $lastPrice = $data[-1].Price
            $avgPrice = ($data | Measure-Object -Property Price -Average).Average
            $priceChange = (($lastPrice - $firstPrice) / $firstPrice) * 100
            
            $trend = if ($priceChange -gt 1) { "📈 Strong Up" }
                    elseif ($priceChange -gt 0.1) { "↗️ Up" }
                    elseif ($priceChange -lt -1) { "📉 Strong Down" }
                    elseif ($priceChange -lt -0.1) { "↘️ Down" }
                    else { "➡️ Stable" }
            
            $trendColor = if ($priceChange -gt 0) { "Green" } else { "Red" }
            
            Write-Host "`n🪙 $symbol Analysis:" -ForegroundColor Yellow
            Write-Host "   First Price: $([math]::Round($firstPrice, 6))" -ForegroundColor White
            Write-Host "   Last Price:  $([math]::Round($lastPrice, 6))" -ForegroundColor White
            Write-Host "   Avg Price:   $([math]::Round($avgPrice, 6))" -ForegroundColor White
            Write-Host "   Change:      $([math]::Round($priceChange, 2))%" -ForegroundColor $trendColor
            Write-Host "   Trend:       $trend" -ForegroundColor $trendColor
            Write-Host "   Volatility:  $([math]::Round(($data | Measure-Object -Property Price -StandardDeviation).StandardDeviation, 6))" -ForegroundColor Gray
        }
    }
}

function Export-CryptoData {
    [CmdletBinding()]
    param(
        [string]$OutputPath = "crypto-export-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv",
        [string]$Format = "CSV"
    )
    
    try {
        Write-Host "📤 Exporting crypto data..." -ForegroundColor Cyan
        
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/crypto" -Method Get
        
        if ($response.success) {
            $data = $response.data | Select-Object name, symbol, price, change_24h, market_cap, volume_24h, source, timestamp
            
            switch ($Format.ToUpper()) {
                "CSV" {
                    $data | Export-Csv -Path $OutputPath -NoTypeInformation
                    Write-Host "✅ Data exported to: $OutputPath" -ForegroundColor Green
                }
                "JSON" {
                    $data | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputPath -Encoding UTF8
                    Write-Host "✅ Data exported to: $OutputPath" -ForegroundColor Green
                }
                "XML" {
                    $data | Export-Clixml -Path $OutputPath
                    Write-Host "✅ Data exported to: $OutputPath" -ForegroundColor Green
                }
                default {
                    Write-Error "Unsupported format: $Format"
                }
            }
            
            Write-Host "📊 Exported $($data.Count) cryptocurrencies" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Error "Failed to export data: $($_.Exception.Message)"
    }
}

function Start-CryptoPriceAlert {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Symbol,
        [Parameter(Mandatory)]
        [double]$TargetPrice,
        [string]$Condition = "above", # above, below, equal
        [int]$CheckIntervalSeconds = 30
    )
    
    Write-Host "🚨 Setting up price alert for $Symbol" -ForegroundColor Cyan
    Write-Host "Target: $TargetPrice ($Condition)" -ForegroundColor Yellow
    Write-Host "Check interval: $CheckIntervalSeconds seconds" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop monitoring`n" -ForegroundColor Gray
    
    while ($true) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/crypto" -Method Get
            
            if ($response.success) {
                $coin = $response.data | Where-Object { $_.symbol -eq $Symbol.ToUpper() }
                
                if ($coin) {
                    $currentPrice = $coin.price
                    $timestamp = Get-Date -Format "HH:mm:ss"
                    
                    $alertTriggered = $false
                    switch ($Condition.ToLower()) {
                        "above" { $alertTriggered = $currentPrice -gt $TargetPrice }
                        "below" { $alertTriggered = $currentPrice -lt $TargetPrice }
                        "equal" { $alertTriggered = [math]::Abs($currentPrice - $TargetPrice) -lt 0.01 }
                    }
                    
                    if ($alertTriggered) {
                        $alertMessage = "🚨 PRICE ALERT: $Symbol reached $([math]::Round($currentPrice, 6)) ($Condition $TargetPrice)"
                        Write-Host $alertMessage -ForegroundColor Magenta
                        
                        # Windows notification
                        try {
                            Add-Type -AssemblyName System.Windows.Forms
                            $balloon = New-Object System.Windows.Forms.NotifyIcon
                            $balloon.Icon = [System.Drawing.SystemIcons]::Exclamation
                            $balloon.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Warning
                            $balloon.BalloonTipText = "Price: $([math]::Round($currentPrice, 6))"
                            $balloon.BalloonTipTitle = "Crypto Alert: $Symbol"
                            $balloon.Visible = $true
                            $balloon.ShowBalloonTip(10000)
                            Start-Sleep -Seconds 2
                            $balloon.Dispose()
                        }
                        catch { }
                        
                        break # Exit after alert
                    }
                    else {
                        Write-Host "[$timestamp] $Symbol`: $([math]::Round($currentPrice, 6)) (Target: $TargetPrice $Condition)" -ForegroundColor Gray
                    }
                }
                else {
                    Write-Warning "Symbol $Symbol not found"
                }
            }
        }
        catch {
            Write-Warning "Error checking price: $($_.Exception.Message)"
        }
        
        Start-Sleep -Seconds $CheckIntervalSeconds
    }
}

function Get-CryptoPortfolio {
    [CmdletBinding()]
    param(
        [hashtable]$Holdings = @{
            "BTC" = 0.1
            "ETH" = 2.5
            "ADA" = 1000
        }
    )
    
    Write-Host "💼 Portfolio Analysis" -ForegroundColor Cyan
    Write-Host "=" * 40 -ForegroundColor DarkGray
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/crypto" -Method Get
        
        if ($response.success) {
            $totalValue = 0
            $portfolioData = @()
            
            foreach ($symbol in $Holdings.Keys) {
                $coin = $response.data | Where-Object { $_.symbol -eq $symbol }
                if ($coin) {
                    $amount = $Holdings[$symbol]
                    $value = $amount * $coin.price
                    $totalValue += $value
                    
                    $portfolioData += [PSCustomObject]@{
                        Symbol = $symbol
                        Name = $coin.name
                        Amount = $amount
                        Price = $coin.price
                        Value = $value
                        Change24h = $coin.change_24h
                        PercentOfPortfolio = 0 # Will calculate after total
                    }
                }
            }
            
            # Calculate percentages
            foreach ($item in $portfolioData) {
                $item.PercentOfPortfolio = ($item.Value / $totalValue) * 100
            }
            
            # Display results
            foreach ($item in $portfolioData) {
                $changeColor = if ($item.Change24h -ge 0) { "Green" } else { "Red" }
                $changeIcon = if ($item.Change24h -ge 0) { "📈" } else { "📉" }
                
                Write-Host "`n🪙 $($item.Name) ($($item.Symbol))" -ForegroundColor Yellow
                Write-Host "   Amount: $($item.Amount)" -ForegroundColor White
                Write-Host "   Price: $([math]::Round($item.Price, 6))" -ForegroundColor White
                Write-Host "   Value: $([math]::Round($item.Value, 2))" -ForegroundColor Green
                Write-Host "   24h Change: $changeIcon $([math]::Round($item.Change24h, 2))%" -ForegroundColor $changeColor
                Write-Host "   Portfolio %: $([math]::Round($item.PercentOfPortfolio, 1))%" -ForegroundColor Cyan
            }
            
            Write-Host "`n💰 Total Portfolio Value: $([math]::Round($totalValue, 2))" -ForegroundColor Green
            
            # Portfolio summary
            $positiveCoins = ($portfolioData | Where-Object { $_.Change24h -gt 0 }).Count
            $negativeCoins = ($portfolioData | Where-Object { $_.Change24h -lt 0 }).Count
            
            Write-Host "`n📊 Portfolio Summary:" -ForegroundColor Cyan
            Write-Host "   Coins gaining: $positiveCoins" -ForegroundColor Green
            Write-Host "   Coins losing: $negativeCoins" -ForegroundColor Red
            Write-Host "   Total coins: $($portfolioData.Count)" -ForegroundColor White
        }
    }
    catch {
        Write-Error "Failed to analyze portfolio: $($_.Exception.Message)"
    }
}

# Export functions
Export-ModuleMember -Function @(
    'Get-CryptoTrendAnalysis',
    'Export-CryptoData',
    'Start-CryptoPriceAlert',
    'Get-CryptoPortfolio'
)
