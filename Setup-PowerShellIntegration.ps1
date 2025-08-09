# PowerShell Integration Setup Script
# Run this script to enable PowerShell integration for Crypto Monitor

Write-Host "🚀 Setting up PowerShell Integration for Crypto Monitor..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (!$isAdmin) {
    Write-Host "⚠️ Note: Some features require Administrator privileges" -ForegroundColor Yellow
}

# Get current directory
$currentDir = $PSScriptRoot
$moduleFile = Join-Path $currentDir "CryptoMonitor.psm1"
$profileFile = Join-Path $currentDir "CryptoProfile.ps1"

Write-Host "`n📂 Current directory: $currentDir" -ForegroundColor White

# Check if module file exists
if (Test-Path $moduleFile) {
    Write-Host "✅ CryptoMonitor.psm1 found" -ForegroundColor Green
} else {
    Write-Error "❌ CryptoMonitor.psm1 not found!"
    exit 1
}

# Check if profile file exists
if (Test-Path $profileFile) {
    Write-Host "✅ CryptoProfile.ps1 found" -ForegroundColor Green
} else {
    Write-Error "❌ CryptoProfile.ps1 not found!"
    exit 1
}

# Test module import
Write-Host "`n🔧 Testing module import..." -ForegroundColor Cyan
try {
    Import-Module $moduleFile -Force
    Write-Host "✅ Module imported successfully!" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to import module: $($_.Exception.Message)"
    exit 1
}

# Create PowerShell module directory if it doesn't exist
$userModulePath = Join-Path $env:USERPROFILE "Documents\WindowsPowerShell\Modules\CryptoMonitor"
if (!(Test-Path $userModulePath)) {
    Write-Host "`n📁 Creating user module directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $userModulePath -Force | Out-Null
    Write-Host "✅ Directory created: $userModulePath" -ForegroundColor Green
}

# Copy module to user modules directory
Write-Host "`n📋 Installing module to user directory..." -ForegroundColor Cyan
try {
    Copy-Item $moduleFile -Destination $userModulePath -Force
    Write-Host "✅ Module installed to: $userModulePath" -ForegroundColor Green
} catch {
    Write-Warning "⚠️ Could not install to user modules: $($_.Exception.Message)"
}

# Setup PowerShell profile integration
$profilePath = $PROFILE
Write-Host "`n⚙️ Setting up PowerShell profile integration..." -ForegroundColor Cyan
Write-Host "Profile path: $profilePath" -ForegroundColor Gray

# Create profile directory if it doesn't exist
$profileDir = Split-Path $profilePath
if (!(Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Add crypto module import to profile
$importCommand = @"

# Crypto Monitor Integration
`$cryptoModulePath = "$moduleFile"
if (Test-Path `$cryptoModulePath) {
    Import-Module `$cryptoModulePath -Force
    Set-Alias -Name crypto -Value Get-CryptoData
    Set-Alias -Name monitor -Value Start-CryptoMonitor
    Set-Alias -Name status -Value Get-CryptoMonitorStatus
    Write-Host "🚀 Crypto Monitor commands available!" -ForegroundColor Green
}
"@

# Check if already added to profile
if (Test-Path $profilePath) {
    $profileContent = Get-Content $profilePath -Raw
    if ($profileContent -like "*Crypto Monitor Integration*") {
        Write-Host "✅ Profile already configured" -ForegroundColor Green
    } else {
        Add-Content -Path $profilePath -Value $importCommand
        Write-Host "✅ Added to PowerShell profile" -ForegroundColor Green
    }
} else {
    Set-Content -Path $profilePath -Value $importCommand
    Write-Host "✅ Created PowerShell profile with crypto integration" -ForegroundColor Green
}

# Test if crypto service is running
Write-Host "`n🔍 Testing crypto service connection..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/status" -Method Get -TimeoutSec 5
    Write-Host "✅ Crypto service is running!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor White
    Write-Host "   Data count: $($response.data_count)" -ForegroundColor White
} catch {
    Write-Host "⚠️ Crypto service not running - start with: node simple-server.js" -ForegroundColor Yellow
}

# Create desktop shortcut for PowerShell with crypto module
Write-Host "`n🖥️ Creating desktop shortcut..." -ForegroundColor Cyan
try {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut("$env:USERPROFILE\Desktop\Crypto Monitor PowerShell.lnk")
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"$profileFile`""
    $shortcut.WorkingDirectory = $currentDir
    $shortcut.IconLocation = "powershell.exe,0"
    $shortcut.Description = "PowerShell with Crypto Monitor integration"
    $shortcut.Save()
    Write-Host "✅ Desktop shortcut created" -ForegroundColor Green
} catch {
    Write-Warning "⚠️ Could not create desktop shortcut: $($_.Exception.Message)"
}

# Setup scheduled task to start crypto service (optional)
Write-Host "`n⏰ Setting up auto-start (optional)..." -ForegroundColor Cyan
$setupAutoStart = Read-Host "Do you want to auto-start the crypto service with Windows? (y/N)"
if ($setupAutoStart -eq 'y' -or $setupAutoStart -eq 'Y') {
    try {
        $action = New-ScheduledTaskAction -Execute "node" -Argument "simple-server.js" -WorkingDirectory $currentDir
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
        $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
        
        Register-ScheduledTask -TaskName "CryptoMonitor" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
        Write-Host "✅ Auto-start scheduled task created" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️ Could not create scheduled task: $($_.Exception.Message)"
    }
}

Write-Host "`n🎉 PowerShell Integration Setup Complete!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor DarkGray
Write-Host "`n📋 Available Commands:" -ForegroundColor Yellow
Write-Host "   crypto          - Get crypto data" -ForegroundColor White
Write-Host "   monitor         - Start real-time monitoring" -ForegroundColor White
Write-Host "   status          - Check system status" -ForegroundColor White
Write-Host "   Show-CryptoHelp - Show full command list" -ForegroundColor White

Write-Host "`n🚀 Quick Start:" -ForegroundColor Cyan
Write-Host "   1. Start crypto service: node simple-server.js" -ForegroundColor Gray
Write-Host "   2. Open new PowerShell window" -ForegroundColor Gray
Write-Host "   3. Type 'crypto' to get crypto data" -ForegroundColor Gray
Write-Host "   4. Type 'monitor' to start real-time monitoring" -ForegroundColor Gray

Write-Host "`n🌐 Web Dashboard: http://localhost:3000/simple.html" -ForegroundColor Cyan

# Test commands demonstration
Write-Host "`n🧪 Testing commands..." -ForegroundColor Cyan
Write-Host "Running: Show-CryptoHelp" -ForegroundColor Gray
Show-CryptoHelp
