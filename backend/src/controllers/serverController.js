const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { provisionServer } = require('../../lib/provisioning');
const {
  launchMinecraftServer,
  getServerStatus,
  stopServer,
  restartServer,
  deleteServer,
  getServerLogs,
  checkDockerHealth
} = require('../../lib/dockerProvisioner');

const prisma = new PrismaClient();

/**
 * Get all servers for the logged-in user
 * GET /api/servers
 * Requires: JWT token in Authorization header
 */
const getServersByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const servers = await prisma.server.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        uuid: true,
        ipAddress: true,
        port: true,
        memory: true,
        diskSpace: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      message: 'Servers retrieved successfully',
      servers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving servers' });
  }
};

/**
 * Create a new server for the logged-in user
 * POST /api/servers
 * Requires: JWT token in Authorization header
 * Body: { name, memory, diskSpace }
 * 
 * The server is provisioned automatically with:
 * - Unique port allocation (25565-26000 range, checked in DB + network)
 * - Regional IP assignment
 * - RCON credentials generation
 */
const createServer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, memory, diskSpace } = req.body;

    // Validate input
    if (!name || !memory || !diskSpace) {
      return res.status(400).json({
        message: 'Name, memory, and disk space are required',
      });
    }

    // Validate memory and disk ranges
    if (memory < 1 || memory > 16) {
      return res.status(400).json({ message: 'Memory must be between 1GB and 16GB' });
    }

    if (diskSpace < 5 || diskSpace > 500) {
      return res.status(400).json({ message: 'Disk space must be between 5GB and 500GB' });
    }

    // Create the server in database with PROVISIONING status
    // Port will be assigned during provisioning
    const server = await prisma.server.create({
      data: {
        name,
        uuid: uuidv4(),
        ipAddress: '0.0.0.0', // Placeholder, will be updated after provisioning
        port: 0, // Placeholder, will be overwritten with allocated port
        memory,
        diskSpace,
        status: 'provisioning', // Server is being provisioned
        userId,
      },
    });

    console.log(`[Server Creation] Created server ${server.id} for user ${userId}`);

    try {
      // Provision the server (allocate port, assign IP, generate credentials)
      const provisioningData = await provisionServer(server.id, userId);

      // Update server with provisioned values
      let updatedServer = await prisma.server.update({
        where: { id: server.id },
        data: {
          ipAddress: provisioningData.ipAddress,
          port: provisioningData.port, // Now has real allocated port
          rconPassword: provisioningData.rconPassword, // Store RCON password
          status: 'provisioning', // Still provisioning, Docker launch next
        },
      });

      console.log(`[Server Creation] Server ${server.id} provisioned successfully on port ${provisioningData.port}`);

      // Step 2: Launch Docker container using provisioned credentials
      try {
        console.log(`[Docker Launch] Launching Minecraft server in container...`);
        
        const dockerResult = await launchMinecraftServer({
          serverId: server.id,
          name: server.name,
          port: provisioningData.port,
          rconPassword: provisioningData.rconPassword,
          memory: server.memory,
          version: 'LATEST' // Can be made configurable later
        });

        console.log(`[Docker Launch] ✅ Container launched: ${dockerResult.containerId.substring(0, 12)}`);

        // Update server with Docker container info and mark as online
        updatedServer = await prisma.server.update({
          where: { id: server.id },
          data: {
            status: 'online', // Now fully online with running container
            // Optionally store container ID for later reference
          },
        });

        console.log(`[Server Creation] Server ${server.id} is now ONLINE and accepting players`);
      } catch (dockerError) {
        console.error(`[Docker Launch Error] Failed to launch container:`, dockerError.message);
        
        // Container launch failed, mark server as waiting
        await prisma.server.update({
          where: { id: server.id },
          data: { status: 'waiting' }, // Waiting for Docker fix
        });

        // Still return credentials since provisioning worked
        return res.status(201).json({
          message: 'Server provisioned but Docker launch pending - see status',
          server: {
            id: updatedServer.id,
            name: updatedServer.name,
            uuid: updatedServer.uuid,
            ipAddress: updatedServer.ipAddress,
            port: updatedServer.port,
            memory: updatedServer.memory,
            diskSpace: updatedServer.diskSpace,
            status: 'waiting', // Docker not ready yet
            createdAt: updatedServer.createdAt,
          },
          credentials: {
            panelUsername: provisioningData.tempUsername,
            panelPassword: provisioningData.tempPassword,
            panelLoginUrl: provisioningData.panelLoginUrl,
            rconHost: provisioningData.rconHost,
            rconPort: provisioningData.rconPort,
            rconPassword: provisioningData.rconPassword,
          },
          setupInstructions: [
            ...provisioningData.setupInstructions,
            '⏳ Docker container is still launching... check status in 30 seconds'
          ],
          warning: 'Docker launch in progress - server may not be accepting players yet',
        });
      }

      // Return server data WITH temporary credentials (only shown once)
      res.status(201).json({
        message: 'Server created, provisioned, and launched successfully',
        server: {
          id: updatedServer.id,
          name: updatedServer.name,
          uuid: updatedServer.uuid,
          ipAddress: updatedServer.ipAddress,
          port: updatedServer.port,
          memory: updatedServer.memory,
          diskSpace: updatedServer.diskSpace,
          status: updatedServer.status,
          createdAt: updatedServer.createdAt,
        },
        // Temporary credentials (only shown once to user)
        credentials: {
          panelUsername: provisioningData.tempUsername,
          panelPassword: provisioningData.tempPassword,
          panelLoginUrl: provisioningData.panelLoginUrl,
          rconHost: provisioningData.rconHost,
          rconPort: provisioningData.rconPort,
          rconPassword: provisioningData.rconPassword,
        },
        // Setup instructions
        setupInstructions: provisioningData.setupInstructions,
      });
    } catch (provisionError) {
      // If provisioning fails, mark server as failed
      await prisma.server.update({
        where: { id: server.id },
        data: { status: 'failed' },
      });

      console.error(`[Server Provisioning Error] Server ${server.id}:`, provisionError.message);

      return res.status(500).json({
        message: 'Server created but provisioning failed: ' + provisionError.message,
        serverId: server.id,
      });
    }
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(500).json({ message: 'Error creating server: ' + error.message });
  }
};

/**
 * Get a single server by ID (if owned by logged-in user)
 * GET /api/servers/:id
 * Requires: JWT token in Authorization header
 */
const getServerById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    res.status(200).json({
      message: 'Server retrieved successfully',
      server,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving server' });
  }
};

/**
 * Update a server (if owned by logged-in user)
 * PUT /api/servers/:id
 * Requires: JWT token in Authorization header
 */
const updateServer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, ipAddress, port, memory, diskSpace, status } = req.body;

    // Check if server exists and belongs to user
    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    const updatedServer = await prisma.server.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(ipAddress && { ipAddress }),
        ...(port && { port }),
        ...(memory && { memory }),
        ...(diskSpace && { diskSpace }),
        ...(status && { status }),
      },
    });

    res.status(200).json({
      message: 'Server updated successfully',
      server: updatedServer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating server' });
  }
};

/**
 * Delete a server (if owned by logged-in user)
 * DELETE /api/servers/:id
 * Requires: JWT token in Authorization header
 */
const deleteServer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if server exists and belongs to user
    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // If server is running in Docker, stop it first
    if (server.status === 'online' || server.status === 'provisioning') {
      try {
        console.log(`[Server Deletion] Stopping Docker container for server ${server.id}...`);
        // Container name pattern from dockerProvisioner
        const containerName = `mc-${server.id}-${server.name
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/gi, '')
          .toLowerCase()}`;
        
        await stopServer(containerName);
        console.log(`[Server Deletion] Container stopped`);
      } catch (dockerError) {
        console.warn(`[Server Deletion] Could not stop Docker container:`, dockerError.message);
        // Continue with deletion even if Docker stop fails
      }
    }

    await prisma.server.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      message: 'Server deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting server' });
  }
};

/**
 * Get Docker container status for a server
 * GET /api/servers/:id/status
 * Requires: JWT token in Authorization header
 * 
 * Returns live Docker container health and performance metrics
 */
const getServerDockerStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if server exists and belongs to user
    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    try {
      // Get live Docker container status
      const containerName = `mc-${server.id}-${server.name
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/gi, '')
        .toLowerCase()}`;

      const status = await getServerStatus(containerName);

      res.status(200).json({
        message: 'Server status retrieved',
        status: status,
        databaseStatus: server.status // Compare with database
      });
    } catch (dockerError) {
      // Docker container not found or error
      res.status(200).json({
        message: 'Server status unknown - container may not be running',
        status: 'offline',
        databaseStatus: server.status,
        error: dockerError.message
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving server status: ' + error.message });
  }
};

/**
 * Stop a running server
 * POST /api/servers/:id/stop
 * Requires: JWT token in Authorization header
 * 
 * Gracefully shuts down the Minecraft server (saves world before stopping)
 */
const stopServerEndpoint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.status !== 'online') {
      return res.status(400).json({
        message: `Cannot stop server with status: ${server.status}`
      });
    }

    try {
      const containerName = `mc-${server.id}-${server.name
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/gi, '')
        .toLowerCase()}`;

      await stopServer(containerName, 10); // 10 second grace period

      // Update database
      await prisma.server.update({
        where: { id: parseInt(id) },
        data: { status: 'offline' }
      });

      res.status(200).json({
        message: 'Server stopped successfully',
        status: 'offline'
      });
    } catch (dockerError) {
      console.error('[Stop Server Error]', dockerError.message);
      res.status(500).json({
        message: 'Error stopping server: ' + dockerError.message
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error stopping server: ' + error.message });
  }
};

/**
 * Restart a server
 * POST /api/servers/:id/restart
 * Requires: JWT token in Authorization header
 */
const restartServerEndpoint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    try {
      const containerName = `mc-${server.id}-${server.name
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/gi, '')
        .toLowerCase()}`;

      await restartServer(containerName);

      await prisma.server.update({
        where: { id: parseInt(id) },
        data: { status: 'online' }
      });

      res.status(200).json({
        message: 'Server restarted successfully',
        status: 'online'
      });
    } catch (dockerError) {
      console.error('[Restart Server Error]', dockerError.message);
      res.status(500).json({
        message: 'Error restarting server: ' + dockerError.message
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error restarting server: ' + error.message });
  }
};

/**
 * Get server console logs (for live console on dashboard)
 * GET /api/servers/:id/logs
 * Requires: JWT token in Authorization header
 */
const getServerConsoleLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { tail = 100 } = req.query; // Get last N lines (default 100)

    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    try {
      const containerName = `mc-${server.id}-${server.name
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/gi, '')
        .toLowerCase()}`;

      const logs = await getServerLogs(containerName, {
        tail: parseInt(tail)
      });

      res.status(200).json({
        message: 'Server logs retrieved',
        logs: logs,
        serverId: server.id
      });
    } catch (dockerError) {
      console.error('[Get Logs Error]', dockerError.message);
      res.status(500).json({
        message: 'Error retrieving logs: ' + dockerError.message
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving logs: ' + error.message });
  }
};

/**
 * Check Docker daemon health
 * GET /api/health/docker
 * Public endpoint to check if Docker is available
 */
const checkDocker = async (req, res) => {
  try {
    const isHealthy = await checkDockerHealth();
    
    res.status(isHealthy ? 200 : 503).json({
      message: isHealthy ? 'Docker daemon is healthy' : 'Docker daemon is unavailable',
      healthy: isHealthy
    });
  } catch (error) {
    res.status(503).json({
      message: 'Error checking Docker health: ' + error.message,
      healthy: false
    });
  }
};

/**
 * Power control endpoint for starting/stopping/restarting containers
 * POST /api/servers/:id/power
 * Body: { action: 'start' | 'stop' | 'restart' | 'kill' }
 * Requires: JWT token in Authorization header
 */
const powerControl = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { action } = req.body;

    // Validate action
    if (!['start', 'stop', 'restart', 'kill'].includes(action)) {
      return res.status(400).json({ 
        message: 'Invalid action. Must be: start, stop, restart, or kill' 
      });
    }

    // 1. Verify server exists and belongs to user
    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    try {
      // 2. Build container name (must match naming convention in dockerProvisioner.js)
      const containerName = `mc-${server.id}-${server.name
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/gi, '')
        .toLowerCase()}`;

      // 3. Get Docker container
      const container = require('dockerode') ? 
        new (require('dockerode'))().getContainer(containerName) :
        require('../../lib/dockerProvisioner').getContainer(containerName);

      // Use the dockerProvisioner methods that already exist
      const {
        startServer,
        stopServer,
        restartServer,
        killServer
      } = require('../../lib/dockerProvisioner');

      let newStatus = server.status;

      // 4. Execute power action
      switch (action) {
        case 'start':
          console.log(`[Power] Starting server ${server.id}...`);
          // Note: startServer is not exported yet, so we'll handle this manually
          try {
            await container.start();
            newStatus = 'online';
            console.log(`[Power] ✅ Server ${server.id} started`);
          } catch (err) {
            if (err.statusCode === 304) {
              newStatus = 'online'; // Already running
            } else {
              throw err;
            }
          }
          break;

        case 'stop':
          console.log(`[Power] Stopping server ${server.id}...`);
          await stopServer(containerName, 10); // 10 second grace period for save
          newStatus = 'offline';
          console.log(`[Power] ✅ Server ${server.id} stopped gracefully`);
          break;

        case 'restart':
          console.log(`[Power] Restarting server ${server.id}...`);
          await restartServer(containerName);
          newStatus = 'online';
          console.log(`[Power] ✅ Server ${server.id} restarted`);
          break;

        case 'kill':
          console.log(`[Power] Force killing server ${server.id}...`);
          // Kill immediately without grace period
          try {
            await container.kill();
          } catch (err) {
            if (err.statusCode !== 304) throw err; // 304 = already stopped
          }
          newStatus = 'offline';
          console.log(`[Power] ✅ Server ${server.id} force killed`);
          break;
      }

      // 5. Update database status
      const updatedServer = await prisma.server.update({
        where: { id: parseInt(id) },
        data: { status: newStatus }
      });

      res.status(200).json({
        message: `Server ${action} command executed successfully`,
        status: newStatus,
        server: {
          id: updatedServer.id,
          name: updatedServer.name,
          status: updatedServer.status,
        }
      });

    } catch (dockerError) {
      console.error(`[Power] Docker error:`, dockerError.message);
      
      // Handle common Docker errors
      if (dockerError.statusCode === 304) {
        return res.status(200).json({ 
          success: true, 
          message: `Server is already in that state`,
          status: server.status 
        });
      }

      res.status(500).json({
        message: `Failed to ${action} server: ${dockerError.message}`,
        error: dockerError.message
      });
    }
  } catch (error) {
    console.error('[Power] Error:', error);
    res.status(500).json({ message: 'Error controlling server power: ' + error.message });
  }
};

module.exports = {
  getServersByUser,
  createServer,
  getServerById,
  updateServer,
  deleteServer,
  getServerDockerStatus,
  stopServerEndpoint,
  restartServerEndpoint,
  getServerConsoleLogs,
  checkDocker,
  powerControl,
};
