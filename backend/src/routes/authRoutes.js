const express = require('express');
const { register, login } = require('../controllers/authController');
const { checkDocker } = require('../controllers/serverController');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, username, password }
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login an existing user
 * Body: { email, password }
 * Returns: JWT token
 */
router.post('/login', login);

/**
 * GET /api/health/docker
 * Check Docker daemon health (public endpoint)
 * Returns: { healthy: boolean, message: string }
 * 
 * Use this to verify Docker is running before allowing server creation
 */
router.get('/health/docker', checkDocker);

module.exports = router;

