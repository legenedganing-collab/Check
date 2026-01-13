#!/bin/bash

# LightNode - Complete Server Manager
# Starts all services and monitors their status

set -e

echo "🚀 LightNode Server Manager"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# PORTS CONFIGURATION - LightNode Service Map
# ============================================================================
# Service                     | Port | Process              | Purpose
# ────────────────────────────┼──────┼──────────────────────┼─────────────────────────────
# Frontend (Vite React)       | 1573 | npm run dev          | Dashboard, UI, Server Mgmt
# Backend API (Express)       | 3002 | npm start            | Auth, API, HTTP/WebSocket
# PostgreSQL Database         | 5432 | service postgresql   | Data persistence
# WebSocket Server            | 7777 | node websocket-server| Live console, realtime events
# File Server                 | 8888 | node file-server.js  | File uploads, downloads
# ============================================================================

FRONTEND_PORT=1573
BACKEND_PORT=3002
DB_PORT=5432
WEBSOCKET_PORT=7777
FILE_SERVER_PORT=8888

FRONTEND_DIR="/workspaces/Check"
BACKEND_DIR="/workspaces/Check/backend"

# Function to check if port is listening
check_port() {
  local port=$1
  if ss -tuln 2>/dev/null | grep -q ":$port " || netstat -tuln 2>/dev/null | grep -q ":$port "; then
    return 0
  else
    return 1
  fi
}

# Function to start a service
start_service() {
  local name=$1
  local port=$2
  local command=$3
  local directory=$4
  
  echo -e "${BLUE}▶ Starting ${name} (Port ${port})...${NC}"
  
  # Check if already running
  if check_port $port; then
    echo -e "${GREEN}✅ ${name} already running on port ${port}${NC}"
    return 0
  fi
  
  # Start the service
  cd "$directory"
  local logfile="/tmp/${name// /_}.log"
  eval "$command" > "$logfile" 2>&1 &
  local pid=$!
  
  # Wait for service to start (max 10 seconds)
  local count=0
  while [ $count -lt 10 ]; do
    if check_port $port; then
      echo -e "${GREEN}✅ ${name} started (PID: $pid)${NC}"
      return 0
    fi
    sleep 1
    count=$((count + 1))
  done
  
  echo -e "${RED}❌ ${name} failed to start${NC}"
  echo -e "${YELLOW}Log: $logfile${NC}"
  cat "$logfile"
  return 1
}

# Kill existing processes on ports
cleanup_ports() {
  echo -e "${YELLOW}Cleaning up old processes...${NC}"
  pkill -f "npm run dev" || true
  pkill -f "npm start" || true
  pkill -f "node websocket-server" || true
  pkill -f "node file-server" || true
  sleep 2
}

echo -e "${BLUE}========== STARTUP SEQUENCE ==========${NC}"
echo ""

# Clean up old processes
cleanup_ports

# Start PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if sudo service postgresql status > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PostgreSQL running${NC}"
else
  echo -e "${YELLOW}Starting PostgreSQL...${NC}"
  sudo service postgresql start > /dev/null 2>&1
  echo -e "${GREEN}✅ PostgreSQL started${NC}"
fi
echo ""

# Start Backend API
start_service "Backend API" $BACKEND_PORT "npm start" "$BACKEND_DIR" || exit 1
sleep 3

# Check if backend is actually listening
echo -e "${YELLOW}Verifying Backend API...${NC}"
if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend API responds to health check${NC}"
else
  echo -e "${RED}⚠️  Backend API not responding to health check yet${NC}"
fi
echo ""

# Start WebSocket Server
start_service "WebSocket Server" $WEBSOCKET_PORT "node websocket-server.js" "$BACKEND_DIR" || exit 1
sleep 2
echo ""

# Start File Server
start_service "File Server" $FILE_SERVER_PORT "node file-server.js" "$BACKEND_DIR" || exit 1
sleep 2
echo ""

# Start Frontend
start_service "Frontend" $FRONTEND_PORT "npm run dev" "$FRONTEND_DIR" || exit 1
sleep 3
echo ""

echo -e "${BLUE}========== ALL SERVICES STARTED ==========${NC}"
echo ""

# Display status
echo -e "${GREEN}📊 Running Processes:${NC}"
echo ""

echo -e "${YELLOW}Frontend (Vite)${NC}"
if check_port $FRONTEND_PORT; then
  echo -e "  ${GREEN}✅ Port $FRONTEND_PORT${NC}"
  echo "  Local: http://localhost:$FRONTEND_PORT"
  echo "  Codespace: https://crispy-doodle-x56wwp77w59x3vq9p-$FRONTEND_PORT.app.github.dev/"
else
  echo -e "  ${RED}❌ Port $FRONTEND_PORT - NOT RUNNING${NC}"
fi
echo ""

echo -e "${YELLOW}Backend API${NC}"
if check_port $BACKEND_PORT; then
  echo -e "  ${GREEN}✅ Port $BACKEND_PORT${NC}"
  echo "  Local: http://localhost:$BACKEND_PORT"
  echo "  Codespace: https://crispy-doodle-x56wwp77w59x3vq9p-$BACKEND_PORT.app.github.dev/"
else
  echo -e "  ${RED}❌ Port $BACKEND_PORT - NOT RUNNING${NC}"
fi
echo ""

echo -e "${YELLOW}PostgreSQL${NC}"
if sudo service postgresql status > /dev/null 2>&1; then
  echo -e "  ${GREEN}✅ Port $DB_PORT${NC}"
  echo "  Connection: postgresql://lighth:lighth_dev_password_123@localhost:$DB_PORT/lighth"
else
  echo -e "  ${RED}❌ Port $DB_PORT - NOT RUNNING${NC}"
fi
echo ""

echo -e "${YELLOW}WebSocket Server${NC}"
if check_port $WEBSOCKET_PORT; then
  echo -e "  ${GREEN}✅ Port $WEBSOCKET_PORT${NC}"
  echo "  Local: ws://localhost:$WEBSOCKET_PORT"
  echo "  Codespace: wss://crispy-doodle-x56wwp77w59x3vq9p-$WEBSOCKET_PORT.app.github.dev/"
else
  echo -e "  ${RED}❌ Port $WEBSOCKET_PORT - NOT RUNNING${NC}"
fi
echo ""

echo -e "${YELLOW}File Server${NC}"
if check_port $FILE_SERVER_PORT; then
  echo -e "  ${GREEN}✅ Port $FILE_SERVER_PORT${NC}"
  echo "  Local: http://localhost:$FILE_SERVER_PORT"
  echo "  Codespace: https://crispy-doodle-x56wwp77w59x3vq9p-$FILE_SERVER_PORT.app.github.dev/"
else
  echo -e "  ${RED}❌ Port $FILE_SERVER_PORT - NOT RUNNING${NC}"
fi
echo ""

echo -e "${BLUE}========== LOGS ==========${NC}"
echo ""
echo -e "${YELLOW}Backend API: /tmp/Backend_API.log${NC}"
echo -e "${YELLOW}WebSocket Server: /tmp/WebSocket_Server.log${NC}"
echo -e "${YELLOW}File Server: /tmp/File_Server.log${NC}"
echo -e "${YELLOW}Frontend: /tmp/Frontend.log${NC}"
echo ""

echo -e "${BLUE}========== SERVICE PORTS MAP ==========${NC}"
echo ""
echo -e "${CYAN}📊 All Running Services:${NC}"
echo ""
echo -e "${GREEN}┌─────────────────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│ Service              │ Port │ Type    │ Connection  │${NC}"
echo -e "${GREEN}├─────────────────────────────────────────────────────┤${NC}"
echo -e "${GREEN}│ 1. Frontend (Vite)   │ 1573 │ HTTP    │ UI/Dashboard│${NC}"
echo -e "${GREEN}│ 2. Backend API       │ 3002 │ HTTP    │ REST API    │${NC}"
echo -e "${GREEN}│ 3. PostgreSQL DB     │ 5432 │ TCP     │ Database    │${NC}"
echo -e "${GREEN}│ 4. WebSocket Server  │ 7777 │ WS/WSS  │ Live Events │${NC}"
echo -e "${GREEN}│ 5. File Server       │ 8888 │ HTTP    │ File Upload │${NC}"
echo -e "${GREEN}└─────────────────────────────────────────────────────┘${NC}"
echo ""

echo -e "${CYAN}🌐 Codespace URLs (GitHub Dev Environment):${NC}"
echo ""
echo -e "${YELLOW}Frontend:${NC}        https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev/"
echo -e "${YELLOW}Backend API:${NC}     https://crispy-doodle-x56wwp77w59x3vq9p-3002.app.github.dev/"
echo -e "${YELLOW}WebSocket:${NC}      wss://crispy-doodle-x56wwp77w59x3vq9p-7777.app.github.dev/"
echo -e "${YELLOW}File Server:${NC}    https://crispy-doodle-x56wwp77w59x3vq9p-8888.app.github.dev/"
echo ""

echo -e "${CYAN}💻 Local Development URLs:${NC}"
echo ""
echo -e "${YELLOW}Frontend:${NC}        http://localhost:1573"
echo -e "${YELLOW}Backend API:${NC}     http://localhost:3002"
echo -e "${YELLOW}WebSocket:${NC}      ws://localhost:7777"
echo -e "${YELLOW}File Server:${NC}    http://localhost:8888"
echo -e "${YELLOW}PostgreSQL:${NC}     postgresql://lighth:lighth_dev_password_123@localhost:5432/lighth"
echo ""

echo -e "${GREEN}Ready! Open: https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev/${NC}"
echo ""

# Keep script running (don't exit)
tail -f /tmp/Backend\ API.log
