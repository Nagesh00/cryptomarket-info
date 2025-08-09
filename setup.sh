#!/bin/bash

echo "==============================================="
echo "    Crypto Project Monitor - Setup Script"
echo "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "[1/6] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js is installed$(NC)"

# Check if npm is installed
echo "[2/6] Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm is installed${NC}"

# Install main project dependencies
echo "[3/6] Installing main project dependencies..."
if ! npm install; then
    echo -e "${RED}ERROR: Failed to install main dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Main dependencies installed${NC}"

# Install VS Code extension dependencies
echo "[4/6] Installing VS Code extension dependencies..."
cd vscode-extension
if ! npm install; then
    echo -e "${RED}ERROR: Failed to install VS Code extension dependencies${NC}"
    cd ..
    exit 1
fi
cd ..
echo -e "${GREEN}✓ VS Code extension dependencies installed${NC}"

# Check if Redis is available
echo "[5/6] Checking Redis availability..."
if ! redis-cli ping &> /dev/null; then
    echo -e "${YELLOW}WARNING: Redis is not running or not installed${NC}"
    echo ""
    echo "To install Redis:"
    echo "Ubuntu/Debian: sudo apt-get install redis-server"
    echo "macOS: brew install redis"
    echo "CentOS/RHEL: sudo yum install redis"
    echo ""
    echo "To start Redis: sudo service redis-server start"
    echo ""
    read -p "Continue without Redis? (y/n): " continue
    if [[ ! $continue =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Redis is running${NC}"
fi

# Setup environment file
echo "[6/6] Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from template${NC}"
    echo ""
    echo "IMPORTANT: Please edit .env file and add your API keys:"
    echo "- CoinMarketCap API key"
    echo "- Twitter API credentials"
    echo "- GitHub token"
    echo "- Reddit API credentials"
    echo "- Telegram bot token (optional)"
    echo "- Email credentials (optional)"
    echo ""
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo "==============================================="
echo "           Setup Complete!"
echo "==============================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Start Redis server (if not running): redis-server"
echo "3. Start the monitoring system: npm start"
echo "4. Open VS Code and install the extension"
echo ""
echo "For detailed setup instructions, see README.md"
echo ""

# Option to start the system
read -p "Start the monitoring system now? (y/n): " startNow
if [[ $startNow =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting Crypto Project Monitor..."
    echo "Press Ctrl+C to stop"
    echo ""
    npm start
fi
