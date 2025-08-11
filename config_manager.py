# Comprehensive Configuration for Advanced Crypto Project Monitor
# Central configuration management for all monitoring components

import os
import json
from typing import Dict, List, Any
from datetime import datetime

class CryptoMonitorConfig:
    """
    Centralized configuration management for the comprehensive crypto monitoring system
    """
    
    def __init__(self, config_file: str = None):
        self.config_file = config_file or "crypto_monitor_config.json"
        self.config = self.load_configuration()
    
    def load_configuration(self) -> Dict[str, Any]:
        """Load configuration from file or create default"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading config: {e}")
                return self.get_default_config()
        else:
            config = self.get_default_config()
            self.save_configuration(config)
            return config
    
    def get_default_config(self) -> Dict[str, Any]:
        """Get default configuration for all monitoring components"""
        return {
            "version": "2.0.0",
            "last_updated": datetime.now().isoformat(),
            
            # Server Configuration
            "server": {
                "port": 3000,
                "host": "localhost",
                "websocket_port": 3001,
                "ssl_enabled": False,
                "cors_enabled": True,
                "max_connections": 100
            },
            
            # API Keys and Credentials
            "api_keys": {
                "coinmarketcap": os.getenv("CMC_API_KEY", ""),
                "coingecko": os.getenv("COINGECKO_API_KEY", ""),
                "github": os.getenv("GITHUB_TOKEN", ""),
                "twitter_bearer": os.getenv("TWITTER_BEARER_TOKEN", ""),
                "reddit_client_id": os.getenv("REDDIT_CLIENT_ID", ""),
                "reddit_client_secret": os.getenv("REDDIT_CLIENT_SECRET", ""),
                "telegram_bot_token": os.getenv("TELEGRAM_BOT_TOKEN", ""),
                "discord_webhook": os.getenv("DISCORD_WEBHOOK", ""),
                "email_api_key": os.getenv("EMAIL_API_KEY", "")
            },
            
            # Notification Settings
            "notifications": {
                "telegram": {
                    "enabled": True,
                    "chat_id": os.getenv("TELEGRAM_CHAT_ID", ""),
                    "bot_token": os.getenv("TELEGRAM_BOT_TOKEN", ""),
                    "parse_mode": "HTML",
                    "disable_notification": False
                },
                "email": {
                    "enabled": False,
                    "smtp_server": "smtp.gmail.com",
                    "smtp_port": 587,
                    "sender_email": os.getenv("SENDER_EMAIL", ""),
                    "sender_password": os.getenv("SENDER_PASSWORD", ""),
                    "recipient_email": os.getenv("RECIPIENT_EMAIL", "")
                },
                "discord": {
                    "enabled": False,
                    "webhook_url": os.getenv("DISCORD_WEBHOOK", ""),
                    "username": "Crypto Monitor Bot"
                },
                "push": {
                    "enabled": False,
                    "service": "pushover",
                    "api_token": os.getenv("PUSHOVER_TOKEN", ""),
                    "user_key": os.getenv("PUSHOVER_USER", "")
                }
            },
            
            # Monitoring Configuration
            "monitoring": {
                "enabled_sources": [
                    "coinmarketcap",
                    "coingecko", 
                    "github",
                    "social_media",
                    "dark_web",
                    "threat_intelligence"
                ],
                "scan_intervals": {
                    "coinmarketcap": 60,      # seconds
                    "coingecko": 60,
                    "github": 300,
                    "social_media": 180,
                    "dark_web": 600,
                    "threat_intelligence": 900
                },
                "max_projects_per_batch": 20,
                "concurrent_requests": 5,
                "request_timeout": 30
            },
            
            # Filter and Alert Configuration
            "filters": {
                "keywords": [
                    "defi", "nft", "gaming", "metaverse", "ai crypto",
                    "layer 2", "cross-chain", "stablecoin", "dao",
                    "yield farming", "liquidity mining", "tokenized assets"
                ],
                "excluded_keywords": [
                    "scam", "rug pull", "ponzi", "pyramid",
                    "get rich quick", "guaranteed profit"
                ],
                "minimum_legitimacy_score": 0.4,
                "maximum_risk_level": "medium",
                "sentiment_threshold": 0.3,
                "trending_threshold": 0.5
            },
            
            # Analysis Configuration
            "analysis": {
                "enabled_analyzers": [
                    "legitimacy_scorer",
                    "risk_assessor", 
                    "sentiment_analyzer",
                    "social_metrics",
                    "technical_indicators",
                    "trending_detector"
                ],
                "ml_models": {
                    "legitimacy_model": "models/legitimacy_rf.pkl",
                    "sentiment_model": "models/sentiment_nb.pkl",
                    "risk_model": "models/risk_svm.pkl"
                },
                "analysis_weights": {
                    "legitimacy": 0.3,
                    "risk": 0.25,
                    "sentiment": 0.2,
                    "social": 0.15,
                    "trending": 0.1
                }
            },
            
            # Dark Web Monitoring Configuration
            "dark_web": {
                "enabled": True,
                "tor_proxy": None,
                "monitored_sources": [
                    "crypto_forums",
                    "telegram_channels",
                    "discord_servers",
                    "dark_marketplaces"
                ],
                "risk_keywords": [
                    "rug pull", "exit scam", "pump dump",
                    "insider trading", "stolen keys"
                ],
                "threat_intelligence_feeds": [
                    "chainanalysis",
                    "elliptic",
                    "blockthreat"
                ]
            },
            
            # Social Media Monitoring
            "social_media": {
                "platforms": {
                    "twitter": {
                        "enabled": True,
                        "track_keywords": [
                            "new crypto", "new token", "presale",
                            "airdrop", "ico", "ido", "dex launch"
                        ],
                        "exclude_retweets": True,
                        "min_followers": 100
                    },
                    "reddit": {
                        "enabled": True,
                        "subreddits": [
                            "cryptocurrency",
                            "cryptomoonshots", 
                            "defi",
                            "altcoin",
                            "ethtrader"
                        ]
                    },
                    "telegram": {
                        "enabled": True,
                        "channels": [
                            "@cryptosignals",
                            "@altcoingems",
                            "@defi_announcements"
                        ]
                    }
                }
            },
            
            # GitHub Monitoring
            "github": {
                "enabled": True,
                "search_queries": [
                    "cryptocurrency created:>2024-01-01",
                    "blockchain created:>2024-01-01",
                    "defi created:>2024-01-01",
                    "web3 created:>2024-01-01"
                ],
                "min_stars": 5,
                "languages": ["JavaScript", "Python", "Solidity", "Rust", "Go"],
                "exclude_forks": True
            },
            
            # Database Configuration
            "database": {
                "type": "json",  # json, sqlite, postgresql
                "file_path": "data/crypto_projects.json",
                "backup_enabled": True,
                "backup_interval": 3600,  # seconds
                "max_records": 10000
            },
            
            # VS Code Extension Configuration
            "vscode_extension": {
                "auto_start": False,
                "notification_types": ["high_priority", "new_projects"],
                "dashboard_auto_open": False,
                "status_bar_enabled": True,
                "tree_view_enabled": True
            },
            
            # Dashboard Configuration
            "dashboard": {
                "enabled": True,
                "theme": "dark",
                "auto_refresh": True,
                "refresh_interval": 30,  # seconds
                "max_projects_display": 50,
                "charts_enabled": True
            },
            
            # Security Configuration
            "security": {
                "rate_limiting": {
                    "enabled": True,
                    "requests_per_minute": 60,
                    "burst_limit": 10
                },
                "authentication": {
                    "enabled": False,
                    "api_key_required": False,
                    "jwt_secret": os.getenv("JWT_SECRET", ""),
                    "session_timeout": 3600
                },
                "encryption": {
                    "api_keys_encrypted": False,
                    "data_encryption": False
                }
            },
            
            # Logging Configuration
            "logging": {
                "level": "INFO",  # DEBUG, INFO, WARNING, ERROR, CRITICAL
                "file_path": "logs/crypto_monitor.log",
                "max_file_size": "10MB",
                "backup_count": 5,
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "console_output": True
            },
            
            # Performance Configuration
            "performance": {
                "cache_enabled": True,
                "cache_ttl": 300,  # seconds
                "compression_enabled": True,
                "async_processing": True,
                "worker_processes": 2
            },
            
            # Backup and Recovery
            "backup": {
                "enabled": True,
                "backup_path": "backups/",
                "schedule": "daily",
                "retention_days": 30,
                "compress_backups": True
            },
            
            # Trending Sectors 2025
            "trending_sectors": {
                "ai_crypto": {
                    "keywords": ["ai crypto", "artificial intelligence", "machine learning"],
                    "weight": 1.0
                },
                "tokenized_assets": {
                    "keywords": ["tokenized real estate", "asset tokenization", "rwa"],
                    "weight": 0.9
                },
                "stablecoins": {
                    "keywords": ["stablecoin", "cbdc", "algorithmic stable"],
                    "weight": 0.8
                },
                "defi_2": {
                    "keywords": ["defi 2.0", "next generation defi", "defi evolution"],
                    "weight": 0.9
                },
                "layer2": {
                    "keywords": ["layer 2", "l2", "scaling solution", "rollup"],
                    "weight": 0.8
                },
                "cross_chain": {
                    "keywords": ["cross-chain", "interoperability", "bridge"],
                    "weight": 0.7
                }
            }
        }
    
    def save_configuration(self, config: Dict[str, Any] = None) -> None:
        """Save configuration to file"""
        if config is None:
            config = self.config
        
        config["last_updated"] = datetime.now().isoformat()
        
        try:
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)
            print(f"✅ Configuration saved to {self.config_file}")
        except Exception as e:
            print(f"❌ Error saving configuration: {e}")
    
    def update_config(self, section: str, key: str, value: Any) -> None:
        """Update specific configuration value"""
        if section in self.config:
            self.config[section][key] = value
            self.save_configuration()
        else:
            print(f"❌ Configuration section '{section}' not found")
    
    def get_config(self, section: str = None, key: str = None) -> Any:
        """Get configuration value"""
        if section is None:
            return self.config
        
        if section not in self.config:
            return None
        
        if key is None:
            return self.config[section]
        
        return self.config[section].get(key)
    
    def validate_config(self) -> Dict[str, List[str]]:
        """Validate configuration and return issues"""
        issues = {
            "errors": [],
            "warnings": [],
            "missing_keys": []
        }
        
        # Check required API keys
        api_keys = self.config.get("api_keys", {})
        
        if not api_keys.get("telegram_bot_token") and self.config["notifications"]["telegram"]["enabled"]:
            issues["warnings"].append("Telegram notifications enabled but bot token missing")
        
        if not api_keys.get("coinmarketcap") and "coinmarketcap" in self.config["monitoring"]["enabled_sources"]:
            issues["warnings"].append("CoinMarketCap monitoring enabled but API key missing")
        
        # Check notification settings
        telegram_config = self.config["notifications"]["telegram"]
        if telegram_config["enabled"] and not telegram_config.get("chat_id"):
            issues["errors"].append("Telegram notifications enabled but chat_id missing")
        
        # Check file paths
        log_dir = os.path.dirname(self.config["logging"]["file_path"])
        if not os.path.exists(log_dir):
            issues["warnings"].append(f"Log directory does not exist: {log_dir}")
        
        data_dir = os.path.dirname(self.config["database"]["file_path"])
        if not os.path.exists(data_dir):
            issues["warnings"].append(f"Database directory does not exist: {data_dir}")
        
        return issues
    
    def setup_directories(self) -> None:
        """Create necessary directories"""
        directories = [
            os.path.dirname(self.config["logging"]["file_path"]),
            os.path.dirname(self.config["database"]["file_path"]),
            self.config["backup"]["backup_path"],
            "models/",
            "data/",
            "exports/"
        ]
        
        for directory in directories:
            if directory and not os.path.exists(directory):
                try:
                    os.makedirs(directory, exist_ok=True)
                    print(f"✅ Created directory: {directory}")
                except Exception as e:
                    print(f"❌ Error creating directory {directory}: {e}")
    
    def export_config_template(self, file_path: str = "config_template.json") -> None:
        """Export configuration template for easy setup"""
        template = self.get_default_config()
        
        # Remove sensitive data
        template["api_keys"] = {key: "" for key in template["api_keys"]}
        template["notifications"]["telegram"]["chat_id"] = "YOUR_CHAT_ID"
        template["notifications"]["telegram"]["bot_token"] = "YOUR_BOT_TOKEN"
        template["notifications"]["email"]["sender_email"] = "your-email@example.com"
        template["notifications"]["email"]["sender_password"] = "your-app-password"
        
        try:
            with open(file_path, 'w') as f:
                json.dump(template, f, indent=2)
            print(f"✅ Configuration template exported to {file_path}")
        except Exception as e:
            print(f"❌ Error exporting template: {e}")
    
    def get_environment_setup(self) -> str:
        """Get environment setup instructions"""
        return """
# Environment Setup for Advanced Crypto Project Monitor

## Required Environment Variables

# API Keys
export CMC_API_KEY="your_coinmarketcap_api_key"
export COINGECKO_API_KEY="your_coingecko_api_key"
export GITHUB_TOKEN="your_github_token"
export TWITTER_BEARER_TOKEN="your_twitter_bearer_token"

# Telegram Configuration
export TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
export TELEGRAM_CHAT_ID="your_telegram_chat_id"

# Email Configuration (Optional)
export SENDER_EMAIL="your-email@example.com"
export SENDER_PASSWORD="your-app-password"
export RECIPIENT_EMAIL="recipient@example.com"

# Discord Configuration (Optional)
export DISCORD_WEBHOOK="your_discord_webhook_url"

# Security (Optional)
export JWT_SECRET="your_jwt_secret_key"

## Setup Instructions

1. Copy the above environment variables to a .env file
2. Replace all placeholder values with your actual credentials
3. Run: source .env (Linux/Mac) or load the .env file in your IDE
4. Start the crypto monitor: node crypto-project-monitor.js

## Getting API Keys

- CoinMarketCap: https://coinmarketcap.com/api/
- CoinGecko: https://www.coingecko.com/en/api
- GitHub: https://github.com/settings/tokens
- Twitter: https://developer.twitter.com/
- Telegram Bot: https://t.me/botfather

## Optional Services

- Discord Webhooks: Server Settings > Integrations > Webhooks
- Email: Use app-specific passwords for Gmail/Outlook
- Push Notifications: Pushover, Pusher, etc.
        """

# Example usage and setup
def setup_crypto_monitor():
    """Setup the crypto monitor configuration"""
    print("🚀 Setting up Advanced Crypto Project Monitor Configuration...")
    print("=" * 60)
    
    # Initialize configuration
    config_manager = CryptoMonitorConfig()
    
    # Setup directories
    print("\n📁 Setting up directories...")
    config_manager.setup_directories()
    
    # Validate configuration
    print("\n✅ Validating configuration...")
    issues = config_manager.validate_config()
    
    if issues["errors"]:
        print("❌ Configuration Errors:")
        for error in issues["errors"]:
            print(f"   - {error}")
    
    if issues["warnings"]:
        print("⚠️ Configuration Warnings:")
        for warning in issues["warnings"]:
            print(f"   - {warning}")
    
    if not issues["errors"] and not issues["warnings"]:
        print("✅ Configuration is valid!")
    
    # Export template
    print("\n📋 Exporting configuration template...")
    config_manager.export_config_template()
    
    # Print environment setup
    print("\n🔧 Environment Setup Instructions:")
    print(config_manager.get_environment_setup())
    
    print(f"\n✅ Setup complete! Configuration saved to: {config_manager.config_file}")
    print("=" * 60)
    
    return config_manager

if __name__ == "__main__":
    setup_crypto_monitor()
