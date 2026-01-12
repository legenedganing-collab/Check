const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
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
  getServerFiles,
} = require('../controllers/serverController');

const router = express.Router();

/**
 * All routes in this file require JWT authentication (except /health/docker)
 */
router.use(authMiddleware);

/**
 * GET /api/servers
 * Get all servers for the logged-in user
 */
router.get('/', getServersByUser);

/**
 * POST /api/servers
 * Create a new server
 * Body: { name, memory, diskSpace }
 * Returns: Server with temporary credentials and setup instructions
 */
router.post('/', createServer);

/**
 * GET /api/servers/:id
 * Get a specific server by ID (if owned by user)
 */
router.get('/:id', getServerById);

/**
 * PUT /api/servers/:id
 * Update a server (if owned by user)
 */
router.put('/:id', updateServer);

/**
 * DELETE /api/servers/:id
 * Delete a server (if owned by user)
 * Also stops and removes the Docker container
 */
router.delete('/:id', deleteServer);

/**
 * GET /api/servers/:id/status
 * Get live Docker container status
 * Returns: Container health, memory usage, uptime, port mappings
 */
router.get('/:id/status', getServerDockerStatus);

/**
 * POST /api/servers/:id/stop
 * Gracefully stop a running server
 * Gives Minecraft time to save world before stopping
 */
router.post('/:id/stop', stopServerEndpoint);

/**
 * POST /api/servers/:id/restart
 * Restart a server (useful for applying config changes)
 */
router.post('/:id/restart', restartServerEndpoint);

/**
 * GET /api/servers/:id/logs
 * Get server console logs (for live console on dashboard)
 * Query params:
 * - tail=100 (default) - Get last N lines of output
 */
router.get('/:id/logs', getServerConsoleLogs);

/**
 * POST /api/servers/:id/power
 * Control server power state (start, stop, restart, kill)
 * Body: { action: 'start' | 'stop' | 'restart' | 'kill' }
 */
router.post('/:id/power', powerControl);

/**
 * GET /api/servers/:id/files
 * Get file listing from server's directory (for file manager)
 * Query params:
 * - path=/plugins (default: /) - Get files in specific directory
 */
router.get('/:id/files', getServerFiles);

module.exports = router;

