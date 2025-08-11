# Advanced Crypto Project Monitor - Complete Setup Script
# Automated installation and configuration for the comprehensive crypto monitoring system

import os
import sys
import subprocess
import json
import shutil
import platform
from pathlib import Path

class CryptoMonitorSetup:
    """
    Complete setup and installation manager for the Advanced Crypto Project Monitor
    """
    
    def __init__(self):
        self.system = platform.system().lower()
        self.project_dir = Path.cwd()
        self.config_file = self.project_dir / "crypto_monitor_config.json"
        self.requirements_installed = False
        self.env_configured = False
        
    def run_setup(self):
        """Run the complete setup process"""
        print("🚀 Advanced Crypto Project Monitor - Complete Setup")
        print("=" * 60)
        
        try:
            # Check system requirements
            print("\n1. Checking system requirements...")
            self.check_system_requirements()
            
            # Install dependencies
            print("\n2. Installing dependencies...")
            self.install_dependencies()
            
            # Setup directories
            print("\n3. Setting up directories...")
            self.setup_directories()
            
            # Configure environment
            print("\n4. Configuring environment...")
            self.configure_environment()
            
            # Initialize configuration
            print("\n5. Initializing configuration...")
            self.initialize_configuration()
            
            # Setup VS Code extension
            print("\n6. Setting up VS Code extension...")
            self.setup_vscode_extension()
            
            # Final verification
            print("\n7. Running system verification...")
            self.verify_installation()
            
            print(f"\n✅ Setup completed successfully!")
            print("=" * 60)
            self.print_next_steps()
            
        except Exception as e:
            print(f"\n❌ Setup failed: {e}")
            sys.exit(1)
    
    def check_system_requirements(self):
        """Check if system meets requirements"""
        requirements = {
            'node': '18.0.0',
            'python': '3.8.0', 
            'npm': '8.0.0'
        }
        
        for tool, min_version in requirements.items():
            if not self.check_tool_version(tool, min_version):
                raise Exception(f"{tool} {min_version}+ is required but not found")
        
        print("✅ All system requirements met")
    
    def check_tool_version(self, tool, min_version):
        """Check if a tool is installed with minimum version"""
        try:
            if tool == 'node':
                result = subprocess.run(['node', '--version'], capture_output=True, text=True)
                version = result.stdout.strip().replace('v', '')
            elif tool == 'python':
                result = subprocess.run([sys.executable, '--version'], capture_output=True, text=True)
                version = result.stdout.strip().split()[1]
            elif tool == 'npm':
                result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
                version = result.stdout.strip()
            else:
                return False
            
            print(f"   ✅ {tool} {version} found")
            return self.version_compare(version, min_version) >= 0
            
        except Exception as e:
            print(f"   ❌ {tool} not found: {e}")
            return False
    
    def version_compare(self, version1, version2):
        """Compare two version strings"""
        v1_parts = [int(x) for x in version1.split('.')]
        v2_parts = [int(x) for x in version2.split('.')]
        
        # Pad shorter version with zeros
        max_len = max(len(v1_parts), len(v2_parts))
        v1_parts += [0] * (max_len - len(v1_parts))
        v2_parts += [0] * (max_len - len(v2_parts))
        
        for v1, v2 in zip(v1_parts, v2_parts):
            if v1 > v2:
                return 1
            elif v1 < v2:
                return -1
        return 0
    
    def install_dependencies(self):
        """Install all required dependencies"""
        
        # Install Node.js dependencies
        print("   📦 Installing Node.js dependencies...")
        node_packages = [
            'express', 'ws', 'axios', 'cors', 'helmet',
            'dotenv', 'node-cron', 'nodemailer'
        ]
        
        self.run_command(['npm', 'install'] + node_packages)
        print("   ✅ Node.js dependencies installed")
        
        # Install Python dependencies
        print("   🐍 Installing Python dependencies...")
        python_packages = [
            'requests', 'aiohttp', 'numpy', 'pandas', 
            'textblob', 'asyncio', 'websockets'
        ]
        
        for package in python_packages:
            try:
                self.run_command([sys.executable, '-m', 'pip', 'install', package])
            except:
                print(f"   ⚠️ Failed to install {package}, continuing...")
        
        print("   ✅ Python dependencies installed")
        
        # Download NLTK data for TextBlob
        try:
            import nltk
            nltk.download('punkt', quiet=True)
            nltk.download('brown', quiet=True)
            print("   ✅ NLTK data downloaded")
        except:
            print("   ⚠️ NLTK data download failed")
    
    def setup_directories(self):
        """Create necessary directories"""
        directories = [
            'data',
            'logs', 
            'backups',
            'exports',
            'models',
            'public',
            'vscode-extension/out'
        ]
        
        for directory in directories:
            dir_path = self.project_dir / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"   ✅ Created directory: {directory}")
    
    def configure_environment(self):
        """Configure environment variables"""
        env_file = self.project_dir / '.env'
        
        if env_file.exists():
            print("   ✅ .env file already exists")
            self.env_configured = True
            return
        
        env_template = """# Advanced Crypto Project Monitor - Environment Configuration

# ========================================
# API Keys (Required for full functionality)
# ========================================

# CoinMarketCap API (for market data)
CMC_API_KEY=your_coinmarketcap_api_key_here

# CoinGecko API (optional, for additional data)
COINGECKO_API_KEY=your_coingecko_api_key_here

# GitHub Token (for repository monitoring)
GITHUB_TOKEN=your_github_token_here

# Social Media APIs
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here

# ========================================
# Notification Settings
# ========================================

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Email Configuration (optional)
SENDER_EMAIL=your-email@example.com
SENDER_PASSWORD=your-app-password
RECIPIENT_EMAIL=recipient@example.com

# Discord Webhook (optional)
DISCORD_WEBHOOK=your_discord_webhook_url_here

# ========================================
# Server Configuration
# ========================================

# Server port
PORT=3000

# Auto-start monitoring
AUTO_START=false

# Development mode
NODE_ENV=production

# ========================================
# Security (optional)
# ========================================

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here

# Database encryption key
DB_ENCRYPTION_KEY=your_database_encryption_key_here

# ========================================
# Advanced Features
# ========================================

# Enable dark web monitoring
DARK_WEB_MONITORING=true

# Enable VS Code integration
VSCODE_INTEGRATION=true

# Enable advanced analytics
ADVANCED_ANALYTICS=true
"""
        
        with open(env_file, 'w') as f:
            f.write(env_template)
        
        print(f"   ✅ Created .env template at {env_file}")
        print("   ⚠️ Please edit .env file with your actual API keys")
        self.env_configured = False
    
    def initialize_configuration(self):
        """Initialize configuration file"""
        try:
            from config_manager import CryptoMonitorConfig
            
            config_manager = CryptoMonitorConfig(str(self.config_file))
            config_manager.setup_directories()
            
            print("   ✅ Configuration initialized")
            
        except ImportError:
            print("   ⚠️ Config manager not available, using basic setup")
            self.create_basic_config()
    
    def create_basic_config(self):
        """Create basic configuration file"""
        basic_config = {
            "version": "2.0.0",
            "server": {"port": 3000},
            "monitoring": {
                "enabled_sources": ["coinmarketcap", "coingecko", "github"],
                "scan_intervals": {"coinmarketcap": 60, "coingecko": 60, "github": 300}
            },
            "notifications": {
                "telegram": {"enabled": True},
                "email": {"enabled": False}
            },
            "analysis": {"enabled_analyzers": ["legitimacy_scorer", "risk_assessor"]},
            "dark_web": {"enabled": True}
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(basic_config, f, indent=2)
        
        print(f"   ✅ Basic configuration created at {self.config_file}")
    
    def setup_vscode_extension(self):
        """Setup VS Code extension"""
        extension_dir = self.project_dir / 'vscode-extension'
        
        if not extension_dir.exists():
            print("   ⚠️ VS Code extension directory not found")
            return
        
        try:
            # Check if TypeScript is available
            result = subprocess.run(['npx', 'tsc', '--version'], 
                                  capture_output=True, text=True, cwd=extension_dir)
            
            if result.returncode != 0:
                print("   📦 Installing TypeScript...")
                self.run_command(['npm', 'install', '-g', 'typescript'])
            
            # Install extension dependencies
            if (extension_dir / 'package.json').exists():
                print("   📦 Installing VS Code extension dependencies...")
                self.run_command(['npm', 'install'], cwd=extension_dir)
                
                # Compile TypeScript
                print("   🔨 Compiling TypeScript...")
                self.run_command(['npx', 'tsc'], cwd=extension_dir)
                
                print("   ✅ VS Code extension setup complete")
            else:
                print("   ⚠️ VS Code extension package.json not found")
                
        except Exception as e:
            print(f"   ⚠️ VS Code extension setup failed: {e}")
    
    def verify_installation(self):
        """Verify the installation is working"""
        verification_tests = [
            ('Configuration file', self.config_file.exists()),
            ('Data directory', (self.project_dir / 'data').exists()),
            ('Logs directory', (self.project_dir / 'logs').exists()),
            ('Node modules', (self.project_dir / 'node_modules').exists()),
            ('.env file', (self.project_dir / '.env').exists())
        ]
        
        all_passed = True
        for test_name, result in verification_tests:
            status = "✅" if result else "❌"
            print(f"   {status} {test_name}")
            if not result:
                all_passed = False
        
        if all_passed:
            print("   ✅ All verification tests passed")
        else:
            print("   ⚠️ Some verification tests failed")
        
        # Test basic functionality
        try:
            print("   🧪 Testing Node.js server...")
            result = subprocess.run(['node', '-e', 'console.log("Node.js test passed")'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print("   ✅ Node.js test passed")
            else:
                print("   ❌ Node.js test failed")
        except:
            print("   ❌ Node.js test failed")
        
        try:
            print("   🧪 Testing Python modules...")
            result = subprocess.run([sys.executable, '-c', 'import requests, json; print("Python test passed")'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print("   ✅ Python test passed")
            else:
                print("   ❌ Python test failed")
        except:
            print("   ❌ Python test failed")
    
    def run_command(self, command, cwd=None):
        """Run a system command with error handling"""
        try:
            if cwd is None:
                cwd = self.project_dir
            
            result = subprocess.run(command, cwd=cwd, check=True, 
                                  capture_output=True, text=True)
            return result
        except subprocess.CalledProcessError as e:
            print(f"   ❌ Command failed: {' '.join(command)}")
            print(f"   Error: {e.stderr}")
            raise
    
    def print_next_steps(self):
        """Print next steps for the user"""
        next_steps = f"""
🎉 SETUP COMPLETE! Next Steps:

1. 📝 Configure API Keys:
   Edit the .env file with your actual API keys:
   - CoinMarketCap API: https://coinmarketcap.com/api/
   - GitHub Token: https://github.com/settings/tokens
   - Telegram Bot: https://t.me/botfather

2. 🚀 Start the System:
   Run: node advanced-crypto-monitor.js
   Dashboard: http://localhost:3000

3. 🔧 VS Code Extension (optional):
   - Open VS Code in this directory
   - Press F5 to launch extension development host
   - Or install the extension from vscode-extension/

4. 📊 Test the System:
   - Visit http://localhost:3000 for the dashboard
   - Check http://localhost:3000/api/system-status
   - Test notifications with your configured channels

5. 📖 Documentation:
   - Configuration: crypto_monitor_config.json
   - Logs: logs/crypto_monitor.log
   - Data: data/ directory

🔗 Useful Commands:
   node advanced-crypto-monitor.js     # Start main system
   python crypto_analyzer.py           # Run analysis engine
   python dark_web_monitor.py          # Run dark web monitor
   python config_manager.py            # Setup configuration

⚠️ Important:
   - Keep your API keys secure
   - Configure notifications before first run
   - Monitor logs for any issues
   - Update configuration as needed

Happy monitoring! 🚀📈
        """
        print(next_steps)
    
    def create_quick_start_script(self):
        """Create a quick start script"""
        if self.system == 'windows':
            script_content = """@echo off
echo Starting Advanced Crypto Project Monitor...
node advanced-crypto-monitor.js
pause
"""
            script_file = self.project_dir / 'start.bat'
        else:
            script_content = """#!/bin/bash
echo "Starting Advanced Crypto Project Monitor..."
node advanced-crypto-monitor.js
"""
            script_file = self.project_dir / 'start.sh'
        
        with open(script_file, 'w') as f:
            f.write(script_content)
        
        if self.system != 'windows':
            os.chmod(script_file, 0o755)
        
        print(f"   ✅ Quick start script created: {script_file}")

def main():
    """Main setup function"""
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print("""
Advanced Crypto Project Monitor Setup

Usage:
    python setup.py [options]

Options:
    --help          Show this help message
    --quick         Quick setup with minimal prompts
    --dev           Development setup
    --production    Production setup

Examples:
    python setup.py                # Interactive setup
    python setup.py --quick        # Quick automated setup
    python setup.py --production   # Production-ready setup
        """)
        return
    
    try:
        setup = CryptoMonitorSetup()
        setup.run_setup()
        setup.create_quick_start_script()
        
    except KeyboardInterrupt:
        print("\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Setup failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
