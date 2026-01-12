/**
 * Mock Database - In-Memory User & Server Storage
 * Simple replacement for Prisma + PostgreSQL during development
 * Stores data in memory (resets on server restart)
 * 
 * TODO: Switch to Prisma + PostgreSQL in production
 */

// In-memory storage
const store = {
  users: [
    // Demo account
    {
      id: 1,
      email: 'test@lighth.io',
      username: 'testuser',
      password: '$2a$10$YIjlrLxTWydVVXgEPMZUiuu7K.sHVRfYEDCvp9/RHhVaA7qwPDGPm', // test123456 (bcrypt hashed)
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  servers: [],
  nextUserId: 2,
  nextServerId: 1,
  nextPort: 25565
};

// Export mock Prisma client
const prisma = {
  // ============================================================================
  // USER OPERATIONS
  // ============================================================================
  
  user: {
    /**
     * Find user by email
     */
    findUnique: async ({ where }) => {
      if (where.email) {
        return store.users.find(u => u.email === where.email) || null;
      }
      if (where.id) {
        return store.users.find(u => u.id === where.id) || null;
      }
      return null;
    },

    /**
     * Find first user matching criteria
     */
    findFirst: async ({ where }) => {
      if (!where) return store.users[0] || null;
      
      if (where.email) {
        return store.users.find(u => u.email === where.email) || null;
      }
      if (where.username) {
        return store.users.find(u => u.username === where.username) || null;
      }
      return null;
    },

    /**
     * Create new user
     */
    create: async ({ data }) => {
      const user = {
        id: store.nextUserId++,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.users.push(user);
      return user;
    },

    /**
     * Update user
     */
    update: async ({ where, data }) => {
      const user = store.users.find(u => u.id === where.id);
      if (!user) throw new Error('User not found');
      
      Object.assign(user, data, { updatedAt: new Date() });
      return user;
    },

    /**
     * Delete user
     */
    delete: async ({ where }) => {
      const idx = store.users.findIndex(u => u.id === where.id);
      if (idx === -1) throw new Error('User not found');
      
      const [deleted] = store.servers.splice(idx, 1);
      return deleted;
    }
  },

  // ============================================================================
  // SERVER OPERATIONS
  // ============================================================================
  
  server: {
    /**
     * Get all servers for a user
     */
    findMany: async ({ where, select }) => {
      let servers = store.servers;

      if (where?.userId) {
        servers = servers.filter(s => s.userId === where.userId);
      }

      if (where?.port) {
        if (where.port.gte !== undefined || where.port.lte !== undefined) {
          servers = servers.filter(s => {
            if (where.port.gte && s.port < where.port.gte) return false;
            if (where.port.lte && s.port > where.port.lte) return false;
            return true;
          });
        }
      }

      // Project selected fields if specified
      if (select) {
        return servers.map(s => {
          const projected = {};
          Object.keys(select).forEach(key => {
            projected[key] = s[key];
          });
          return projected;
        });
      }

      return servers;
    },

    /**
     * Get a single server by ID
     */
    findUnique: async ({ where, include }) => {
      const server = store.servers.find(s => s.id === where.id);
      if (!server) return null;

      if (include?.user) {
        return {
          ...server,
          user: store.users.find(u => u.id === server.userId)
        };
      }

      return server;
    },

    /**
     * Create new server
     */
    create: async ({ data }) => {
      const server = {
        id: store.nextServerId++,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.servers.push(server);
      return server;
    },

    /**
     * Update server
     */
    update: async ({ where, data }) => {
      const server = store.servers.find(s => s.id === where.id);
      if (!server) throw new Error('Server not found');

      Object.assign(server, data, { updatedAt: new Date() });
      return server;
    },

    /**
     * Delete server
     */
    delete: async ({ where }) => {
      const idx = store.servers.findIndex(s => s.id === where.id);
      if (idx === -1) throw new Error('Server not found');

      const [deleted] = store.servers.splice(idx, 1);
      return deleted;
    }
  }
};

module.exports = prisma;
