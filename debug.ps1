Write-Host "🔍 Crypto Monitor Debug & Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "📋 System Check:" -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found or not working" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
}

# Check dependencies
Write-Host ""
Write-Host "📦 Dependencies:" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $packageCount = (Get-ChildItem "node_modules" | Measure-Object).Count
    Write-Host "✅ node_modules exists with $packageCount packages" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules not found - installing dependencies..." -ForegroundColor Red
    npm install express axios ws dotenv --no-optional
}

# Check files
Write-Host ""
Write-Host "📁 Project Files:" -ForegroundColor Yellow
$files = @("package.json", ".env", "test-server.js", "src/index.js")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Check API keys
Write-Host ""
Write-Host "🔑 API Configuration:" -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "COINMARKETCAP_API_KEY=(.+)") {
        $apiKey = $matches[1]
        if ($apiKey -ne "your_coinmarketcap_api_key_here" -and $apiKey.Length -gt 10) {
            Write-Host "✅ CoinMarketCap API Key configured" -ForegroundColor Green
        } else {
            Write-Host "❌ CoinMarketCap API Key not configured" -ForegroundColor Red
        }
    }
    
    if ($envContent -match "COINGECKO_API_KEY=(.+)") {
        $apiKey = $matches[1]
        if ($apiKey -ne "your_coingecko_api_key_here" -and $apiKey.Length -gt 10) {
            Write-Host "✅ CoinGecko API Key configured" -ForegroundColor Green
        } else {
            Write-Host "❌ CoinGecko API Key not configured" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🚀 Ready to start?" -ForegroundColor Yellow
Write-Host "Run: node test-server.js" -ForegroundColor Cyan
Write-Host "Or: node src/index.js (for full system)" -ForegroundColor Cyan
