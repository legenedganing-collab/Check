/**
 * WebSocket Socket.io Handler for Live Server Console
 * 
 * Features:
 * - Real-time console streaming from Docker containers
 * - JWT authentication for security
 * - Bi-directional communication (Frontend -> Docker commands, Docker -> Frontend logs)
 * - Automatic cleanup on disconnect
 * - Support for multiple concurrent connections
 */

const socketIo = require('socket.io');
const Docker = require('dockerode');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { calculateCPUPercent, calculateRamBytes, calculateRamLimit } = require('./statsCalculator');

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
});

const prisma = new PrismaClient();

// ============================================================================
// SOCKET.IO SERVER INITIALIZATION
// ============================================================================

/**
 * Initialize Socket.io server on HTTP server
 * Handles WebSocket connections and authentication
 * 
 * @param {http.Server} httpServer - HTTP server instance (from http.createServer)
 * @returns {socketIo.Server} - Socket.io server instance
 */
function initSocketServer(httpServer) {
  const io = socketIo(httpServer, {
    cors: {
      // Allow connections from your frontend
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'] // WebSocket first, fallback to polling
  });

  // ============================================================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================================================

  /**
   * Middleware: Verify JWT token before allowing connection
   * This ensures only authenticated users can connect to the console
   */
  io.use((socket, next) => {
    try {
      // Get token from auth header
      const token = socket.handshake.auth.token;

      if (!token) {
        console.warn(`[Socket Auth] Connection rejected: No token provided`);
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach user info to socket
      console.log(`[Socket Auth] ✅ User ${decoded.email} authenticated`);
      next();
    } catch (error) {
      console.warn(`[Socket Auth] Connection rejected: ${error.message}`);
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // ============================================================================
  // CONNECTION HANDLER
  // ============================================================================

  io.on('connection', (socket) => {
    const serverId = socket.handshake.query.serverId;
    const userId = socket.user.id;
    let dockerStream = null;

    console.log(`[Console] 🔌 User ${socket.user.email} connected to console for server ${serverId}`);

    // Initialize console connection
    (async () => {
      try {
        // 1. Verify server ownership (security check)
        const server = await prisma.server.findFirst({
          where: {
            id: parseInt(serverId),
            userId: userId // Ensure user owns this server
          }
        });

        if (!server) {
          socket.emit('console-error', 'Server not found or access denied');
          socket.disconnect();
          console.warn(`[Console] ❌ Server ${serverId} not found for user ${userId}`);
          return;
        }

        // 2. Build container name (must match naming in dockerProvisioner.js)
        const containerName = `mc-${server.id}-${server.name
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/gi, '')
          .toLowerCase()}`;

        console.log(`[Console] Attempting to attach to container: ${containerName}`);

        // 3. Get the Docker container
        const container = docker.getContainer(containerName);

        // 4. Verify container exists by inspecting it
        const containerInfo = await container.inspect();
        if (!containerInfo) {
          throw new Error('Container not found or not running');
        }

        console.log(`[Console] ✅ Container found. Status: ${containerInfo.State.Status}`);

        // 5. Attach to container streams (stdout + stderr + stdin)
        const options = {
          stream: true,
          stdout: true,  // Capture server output
          stderr: true,  // Capture error output
          stdin: true,   // Enable input for RCON commands
          Tty: false     // Required for proper stream handling
        };

        container.attach(options, (err, stream) => {
          if (err) {
            console.error(`[Console] ❌ Failed to attach to container:`, err.message);
            socket.emit(
              'console-error',
              `\r\n🔴 Error: Could not attach to server console.\r\nError: ${err.message}\r\n`
            );
            return;
          }

          dockerStream = stream;
          console.log(`[Console] ✅ Successfully attached to container stream`);

          // Send welcome message
          socket.emit('console-output', '\r\n🟢 Connected to Live Console...\r\n');
          socket.emit(
            'console-output',
            `Server: ${server.name} | Port: ${server.port} | Status: ${containerInfo.State.Status}\r\n\r\n`
          );

          // ========================================================================
          // DOCKER -> FRONTEND: Stream container output
          // ========================================================================

          dockerStream.on('data', (chunk) => {
            // Send raw Docker output to browser terminal
            // xterm.js will render this in real-time
            socket.emit('console-output', chunk.toString('utf-8'));
          });

          dockerStream.on('error', (error) => {
            console.error(`[Console] Stream error:`, error.message);
            socket.emit('console-error', `\r\n🔴 Stream error: ${error.message}\r\n`);
          });

          dockerStream.on('end', () => {
            console.log(`[Console] Stream ended for server ${serverId}`);
            socket.emit('console-output', '\r\n🔴 Console disconnected.\r\n');
          });
        });

        // ========================================================================
        // FRONTEND -> DOCKER: Receive and execute commands
        // ========================================================================

        socket.on('console-input', (input) => {
          if (dockerStream && !dockerStream.destroyed) {
            // Write user input directly to container STDIN
            // This allows RCON commands to be sent to the server
            dockerStream.write(input);
          } else {
            socket.emit('console-error', '❌ Console not connected');
          }
        });

        // ========================================================================
        // STATS STREAMING: Real-time CPU, RAM, and Disk I/O
        // ========================================================================

        let statsStream = null;
        let lastEmit = 0;

        // Request live stats stream from Docker
        container.stats({ stream: true }, (err, stream) => {
          if (err) {
            console.error(`[Stats] Failed to get stats stream:`, err.message);
            // Don't disconnect on stats error - console still works
            return;
          }

          statsStream = stream;
          console.log(`[Stats] ✅ Stats stream started for server ${serverId}`);

          // Listen for stats data chunks
          stream.on('data', (chunk) => {
            try {
              // Docker sends JSON formatted stats
              const stats = JSON.parse(chunk.toString());

              // Throttle emissions: only send once per second
              // This prevents UI jitter and reduces network traffic
              const now = Date.now();
              if (now - lastEmit > 1000) {
                const statsData = {
                  cpu: calculateCPUPercent(stats),                    // e.g., "12.5"
                  ram: calculateRamBytes(stats),                      // e.g., 104857600 (bytes)
                  ramLimit: calculateRamLimit(stats),                 // e.g., 4294967296 (4GB)
                  timestamp: now
                };

                socket.emit('server-stats', statsData);
                lastEmit = now;
              }
            } catch (e) {
              // Sometimes Docker sends partial JSON chunks, silently ignore
              // This is normal and expected behavior
            }
          });

          stream.on('error', (error) => {
            console.error(`[Stats] Stream error:`, error.message);
            // Attempt to reconnect after a delay
            setTimeout(() => {
              if (socket.connected) {
                container.stats({ stream: true }, (err, newStream) => {
                  if (!err) {
                    statsStream = newStream;
                    console.log(`[Stats] ✅ Reconnected stats stream`);
                    // Reattach listeners recursively would go here
                  }
                });
              }
            }, 5000);
          });

          stream.on('end', () => {
            console.log(`[Stats] Stats stream ended for server ${serverId}`);
          });
        });

        // ========================================================================
        // DISCONNECT HANDLER
        // ========================================================================

        socket.on('disconnect', () => {
          if (dockerStream) {
            dockerStream.end();
            dockerStream = null;
          }
          if (statsStream) {
            statsStream.destroy();
            statsStream = null;
          }
          console.log(`[Console] 🔌 User ${socket.user.email} disconnected from server ${serverId}`);
        });

        // ========================================================================
        // ERROR HANDLER
        // ========================================================================

        socket.on('error', (error) => {
          console.error(`[Console] Socket error:`, error);
          if (dockerStream) {
            dockerStream.end();
          }
        });
      } catch (error) {
        console.error(`[Console] Connection error:`, error.message);
        socket.emit('console-error', `\r\n🔴 Connection error: ${error.message}\r\n`);
        socket.disconnect();
      }
    })();
  });

  return io;
}

module.exports = initSocketServer;
