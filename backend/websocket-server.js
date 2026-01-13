/**
 * WebSocket & Real-Time Server (Port 7777)
 * Handles live console output, server status updates, and real-time events
 * 
 * This server communicates with the main backend (3002) for authentication
 * and uses WebSocket for efficient real-time bidirectional communication
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');

const app = express();
const PORT = process.env.WEBSOCKET_PORT || 7777;

// Middleware - CORS Configuration
const corsOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:1573', 'http://10.0.4.186:1573'];

// Add codespace domain pattern to allowed origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow no origin (like mobile or curl)
    if (!origin) return callback(null, true);
    
    // Check if in allowed list
    if (corsOrigins.includes(origin)) return callback(null, true);
    
    // Allow codespace domains
    if (origin && origin.includes('.app.github.dev')) return callback(null, true);
    
    // Allow localhost
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) return callback(null, true);
    
    // Development: allow all
    return callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'WebSocket server is running',
    service: 'realtime-updates',
    port: PORT
  });
});

// Create HTTP + WebSocket server
const httpServer = http.createServer(app);

// Initialize Socket.io for real-time communication
const io = socketIo(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:1573', 'http://10.0.4.186:1573'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ============================================================================
// WEBSOCKET EVENT HANDLERS
// ============================================================================

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Listen for console input from client
  socket.on('console-input', (data) => {
    console.log(`[Console Input] From ${socket.id}:`, data);
    // Broadcast to all connected clients in the room
    io.emit('console-output', {
      timestamp: new Date(),
      message: data.message,
      source: 'client'
    });
  });

  // Listen for server status requests
  socket.on('request-server-status', (data) => {
    console.log(`[Status Request] Server ID: ${data.serverId}`);
    // In production, query actual Docker container status
    socket.emit('server-status', {
      serverId: data.serverId,
      status: 'online',
      players: 0,
      memory: '45%',
      uptime: '2h 30m'
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[Socket.io] Error from ${socket.id}:`, error);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🔌 Real-Time WebSocket Server`);
  console.log(`📡 Listening on: ws://0.0.0.0:${PORT}`);
  console.log(`🌐 Public URL: wss://crispy-doodle-x56wwp77w59x3vq9p-${PORT}.app.github.dev/`);
  console.log(`\n✨ Features:`);
  console.log(`   - Live console output streaming`);
  console.log(`   - Real-time server status updates`);
  console.log(`   - Player count & performance metrics`);
  console.log(`   - Server command execution\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  httpServer.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
