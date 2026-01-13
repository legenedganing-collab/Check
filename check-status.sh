#!/bin/bash

# LightNode - Server Status Monitor
# Check which ports are running

echo "🔍 LightNode Server Status Check"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check port
check_port() {
  local port=$1
  local service=$2
  
  if ss -tuln 2>/dev/null | grep -q ":$port " || nc -z localhost $port 2>/dev/null; then
    echo -e "${GREEN}✅ $service${NC} - Port $port is LISTENING"
    return 0
  else
    echo -e "${RED}❌ $service${NC} - Port $port NOT LISTENING"
    return 1
  fi
}

echo -e "${BLUE}Port Status:${NC}"
echo ""

check_port 1573 "Frontend (Vite)"
check_port 3002 "Backend API"
check_port 5432 "PostgreSQL"
check_port 7777 "WebSocket"
check_port 8888 "File Server"

echo ""
echo -e "${BLUE}Running Processes:${NC}"
echo ""

echo -e "${YELLOW}Node.js processes:${NC}"
ps aux | grep -E "node|npm" | grep -v grep || echo -e "${RED}No Node processes running${NC}"

echo ""
echo -e "${YELLOW}PostgreSQL process:${NC}"
ps aux | grep postgres | grep -v grep || echo -e "${RED}PostgreSQL not running${NC}"

echo ""
echo -e "${BLUE}Port Details:${NC}"
echo ""

echo -e "${YELLOW}All listening ports:${NC}"
ss -tuln 2>/dev/null | grep LISTEN | grep -E "1573|3002|5432|7777|8888" || echo "No matching ports found"

echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo ""
echo "Frontend: https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev/"
echo "Backend: https://crispy-doodle-x56wwp77w59x3vq9p-3002.app.github.dev/"
echo "WebSocket: wss://crispy-doodle-x56wwp77w59x3vq9p-7777.app.github.dev/"
echo "File Server: https://crispy-doodle-x56wwp77w59x3vq9p-8888.app.github.dev/"
echo ""
