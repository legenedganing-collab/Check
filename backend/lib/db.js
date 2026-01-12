/**
 * Database Connection Bridge (lib/db.js)
 * 
 * DEVELOPMENT MODE: Uses in-memory mock database (mockDb.js)
 * This allows testing without PostgreSQL
 * 
 * TODO: Switch to Prisma + PostgreSQL for production
 */

// Use mock database for development (no PostgreSQL required)
const prisma = require('./mockDb');

// Log database status
if (process.env.NODE_ENV === 'development') {
  console.log('[Database] Using in-memory mock database for development');
  console.log('[Database] Demo account: test@lighth.io / test123456');
}

module.exports = prisma;
