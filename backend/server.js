require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const initSocketServer = require('./lib/socket');
const authRoutes = require('./src/routes/authRoutes');
const serverRoutes = require('./src/routes/serverRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const SOCKET_PORT = process.env.SOCKET_PORT || 3002;

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    // Allow localhost
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } 
    // Allow codespace domains (ends with .app.github.dev)
    else if (origin && origin.includes('.app.github.dev')) {
      callback(null, true);
    }
    // Allow any origin in development (can be restricted in production)
    else {
      callback(null, true);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Backend is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// ============================================================================
// HTTP + WEBSOCKET SERVER
// ============================================================================

// Create HTTP server from Express app
const httpServer = http.createServer(app);

// Initialize Socket.io for WebSocket connections (Live Console)
const io = initSocketServer(httpServer);
console.log('[Socket.io] WebSocket server initialized');

// Start HTTP + WebSocket server
httpServer.listen(SOCKET_PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Lighth Backend Server is running`);
  console.log(`📡 HTTP Server: http://0.0.0.0:${SOCKET_PORT}`);
  console.log(`🔌 WebSocket Server: ws://0.0.0.0:${SOCKET_PORT}\n`);
  
  console.log(`📚 API Documentation:`);
  console.log(`   - POST   /api/auth/register         - Register a new user`);
  console.log(`   - POST   /api/auth/login            - Login user`);
  console.log(`   - GET    /api/servers               - Get all user's servers (requires JWT)`);
  console.log(`   - POST   /api/servers               - Create new server (requires JWT)`);
  console.log(`   - GET    /api/servers/:id           - Get specific server (requires JWT)`);
  console.log(`   - PUT    /api/servers/:id           - Update server (requires JWT)`);
  console.log(`   - DELETE /api/servers/:id           - Delete server (requires JWT)`);
  console.log(`   - POST   /api/servers/:id/power     - Control server power (requires JWT)`);
  console.log(`   - GET    /api/health                - Health check\n`);
  
  console.log(`🎮 WebSocket Events:`);
  console.log(`   - console-output                    - Live console output`);
  console.log(`   - console-input                     - Send command to server`);
  console.log(`   - console-error                     - Console error messages\n`);
});
