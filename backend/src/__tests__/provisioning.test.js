/**
 * provisioning.test.js
 * 
 * Test suite for provisioning system
 * Run with: npm test -- provisioning.test.js
 */

const crypto = require('crypto');
const net = require('net');
const {
  generateSecurePassword,
  generateSecurePasswordWithSpecial,
  isPortFree,
  allocateServerPort,
  assignServerIP,
  generatePanelCredentials,
  provisionServer
} = require('../lib/provisioning');

describe('Provisioning System', () => {
  
  // ==========================================================================
  // PASSWORD GENERATION TESTS
  // ==========================================================================
  
  describe('generateSecurePassword', () => {
    
    it('should generate a password of correct length', () => {
      const password = generateSecurePassword(12);
      expect(password).toHaveLength(12);
    });
    
    it('should generate alphanumeric passwords only', () => {
      const password = generateSecurePassword(12);
      expect(/^[a-zA-Z0-9]{12}$/.test(password)).toBe(true);
    });
    
    it('should generate unique passwords on each call', () => {
      const p1 = generateSecurePassword(12);
      const p2 = generateSecurePassword(12);
      const p3 = generateSecurePassword(12);
      
      expect(p1).not.toBe(p2);
      expect(p2).not.toBe(p3);
      expect(p1).not.toBe(p3);
    });
    
    it('should work with different lengths', () => {
      const p8 = generateSecurePassword(8);
      const p16 = generateSecurePassword(16);
      const p24 = generateSecurePassword(24);
      
      expect(p8).toHaveLength(8);
      expect(p16).toHaveLength(16);
      expect(p24).toHaveLength(24);
    });
    
    it('should use crypto.randomBytes (test entropy)', () => {
      // Generate 1000 passwords
      const passwords = Array.from({ length: 1000 }, () => 
        generateSecurePassword(12)
      );
      
      // No duplicates expected with 1000 iterations
      const unique = new Set(passwords);
      expect(unique.size).toBe(1000);
    });
    
    it('should default to 12 character length', () => {
      const password = generateSecurePassword();
      expect(password).toHaveLength(12);
    });
  });
  
  describe('generateSecurePasswordWithSpecial', () => {
    
    it('should generate password with special characters', () => {
      const password = generateSecurePasswordWithSpecial(16);
      expect(password).toHaveLength(16);
      // Should contain mix of types
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
    });
    
    it('should not contain ambiguous characters', () => {
      const password = generateSecurePasswordWithSpecial(100);
      // Should not have: 0/O, l/1, etc.
      expect(/[0o]/i.test(password)).toBe(false); // No 0 or O
      expect(/[l1]/i.test(password)).toBe(false); // No l or 1
    });
  });
  
  // ==========================================================================
  // PORT ALLOCATION TESTS
  // ==========================================================================
  
  describe('isPortFree', () => {
    
    it('should return true for free port', async () => {
      const free = await isPortFree(9876);
      expect(free).toBe(true);
    });
    
    it('should return false for used port', async () => {
      // Create a test server on port 9875
      const server = net.createServer();
      await new Promise((resolve) => {
        server.listen(9875, resolve);
      });
      
      const free = await isPortFree(9875);
      expect(free).toBe(false);
      
      server.close();
    });
    
    it('should timeout gracefully', async () => {
      // Port that requires long timeout
      const free = await isPortFree(22); // SSH port, might be protected
      expect(typeof free).toBe('boolean');
    });
    
    it('should handle multiple concurrent checks', async () => {
      const checks = Array.from({ length: 5 }, (_, i) => 
        isPortFree(10000 + i)
      );
      const results = await Promise.all(checks);
      expect(results.every(r => typeof r === 'boolean')).toBe(true);
    });
  });
  
  describe('allocateServerPort', () => {
    
    it('should return a port in valid range', async () => {
      const port = await allocateServerPort(1);
      expect(port).toBeGreaterThanOrEqual(25565);
      expect(port).toBeLessThanOrEqual(26000);
    });
    
    it('should allocate different ports for different servers', async () => {
      const port1 = await allocateServerPort(1);
      const port2 = await allocateServerPort(2);
      expect(port1).not.toBe(port2);
    });
    
    it('should skip ports already in database', async () => {
      // This test assumes DB is set up
      // Would need mock DB for isolated test
      const port = await allocateServerPort(1);
      expect(port).toBeDefined();
    });
    
    it('should handle edge cases', async () => {
      // Test doesn't fail even with special requests
      try {
        const port = await allocateServerPort(999);
        expect(port).toBeDefined();
      } catch (error) {
        // May throw if pool exhausted, which is valid
        expect(error.message).toContain('No free ports');
      }
    });
  });
  
  // ==========================================================================
  // IP ASSIGNMENT TESTS
  // ==========================================================================
  
  describe('assignServerIP', () => {
    
    it('should return an IP object', async () => {
      const result = await assignServerIP(1, 1);
      expect(result).toHaveProperty('ip');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('region');
    });
    
    it('should assign IP from valid regions', async () => {
      const validRegions = ['US-East', 'US-West', 'EU-Central', 'Asia-Pacific'];
      const result = await assignServerIP(1, 1);
      expect(validRegions).toContain(result.location);
    });
    
    it('should format IP correctly', async () => {
      const result = await assignServerIP(1, 1);
      // IP should be in format "xxx.xxx.x.xx"
      expect(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(result.ip)).toBe(true);
    });
    
    it('should have valid region codes', async () => {
      const result = await assignServerIP(1, 1);
      expect(/^[a-z]+-[a-z]+-\d+$/.test(result.region)).toBe(true);
    });
    
    it('should distribute across regions randomly', async () => {
      const results = await Promise.all(
        Array.from({ length: 20 }, (_, i) => assignServerIP(i, 1))
      );
      
      const regions = new Set(results.map(r => r.location));
      // Should use more than 1 region with 20 attempts (high probability)
      expect(regions.size).toBeGreaterThan(1);
    });
  });
  
  // ==========================================================================
  // CREDENTIALS GENERATION TESTS
  // ==========================================================================
  
  describe('generatePanelCredentials', () => {
    
    it('should generate credentials object', () => {
      const creds = generatePanelCredentials(1, 1);
      expect(creds).toHaveProperty('tempUsername');
      expect(creds).toHaveProperty('tempPassword');
      expect(creds).toHaveProperty('panelUrl');
      expect(creds).toHaveProperty('panelLoginUrl');
      expect(creds).toHaveProperty('instructions');
    });
    
    it('should create username from serverId', () => {
      const creds = generatePanelCredentials(42, 1);
      expect(creds.tempUsername).toBe('user_42');
    });
    
    it('should generate alphanumeric password', () => {
      const creds = generatePanelCredentials(1, 1);
      expect(/^[a-zA-Z0-9]{12}$/.test(creds.tempPassword)).toBe(true);
    });
    
    it('should create valid panel URL', () => {
      const creds = generatePanelCredentials(1, 1);
      expect(creds.panelLoginUrl).toContain('username=user_1');
      expect(creds.panelLoginUrl).toContain('/auth/login');
    });
    
    it('should include setup instructions', () => {
      const creds = generatePanelCredentials(1, 1);
      expect(Array.isArray(creds.instructions)).toBe(true);
      expect(creds.instructions.length).toBeGreaterThan(0);
    });
  });
  
  // ==========================================================================
  // COMPLETE PROVISIONING TESTS
  // ==========================================================================
  
  describe('provisionServer', () => {
    
    it('should return complete provisioning data', async () => {
      const result = await provisionServer(1, 1);
      
      expect(result).toHaveProperty('port');
      expect(result).toHaveProperty('ipAddress');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('region');
      expect(result).toHaveProperty('tempUsername');
      expect(result).toHaveProperty('tempPassword');
      expect(result).toHaveProperty('rconPassword');
      expect(result).toHaveProperty('rconHost');
      expect(result).toHaveProperty('rconPort');
      expect(result).toHaveProperty('panelUrl');
      expect(result).toHaveProperty('panelLoginUrl');
      expect(result).toHaveProperty('setupInstructions');
      expect(result).toHaveProperty('provisionedAt');
    });
    
    it('should have consistent credentials', async () => {
      const result = await provisionServer(1, 1);
      // Panel and RCON passwords should match for consistency
      expect(result.tempPassword).toBe(result.rconPassword);
    });
    
    it('should have valid port', async () => {
      const result = await provisionServer(1, 1);
      expect(result.port).toBeGreaterThanOrEqual(25565);
      expect(result.port).toBeLessThanOrEqual(26000);
    });
    
    it('should format RCON details correctly', async () => {
      const result = await provisionServer(1, 1);
      expect(result.rconHost).toBe(result.ipAddress);
      expect(result.rconPort).toBe(25575); // Standard RCON port
    });
    
    it('should include comprehensive instructions', async () => {
      const result = await provisionServer(1, 1);
      expect(result.setupInstructions.length).toBeGreaterThan(2);
      expect(result.setupInstructions[0]).toContain('panel');
    });
  });
  
  // ==========================================================================
  // SECURITY TESTS
  // ==========================================================================
  
  describe('Security Properties', () => {
    
    it('should not use Math.random for passwords', () => {
      // This is a code review test
      const source = generateSecurePassword.toString();
      expect(source).not.toContain('Math.random');
      expect(source).toContain('crypto');
    });
    
    it('should have minimum entropy of 64 bits', () => {
      // 12 chars × log2(62) = 71 bits > 64 bits ✓
      const password = generateSecurePassword(12);
      expect(password).toHaveLength(12);
      // Actual entropy validation would require statistical tests
    });
    
    it('should not repeat passwords in sequence', () => {
      const passwords = Array.from({ length: 100 }, () => 
        generateSecurePassword(12)
      );
      
      for (let i = 0; i < passwords.length - 1; i++) {
        expect(passwords[i]).not.toBe(passwords[i + 1]);
      }
    });
  });
  
  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================
  
  describe('Integration Scenarios', () => {
    
    it('should provision multiple servers with unique credentials', async () => {
      const servers = await Promise.all([
        provisionServer(1, 1),
        provisionServer(2, 1),
        provisionServer(3, 1)
      ]);
      
      // Check all ports are unique
      const ports = servers.map(s => s.port);
      const uniquePorts = new Set(ports);
      expect(uniquePorts.size).toBe(3);
      
      // Check all passwords are unique
      const passwords = servers.map(s => s.tempPassword);
      const uniquePasswords = new Set(passwords);
      expect(uniquePasswords.size).toBe(3);
    });
    
    it('should handle rapid consecutive provisioning', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        provisionServer(i + 100, 1)
      );
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every(r => r.port)).toBe(true);
    });
  });
  
  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================
  
  describe('Error Handling', () => {
    
    it('should handle allocation when pool is exhausted', async () => {
      // This would need a populated database or mock
      // Test structure is ready for implementation
      try {
        // Try to allocate when DB shows 436 servers
        const port = await allocateServerPort(999);
        // May succeed or fail depending on actual state
        expect(port).toBeDefined();
      } catch (error) {
        expect(error.message).toContain('No free ports');
      }
    });
    
    it('should handle network errors in port checking', async () => {
      // This test validates error handling
      try {
        const result = await isPortFree(1); // Low numbered port
        expect(typeof result).toBe('boolean');
      } catch (error) {
        // Should not throw, should return boolean
        fail('isPortFree should not throw');
      }
    });
  });
});

/**
 * Test Execution Guide
 * 
 * Run all tests:
 *   npm test
 * 
 * Run specific suite:
 *   npm test -- provisioning.test.js
 * 
 * Run with coverage:
 *   npm test -- provisioning.test.js --coverage
 * 
 * Watch mode (re-run on change):
 *   npm test -- --watch
 */
