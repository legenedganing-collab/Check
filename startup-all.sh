#!/bin/bash

# LightNode Multi-Server Startup Script
# Launches all servers: Frontend, Backend, WebSocket, File Server, and Database

echo "🚀 LightNode Server Startup Script"
echo "===================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to start a server
start_server() {
  local name=$1
  local command=$2
  local port=$3
  local color=$4
  
  echo -e "${color}▶ Starting ${name} (Port: ${port})...${NC}"
  eval "$command" &
  echo -e "${color}✅ ${name} started${NC}"
  echo ""
}

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if sudo service postgresql status > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
  echo -e "${YELLOW}🔧 Starting PostgreSQL...${NC}"
  sudo service postgresql start
fi
echo ""

# Define server startup commands
cd /workspaces/Check

echo -e "${BLUE}========== SERVER STARTUP ==========${NC}"
echo ""

# Start Frontend (Port 1573)
start_server "Frontend" "npm run dev" "1573" "$BLUE"

# Wait a moment for frontend to start
sleep 3

# Change to backend directory
cd /workspaces/Check/backend

# Start Backend API (Port 3002)
start_server "Backend API" "npm start" "3002" "$GREEN"

# Start WebSocket Server (Port 7777)
start_server "WebSocket Server" "node websocket-server.js" "7777" "$GREEN"

# Start File Server (Port 8888)
start_server "File Server" "node file-server.js" "8888" "$GREEN"

echo ""
echo -e "${BLUE}========== ALL SERVERS STARTED ==========${NC}"
echo ""
echo -e "${YELLOW}📊 Service Summary:${NC}"
echo ""
echo -e "${GREEN}Frontend (Vite)${NC}"
echo "  Local: http://localhost:1573"
echo "  Codespace: https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev/"
echo ""
echo -e "${GREEN}Backend API${NC}"
echo "  Local: http://localhost:3002"
echo "  Codespace: https://crispy-doodle-x56wwp77w59x3vq9p-3002.app.github.dev/"
echo ""
echo -e "${GREEN}WebSocket Server${NC}"
echo "  Local: ws://localhost:7777"
echo "  Codespace: wss://crispy-doodle-x56wwp77w59x3vq9p-7777.app.github.dev/"
echo ""
echo -e "${GREEN}File Server${NC}"
echo "  Local: http://localhost:8888"
echo "  Codespace: https://crispy-doodle-x56wwp77w59x3vq9p-8888.app.github.dev/"
echo ""
echo -e "${GREEN}PostgreSQL Database${NC}"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  User: lighth"
echo "  Database: lighth"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - Press Ctrl+C to stop the script"
echo "  - Check /tmp for server logs"
echo "  - Demo account: test@lighth.io / test123456"
echo ""

# Wait for all processes
wait
