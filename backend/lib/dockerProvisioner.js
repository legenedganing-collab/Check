/**
 * Docker Provisioner - Server Container Management
 * 
 * Launches and manages Minecraft server containers using dockerode
 * Integrates with the provisioning system to create live servers
 * 
 * Prerequisites:
 * - Docker daemon running and accessible
 * - User has permission to access Docker socket: sudo usermod -aG docker $USER
 * - Directory /var/lib/lighth/data exists for persistent storage
 */

const Docker = require('dockerode');

// Initialize Docker connection
const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
});

// ============================================================================
// CONSTANTS
// ============================================================================

const MINECRAFT_IMAGE = 'itzg/minecraft-server:latest';
const DATA_BASE_PATH = process.env.LIGHTH_DATA_PATH || '/var/lib/lighth/data';
const INTERNAL_MINECRAFT_PORT = 25565; // Standard Minecraft port in container
const INTERNAL_RCON_PORT = 25575;      // Standard RCON port in container

/**
 * Aikar's Flags - Performance optimization for Minecraft servers
 * Prevents lag spikes during garbage collection
 * 
 * Based on: https://aikar.co/2018/07/02/tuning-the-jvm-g1gc-garbage-collector-for-minecraft-servers-guide/
 * 
 * Flags:
 * -XX:+UseG1GC                    - Use G1 Garbage Collector
 * -XX:+ParallelRefProcEnabled     - Process references in parallel
 * -XX:MaxGCPauseMillis=200        - Max pause during GC: 200ms (less lag)
 * -XX:+UnlockExperimentalVMOptions - Allow experimental options
 * -XX:+DisableExplicitGC          - Prevent explicit GC calls
 */
const AIKAR_FLAGS = '-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC';

// ============================================================================
// DOCKER HEALTH CHECK
// ============================================================================

/**
 * Verify Docker daemon is accessible
 * 
 * @returns {Promise<boolean>} True if Docker is accessible
 */
const checkDockerHealth = async () => {
  try {
    const info = await docker.getInfo();
    console.log('[Docker Health] ✅ Connected to Docker daemon');
    console.log(`[Docker Health] Containers: ${info.Containers}, Images: ${info.Images}`);
    return true;
  } catch (error) {
    console.error('[Docker Health] ❌ Failed to connect to Docker daemon');
    console.error('[Docker Health] Error:', error.message);
    console.error('[Docker Health] Make sure Docker is running and socket is accessible');
    return false;
  }
};

/**
 * Pull the latest Minecraft server image
 * This is done once to ensure we have the latest version
 * 
 * @returns {Promise<void>}
 */
const pullMinecraftImage = async () => {
  try {
    console.log('[Docker] Pulling latest Minecraft image...');
    
    const stream = await docker.pull(MINECRAFT_IMAGE);
    
    // Process the pull stream
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    
    console.log('[Docker] ✅ Minecraft image ready');
  } catch (error) {
    console.warn('[Docker] Warning: Could not pull image', error.message);
    // Don't fail here - image might already exist
  }
};

// ============================================================================
// CONTAINER LAUNCH
// ============================================================================

/**
 * Launch a Minecraft server container
 * 
 * Integrates with provisioning system to create a live server using:
 * - Generated port from provisioning
 * - Generated RCON password from provisioning
 * - User-specified memory allocation
 * - Minecraft version (default: LATEST)
 * 
 * Container Features:
 * - Persistent world data storage
 * - RCON enabled for admin commands
 * - Auto-restart on failure
 * - Memory limits
 * - Performance optimization (Aikar's Flags)
 * 
 * @param {object} serverConfig - Server configuration from provisioning
 * @param {number} serverConfig.serverId - Database ID
 * @param {string} serverConfig.name - Server name
 * @param {number} serverConfig.port - Allocated port (from provisioning)
 * @param {string} serverConfig.rconPassword - Secure password (from provisioning)
 * @param {number} serverConfig.memory - Memory in GB (1-16)
 * @param {string} serverConfig.version - Minecraft version (default: LATEST)
 * @returns {Promise<{containerId: string, status: string}>}
 */
const launchMinecraftServer = async (serverConfig) => {
  const {
    serverId,
    name,
    port,
    rconPassword,
    memory = 2,
    version = 'LATEST'
  } = serverConfig;

  try {
    console.log(`[Docker] Launching server: ${name} on port ${port}`);

    // Generate container name (must be lowercase, no spaces)
    const containerName = `mc-${serverId}-${name
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/gi, '')
      .toLowerCase()}`;

    // Step 1: Create container with configuration
    const container = await docker.createContainer({
      // Image to use
      Image: MINECRAFT_IMAGE,
      
      // Container identification
      name: containerName,
      
      // Environment variables passed to container
      Env: [
        // EULA acceptance (required by Minecraft EULA)
        'EULA=TRUE',
        
        // Server configuration
        `VERSION=${version}`,
        `MEMORY=${memory}G`,
        
        // RCON (Remote Console) setup
        // Allows admin commands from web dashboard
        'ENABLE_RCON=true',
        `RCON_PASSWORD=${rconPassword}`,
        'RCON_PORT=25575',
        
        // Gameplay settings
        'DIFFICULTY=3',                   // Hard mode
        'GAMEMODE=survival',              // Survival mode
        'ONLINE_MODE=true',               // Verify player accounts
        'ENABLE_COMMAND_BLOCK=true',      // Allow command blocks
        'SPAWN_PROTECTION=16',            // Protect spawn area
        
        // Performance optimization (Aikar's Flags)
        `JVM_XX_OPTS=${AIKAR_FLAGS}`,
        
        // Additional JVM options
        'JVM_OPTS=-XX:+AlwaysPreTouch',
      ],
      
      // Port configuration
      ExposedPorts: {
        '25565/tcp': {},   // Minecraft game port
        '25575/tcp': {}    // RCON port
      },
      
      // Host-level configuration
      HostConfig: {
        // Port mapping (host port -> container port)
        PortBindings: {
          '25565/tcp': [
            { HostPort: port.toString() }  // Map container's 25565 to allocated port
          ],
          '25575/tcp': [
            { HostPort: '25575' }          // RCON on standard port
          ]
        },
        
        // Memory limit (in bytes)
        // Prevent one server from consuming all RAM
        Memory: memory * 1024 * 1024 * 1024,
        
        // Restart policy
        // Keep server running if it crashes
        RestartPolicy: {
          Name: 'unless-stopped',  // Auto-restart unless explicitly stopped
          MaximumRetryCount: 0
        },
        
        // Volume mounts
        // Store world data persistently on host
        Binds: [
          `${DATA_BASE_PATH}/${serverId}:/data`  // Game data persistence
        ],
        
        // Health check
        HealthCheck: {
          Test: ['CMD', 'curl', '-f', 'http://localhost:25565/'],
          Interval: 30 * 1000000000,  // 30 seconds in nanoseconds
          Timeout: 10 * 1000000000,   // 10 seconds
          Retries: 3,
          StartPeriod: 60 * 1000000000 // 60 second startup grace period
        },
        
        // Logging
        LogConfig: {
          Type: 'json-file',
          Config: {
            'max-size': '10m',     // Max log file size
            'max-file': '5'        // Keep 5 rotated files
          }
        }
      },
      
      // Labels for easy identification
      Labels: {
        'lighth.server-id': serverId.toString(),
        'lighth.server-name': name,
        'lighth.port': port.toString(),
        'lighth.created-at': new Date().toISOString()
      }
    });

    console.log(`[Docker] Container created: ${container.id.substring(0, 12)}`);

    // Step 2: Start container
    await container.start();
    console.log(`[Docker] ✅ Container started for server ${name}`);

    // Step 3: Verify container is running
    const inspect = await container.inspect();
    const isRunning = inspect.State.Running;
    
    if (!isRunning) {
      throw new Error('Container started but not running - check logs');
    }

    console.log(`[Docker] Server ${name} is live on port ${port}`);

    return {
      containerId: container.id,
      containerName: containerName,
      status: 'running',
      port: port,
      rconPort: INTERNAL_RCON_PORT,
      healthCheck: {
        status: inspect.State.Health?.Status || 'unknown',
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error(`[Docker Error] Failed to launch server ${name}`);
    console.error(`[Docker Error] ${error.message}`);
    throw error;
  }
};

// ============================================================================
// CONTAINER MANAGEMENT
// ============================================================================

/**
 * Get status of a running server
 * 
 * @param {string} containerId - Docker container ID or name
 * @returns {Promise<object>} Container status and metadata
 */
const getServerStatus = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    const inspect = await container.inspect();
    
    return {
      id: inspect.Id.substring(0, 12),
      name: inspect.Name.replace(/\//g, ''),
      status: inspect.State.Status,
      running: inspect.State.Running,
      memory: inspect.HostConfig.Memory / (1024 * 1024 * 1024),
      ports: inspect.NetworkSettings.Ports,
      health: inspect.State.Health?.Status || 'none',
      uptime: new Date(inspect.State.StartedAt),
      restarts: inspect.RestartCount
    };
  } catch (error) {
    console.error('[Docker] Error getting status:', error.message);
    throw error;
  }
};

/**
 * Stop a server gracefully
 * 
 * Sends SIGTERM to allow Minecraft to save world before shutdown
 * 
 * @param {string} containerId - Docker container ID or name
 * @param {number} timeout - Seconds to wait before force kill (default: 10)
 * @returns {Promise<void>}
 */
const stopServer = async (containerId, timeout = 10) => {
  try {
    const container = docker.getContainer(containerId);
    console.log(`[Docker] Stopping server gracefully (${timeout}s timeout)...`);
    
    // Stop with timeout to allow Minecraft to save
    await container.stop({ t: timeout });
    console.log('[Docker] ✅ Server stopped gracefully');
  } catch (error) {
    console.error('[Docker] Error stopping server:', error.message);
    throw error;
  }
};

/**
 * Restart a server
 * 
 * @param {string} containerId - Docker container ID or name
 * @returns {Promise<void>}
 */
const restartServer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    console.log('[Docker] Restarting server...');
    await container.restart();
    console.log('[Docker] ✅ Server restarted');
  } catch (error) {
    console.error('[Docker] Error restarting server:', error.message);
    throw error;
  }
};

/**
 * Delete a server (stop + remove)
 * 
 * WARNING: This stops the server and removes the container
 * World data persists in the volume
 * 
 * @param {string} containerId - Docker container ID or name
 * @returns {Promise<void>}
 */
const deleteServer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    
    // Stop first
    try {
      await stopServer(containerId, 10);
    } catch (e) {
      // Already stopped is fine
    }
    
    // Remove container
    console.log('[Docker] Removing container...');
    await container.remove({ v: false }); // v:false = keep volumes
    console.log('[Docker] ✅ Container removed (data preserved)');
  } catch (error) {
    console.error('[Docker] Error deleting server:', error.message);
    throw error;
  }
};

/**
 * Get container logs (for dashboard console)
 * 
 * @param {string} containerId - Docker container ID or name
 * @param {object} options - Log options
 * @returns {Promise<string>} Container logs
 */
const getServerLogs = async (containerId, options = {}) => {
  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      follow: false,
      timestamps: true,
      ...options
    });
    
    return logs.toString();
  } catch (error) {
    console.error('[Docker] Error getting logs:', error.message);
    throw error;
  }
};

// ============================================================================
// RCON COMMAND EXECUTION
// ============================================================================

/**
 * Execute a command via RCON
 * 
 * Allows the web dashboard to send commands to the running Minecraft server
 * Examples:
 * - /op username
 * - /say Hello world!
 * - /save-all
 * - /list
 * 
 * @param {string} serverIp - Server IP address
 * @param {string} rconPassword - RCON password (from provisioning)
 * @param {string} command - Command to execute
 * @returns {Promise<string>} Command response
 */
const executeRconCommand = async (serverIp, rconPassword, command) => {
  // This requires the rcon-js library
  // For now, we'll document the pattern
  
  try {
    // Future implementation with rcon-js:
    // const Rcon = require('rcon-js');
    // const rcon = new Rcon(serverIp, INTERNAL_RCON_PORT, rconPassword);
    // await rcon.connect();
    // const response = await rcon.execute(command);
    // await rcon.disconnect();
    
    console.log(`[RCON] Executing: ${command}`);
    // return response;
    
    // For now, throw helpful error
    throw new Error('RCON support requires rcon-js library installation');
  } catch (error) {
    console.error('[RCON] Error:', error.message);
    throw error;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  checkDockerHealth,
  pullMinecraftImage,
  launchMinecraftServer,
  getServerStatus,
  stopServer,
  restartServer,
  deleteServer,
  getServerLogs,
  executeRconCommand,
  
  // Constants
  MINECRAFT_IMAGE,
  DATA_BASE_PATH,
  AIKAR_FLAGS
};
