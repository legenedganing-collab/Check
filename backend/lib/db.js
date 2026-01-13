/**
 * Database Connection Bridge (lib/db.js)
 * 
 * This file creates a single instance of Prisma Client
 * that is reused throughout the application.
 * 
 * In development, it prevents multiple instances from being created
 * which can exhaust database connections.
 */

const { PrismaClient } = require('@prisma/client');

// Create a global variable to store the Prisma instance
const globalForPrisma = global;

// Create or reuse existing Prisma Client
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// In development, store the instance globally to prevent multiple instantiations
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Handle graceful shutdown
 * Disconnect Prisma when the process exits
 */
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
