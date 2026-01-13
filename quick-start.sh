#!/bin/bash

# LightNode Quick Start
# Simple script to start all services

echo "🚀 Starting LightNode Services..."
echo ""

cd /workspaces/Check/backend

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -f "npm start" || true
pkill -f "npm run dev" || true
pkill -f "websocket-server" || true
pkill -f "file-server" || true
sleep 2

# Start Backend in background
echo "Starting Backend API (port 3002)..."
npm start &
BACKEND_PID=$!
sleep 5

# Start WebSocket in background
echo "Starting WebSocket Server (port 7777)..."
node websocket-server.js &
WEBSOCKET_PID=$!
sleep 3

# Start File Server in background
echo "Starting File Server (port 8888)..."
node file-server.js &
FILE_SERVER_PID=$!
sleep 3

# Start Frontend in background
echo "Starting Frontend (port 1573)..."
cd /workspaces/Check
npm run dev &
FRONTEND_PID=$!
sleep 5

echo ""
echo "✅ All services started!"
echo ""
echo "📡 Access your services:"
echo ""
echo "Frontend:     https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev"
echo "Backend API:  https://crispy-doodle-x56wwp77w59x3vq9p-3002.app.github.dev"
echo "WebSocket:    wss://crispy-doodle-x56wwp77w59x3vq9p-7777.app.github.dev"
echo "File Server:  https://crispy-doodle-x56wwp77w59x3vq9p-8888.app.github.dev"
echo ""
echo "Process IDs:"
echo "  Backend: $BACKEND_PID"
echo "  WebSocket: $WEBSOCKET_PID"
echo "  File Server: $FILE_SERVER_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all processes
wait
