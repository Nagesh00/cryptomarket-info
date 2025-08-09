# IMMEDIATE TELEGRAM TEST - PowerShell Version
Write-Host "🚀 IMMEDIATE TELEGRAM NOTIFICATION TEST" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor Yellow

# Load environment variables
$envFile = ".\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Get credentials
$token = $env:TELEGRAM_BOT_TOKEN
$chatId = $env:TELEGRAM_CHAT_ID

if (-not $token -or -not $chatId) {
    Write-Host "❌ Missing Telegram credentials!" -ForegroundColor Red
    Write-Host "Token: $($token ? 'Found' : 'Missing')" -ForegroundColor Yellow
    Write-Host "Chat ID: $($chatId ? 'Found' : 'Missing')" -ForegroundColor Yellow
    exit 1
}

Write-Host "📱 Telegram credentials found" -ForegroundColor Green
Write-Host "Token: $($token.Substring(0, 10))..." -ForegroundColor Gray
Write-Host "Chat ID: $chatId" -ForegroundColor Gray

# Prepare message
$message = @"
🚨 IMMEDIATE CRYPTO ALERT! 🚨

✅ Your real-time notification system is WORKING!
⏰ $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
📈 Bitcoin price alert! (Test notification)
🔥 24/7 monitoring is ACTIVE!

This is an immediate test from your PowerShell crypto monitor!
"@

# Send to Telegram
try {
    Write-Host "`n📤 Sending Telegram message..." -ForegroundColor Cyan
    
    $url = "https://api.telegram.org/bot$token/sendMessage"
    $body = @{
        chat_id = $chatId
        text = $message
        parse_mode = "HTML"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 15
    
    if ($response.ok) {
        Write-Host "✅ TELEGRAM SUCCESS!" -ForegroundColor Green
        Write-Host "📱 Message ID: $($response.result.message_id)" -ForegroundColor Green
        Write-Host "🎉 Check your Telegram now - you should have received the alert!" -ForegroundColor Cyan
    } else {
        Write-Host "❌ TELEGRAM FAILED!" -ForegroundColor Red
        Write-Host "Error: $($response.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ TELEGRAM ERROR!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔔 If successful, your real-time notifications are working!" -ForegroundColor Green
Write-Host "✅ Test completed at: $(Get-Date)" -ForegroundColor Yellow
