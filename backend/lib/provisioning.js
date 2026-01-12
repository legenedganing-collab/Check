/**
 * Server provisioning utilities - ROBUST VERSION
 * Handles secure password generation, port allocation, IP assignment
 * 
 * Key Features:
 * - Cryptographically secure passwords (crypto.randomBytes)
 * - Database + network port verification
 * - Regional IP assignment
 * - Complete server credential generation
 */

const crypto = require('crypto');
const net = require('net');
const prisma = require('./db');

// ============================================================================
// SECURE PASSWORD GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure temporary password
 * Uses crypto.randomBytes instead of Math.random() for security
 * 
 * Format: 12-character alphanumeric (e.g., "7a2B9xPq1mZ9")
 * - Compatible with RCON and panel systems
 * - No special characters (safer for command-line)
 * - High entropy from crypto.randomBytes
 * 
 * @param {number} length - Password length (default: 12)
 * @returns {string} Secure password
 */
const generateSecurePassword = (length = 12) => {
  // crypto.randomBytes generates cryptographically secure random bytes
  // toString('base64') converts to alphanumeric (includes a-z, A-Z, 0-9, +, /, =)
  // Replace removes special chars, keeping only alphanumeric
  // substring(0, length) ensures exact length
  
  let password = '';
  while (password.length < length) {
    password += crypto
      .randomBytes(length)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, ''); // Remove +, /, = for compatibility
  }
  return password.substring(0, length);
};

/**
 * Alternative: Generate password with special characters (for admin panels)
 * Use this if your control panel supports special characters in passwords
 * 
 * @param {number} length - Password length (default: 16)
 * @returns {string} Secure password with special characters
 */
const generateSecurePasswordWithSpecial = (length = 16) => {
  // Charset for passwords (exclude ambiguous chars like 0/O, l/1)
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  
  let password = '';
  // Use getRandomValues to fill all bytes at once (more efficient)
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
};

// ============================================================================
// PORT ALLOCATION
// ============================================================================

/**
 * Check if a port is physically available on the system
 * Uses net.createServer() to bind and verify port is free
 * 
 * @param {number} port - Port to check
 * @param {string} host - Host to check on (default: localhost)
 * @returns {Promise<boolean>} True if port is free
 */
const isPortFree = async (port, host = 'localhost') => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      // Port is in use or cannot be bound
      console.warn(`Port ${port} check failed:`, err.code);
      resolve(false);
    });
    
    server.once('listening', () => {
      // Port is free, close the test server
      server.close(() => {
        resolve(true);
      });
    });
    
    // Attempt to bind to the port
    server.listen(port, host);
    
    // Safety timeout: resolve false if not resolved after 2 seconds
    setTimeout(() => {
      server.close();
      resolve(false);
    }, 2000);
  });
};

/**
 * Allocate a unique port for a new server
 * Checks BOTH database and network to ensure port is truly available
 * 
 * Port Range: 25565 - 26000 (436 possible ports)
 * Strategy:
 * 1. Load all ports in use from database
 * 2. For each available port, check if it's physically free
 * 3. Return the first available port
 * 4. If all ports taken, throw error
 * 
 * @param {string} userId - User ID (for context)
 * @returns {Promise<number>} Available port number
 * @throws {Error} If no ports available
 */
const allocateServerPort = async (userId) => {
  const PORT_MIN = 25565; // Default Minecraft port
  const PORT_MAX = 26000; // Range for hosted servers

  try {
    // 1. Get all ports already assigned in database
    const usedServers = await prisma.server.findMany({
      select: { port: true },
      where: {
        port: { gte: PORT_MIN, lte: PORT_MAX }
      }
    });
    
    const usedPorts = new Set(usedServers.map(s => s.port));
    console.log(`[Port Allocation] Found ${usedPorts.size} servers in database using ports ${PORT_MIN}-${PORT_MAX}`);

    // 2. Find the first available port
    let allocatedPort = null;
    for (let port = PORT_MIN; port <= PORT_MAX; port++) {
      if (!usedPorts.has(port)) {
        // Verify the port isn't being used by other system processes
        const isFree = await isPortFree(port);
        if (isFree) {
          allocatedPort = port;
          console.log(`[Port Allocation] Allocated port ${port} for userId ${userId}`);
          break;
        } else {
          console.warn(`[Port Allocation] Port ${port} is in use (system process)`);
        }
      }
    }

    if (!allocatedPort) {
      throw new Error(`No free ports available in range ${PORT_MIN}-${PORT_MAX}. All 436 ports are in use.`);
    }

    return allocatedPort;
  } catch (error) {
    console.error('[Port Allocation Error]', error.message);
    throw error;
  }
};

// ============================================================================
// IP ASSIGNMENT
// ============================================================================

/**
 * Assign a regional IP address from simulated pool
 * In production: Replace with actual Pterodactyl/Pelican API call
 * 
 * @param {string} serverId - Server ID
 * @param {string} userId - User ID
 * @returns {Promise<{ip: string, location: string}>} Assigned IP and location
 */
const assignServerIP = async (serverId, userId) => {
  // Regional IP pools (simulated)
  const regions = [
    { name: 'US-East', ip: '154.12.1.', location: 'us-east-1' },
    { name: 'US-West', ip: '185.45.2.', location: 'us-west-1' },
    { name: 'EU-Central', ip: '95.211.3.', location: 'eu-central-1' },
    { name: 'Asia-Pacific', ip: '103.21.4.', location: 'ap-southeast-1' },
  ];

  // Random region selection
  // In production: Use user's region preference
  const randomIndex = crypto.randomInt(0, regions.length);
  const region = regions[randomIndex];

  // Generate random IP in region
  // crypto.randomInt is more secure than Math.random()
  const ipOctet = crypto.randomInt(0, 256);
  const fullIP = `${region.ip}${ipOctet}`;

  console.log(`[IP Assignment] Assigned ${fullIP} (${region.name}) to server ${serverId}`);

  return {
    ip: fullIP,
    location: region.name,
    region: region.location
  };
};

// ============================================================================
// PANEL CREDENTIALS
// ============================================================================

/**
 * Generate panel login credentials for control panel access
 * Creates temporary username and password for Pterodactyl/Pelican
 * 
 * Temporary Username: user_{serverId}
 * Temporary Password: 12-char secure alphanumeric
 * Panel URL: Direct login link with username pre-filled
 * 
 * @param {string} serverId - Server ID
 * @param {string} userId - User ID
 * @returns {object} Panel credentials object
 */
const generatePanelCredentials = (serverId, userId) => {
  const tempUsername = `user_${serverId}`;
  const tempPassword = generateSecurePassword(12); // 12-char for RCON compatibility
  const panelDomain = process.env.PANEL_URL || 'https://panel.lighth.io';
  const panelLoginUrl = `${panelDomain}/auth/login?username=${tempUsername}`;

  return {
    tempUsername,
    tempPassword,
    panelUrl: panelDomain,
    panelLoginUrl,
    // Additional info for email/SMS delivery
    instructions: [
      `1. Visit: ${panelLoginUrl}`,
      `2. Enter username: ${tempUsername}`,
      `3. Enter password: ${tempPassword}`,
      `4. You will be forced to change your password on first login`,
      `5. Use RCON port: 25575 (universal RCON port)`
    ]
  };
};

// ============================================================================
// COMPLETE SERVER PROVISIONING
// ============================================================================

/**
 * Complete provisioning orchestration
 * 
 * Combines:
 * 1. Port allocation (database + network checks)
 * 2. IP assignment (from regional pools)
 * 3. Credentials generation (secure passwords)
 * 4. All security measures
 * 
 * @param {string} serverId - Server ID (from database)
 * @param {string} userId - User ID
 * @returns {Promise<object>} Complete provisioning data
 */
const provisionServer = async (serverId, userId) => {
  try {
    console.log(`[Provisioning] Starting for server ${serverId}, user ${userId}`);

    // Step 1: Allocate a unique port
    const port = await allocateServerPort(userId);

    // Step 2: Assign an IP address
    const ipData = await assignServerIP(serverId, userId);

    // Step 3: Generate credentials
    const credentials = generatePanelCredentials(serverId, userId);

    // Step 4: Combine all provisioning data
    const provisioningData = {
      port,
      ipAddress: ipData.ip,
      location: ipData.location,
      region: ipData.region,
      
      // Credentials (tempPassword should be sent but NOT stored)
      tempUsername: credentials.tempUsername,
      tempPassword: credentials.tempPassword,
      panelUrl: credentials.panelUrl,
      panelLoginUrl: credentials.panelLoginUrl,
      
      // RCON (Remote Console) access
      rconPort: 25575, // Standard RCON port
      rconPassword: credentials.tempPassword, // Same as panel password
      rconHost: ipData.ip,
      
      // Instructions for user
      setupInstructions: credentials.instructions,
      
      // Metadata
      provisionedAt: new Date().toISOString()
    };

    console.log(`[Provisioning] Complete for server ${serverId}`);
    return provisioningData;
  } catch (error) {
    console.error(`[Provisioning Error] Server ${serverId}:`, error.message);
    throw error;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  generateSecurePassword,
  generateSecurePasswordWithSpecial,
  isPortFree,
  allocateServerPort,
  assignServerIP,
  generatePanelCredentials,
  provisionServer
};
