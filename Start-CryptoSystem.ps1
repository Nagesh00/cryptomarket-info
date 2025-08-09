# Crypto Monitor System Startup Script
# This script initializes the complete crypto monitoring system

Write-Host "🚀 Initializing Crypto Monitor System..." -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n1️⃣ Checking Prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found - Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check if we're in the right directory
$requiredFiles = @('simple-server.js', 'CryptoMonitor.psm1', 'package.json')
$missing = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Host "   ❌ Missing files: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "   Please ensure you're in the correct directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "   ✅ All required files found" -ForegroundColor Green

# Load PowerShell modules
Write-Host "`n2️⃣ Loading PowerShell Modules..." -ForegroundColor Yellow

try {
    Import-Module .\CryptoMonitor.psm1 -Force
    Write-Host "   ✅ CryptoMonitor.psm1 loaded" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Could not load CryptoMonitor.psm1: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    Import-Module .\CryptoCommandDetection.psm1 -Force
    Write-Host "   ✅ CryptoCommandDetection.psm1 loaded" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Could not load CryptoCommandDetection.psm1: $($_.Exception.Message)" -ForegroundColor Yellow
}

if (Test-Path .\CryptoShellIntegration.ps1) {
    try {
        . .\CryptoShellIntegration.ps1
        Write-Host "   ✅ Shell integration loaded" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Could not load shell integration: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Check environment variables
Write-Host "`n3️⃣ Checking Environment Configuration..." -ForegroundColor Yellow

if (Test-Path .env) {
    $envContent = Get-Content .env
    $requiredVars = @('TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'EMAIL_USER', 'EMAIL_PASS')
    $foundVars = @()
    
    foreach ($line in $envContent) {
        if ($line -match '^([^=]+)=') {
            $foundVars += $matches[1]
        }
    }
    
    foreach ($var in $requiredVars) {
        if ($foundVars -contains $var) {
            Write-Host "   ✅ $var configured" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ $var not found" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ⚠️ .env file not found - notifications may not work" -ForegroundColor Yellow
}

# Start Node.js server
Write-Host "`n4️⃣ Starting Node.js Server..." -ForegroundColor Yellow

# Kill any existing processes on port 3000
try {
    $existingProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($existingProcess) {
        $processId = $existingProcess.OwningProcess
        Stop-Process -Id $processId -Force
        Write-Host "   🔄 Stopped existing process on port 3000" -ForegroundColor Yellow
        Start-Sleep 2
    }
} catch {
    # Port might not be in use
}

# Start the server
Write-Host "   🚀 Starting crypto server..." -ForegroundColor Cyan
$serverJob = Start-Job -ScriptBlock {
    param($workingDir)
    Set-Location $workingDir
    node simple-server.js
} -ArgumentList (Get-Location).Path

# Wait a moment for server to start
Start-Sleep 3

# Test server
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get -TimeoutSec 5
    Write-Host "   ✅ Server started successfully!" -ForegroundColor Green
    Write-Host "   📊 Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️ Server may still be starting..." -ForegroundColor Yellow
}

# Test notifications if available
Write-Host "`n5️⃣ Testing Notification System..." -ForegroundColor Yellow

if (Get-Command Test-CryptoNotifications -ErrorAction SilentlyContinue) {
    try {
        Test-CryptoNotifications
        Write-Host "   ✅ Notification test completed" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Notification test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️ Test-CryptoNotifications function not available" -ForegroundColor Yellow
}

# Setup complete
Write-Host "`n🎉 Crypto Monitor System Ready!" -ForegroundColor Green
Write-Host "`n📋 Available Commands:" -ForegroundColor Cyan
Write-Host "   crypto           - Get crypto data" -ForegroundColor White
Write-Host "   monitor          - Start monitoring" -ForegroundColor White
Write-Host "   status           - Check system status" -ForegroundColor White
Write-Host "   alerts           - View alerts" -ForegroundColor White
Write-Host "   test-notify      - Test notifications" -ForegroundColor White
Write-Host "   btc, eth, ada    - Quick crypto data" -ForegroundColor White
Write-Host "`n🌐 Web Interface: http://localhost:3000" -ForegroundColor Cyan
Write-Host "💾 Server Job ID: $($serverJob.Id) (use Get-Job to check status)" -ForegroundColor Gray

Write-Host "`nSystem is ready! Try typing 'crypto' or 'monitor' to get started." -ForegroundColor Green
