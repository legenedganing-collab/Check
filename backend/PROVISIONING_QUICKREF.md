# Provisioning System - Developer Quick Reference

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Environment Variables

```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection string
```

### 3. Run Database Migration

```bash
npx prisma migrate dev --name add_port_tracking
```

This adds:
- `port: Int @unique` - Ensures no duplicate port assignments
- `rconPassword: String?` - Stores RCON password
- Updated `status` field for provisioning states

## File Structure

```
backend/
├── lib/
│   └── provisioning.js          # Core provisioning logic
├── src/
│   └── controllers/
│       └── serverController.js  # API endpoints
├── prisma/
│   └── schema.prisma            # Database schema
├── PROVISIONING_PRODUCTION.md   # Security & scalability details
├── DOCKER_INTEGRATION.md        # Docker launch guide
└── QUICKSTART.md                # Server setup
```

## Core Functions

### generateSecurePassword(length = 12)

**Purpose**: Generate cryptographically secure password

```javascript
const password = generateSecurePassword(12);
// Returns: "7a2B9xPq1mZ9" (12-char alphanumeric)
```

**Key Points**:
- Uses `crypto.randomBytes()` (NOT Math.random())
- 71 bits of entropy
- Safe for RCON, panel admin passwords
- Alphanumeric only (RCON compatible)

### allocateServerPort(userId)

**Purpose**: Find and allocate a unique port

```javascript
const port = await allocateServerPort(userId);
// Returns: 25566 (first available in 25565-26000 range)
```

**Algorithm**:
1. Get all ports in use from database
2. For each port 25565-26000:
   - Skip if in database
   - Test if physically free with `net.createServer()`
   - Return first available

**Returns**: Port number or throws error if all in use

### assignServerIP(serverId, userId)

**Purpose**: Assign regional IP address

```javascript
const ipData = await assignServerIP(serverId, userId);
// Returns: {
//   ip: "154.12.1.45",
//   location: "US-East",
//   region: "us-east-1"
// }
```

**Regions Simulated**:
- US-East: 154.12.1.x
- US-West: 185.45.2.x
- EU-Central: 95.211.3.x
- Asia-Pacific: 103.21.4.x

### generatePanelCredentials(serverId, userId)

**Purpose**: Create control panel login credentials

```javascript
const creds = generatePanelCredentials(serverId, userId);
// Returns: {
//   tempUsername: "user_1",
//   tempPassword: "7a2B9xPq1mZ9",
//   panelUrl: "https://panel.lighth.io",
//   panelLoginUrl: "https://panel.lighth.io/auth/login?username=user_1"
// }
```

### provisionServer(serverId, userId)

**Purpose**: Complete provisioning orchestration

```javascript
const provisioningData = await provisionServer(serverId, userId);
// Returns: {
//   port: 25566,
//   ipAddress: "154.12.1.45",
//   rconHost: "154.12.1.45",
//   rconPort: 25575,
//   rconPassword: "7a2B9xPq1mZ9",
//   tempUsername: "user_1",
//   tempPassword: "7a2B9xPq1mZ9",
//   panelLoginUrl: "https://...",
//   setupInstructions: [...]
// }
```

Combines:
1. Port allocation
2. IP assignment  
3. Credential generation

## API Endpoints

### POST /api/servers

**Create a new server**

Request:
```json
{
  "name": "Survival Server",
  "memory": 4,
  "diskSpace": 50
}
```

Response (201):
```json
{
  "server": {
    "id": 1,
    "name": "Survival Server",
    "ipAddress": "154.12.1.45",
    "port": 25566,
    "memory": 4,
    "diskSpace": 50,
    "status": "online"
  },
  "credentials": {
    "panelUsername": "user_1",
    "panelPassword": "7a2B9xPq1mZ9",
    "rconPassword": "7a2B9xPq1mZ9",
    "rconHost": "154.12.1.45",
    "rconPort": 25575
  },
  "setupInstructions": [...]
}
```

**Important**: 
- Temporary password is only in response, NOT stored
- Returned once to user during creation
- Should be displayed immediately (e.g., on success screen)

### GET /api/servers

**List all user's servers**

Response (200):
```json
{
  "servers": [
    {
      "id": 1,
      "name": "Survival Server",
      "port": 25566,
      "ipAddress": "154.12.1.45",
      "status": "online"
    }
  ]
}
```

### GET /api/servers/:id

**Get server details**

Response (200):
```json
{
  "server": {
    "id": 1,
    "name": "Survival Server",
    "port": 25566,
    "ipAddress": "154.12.1.45",
    "memory": 4,
    "diskSpace": 50,
    "status": "online"
  }
}
```

Note: `rconPassword` is not returned in GET requests for security

### PUT /api/servers/:id

**Update server properties**

Allowed updates:
- `name`
- `status` (provisioning, online, offline, failed)
- `memory` (requires restart)
- `diskSpace` (requires restart)

⚠️ Cannot update: `port`, `ipAddress` (fixed after provisioning)

### DELETE /api/servers/:id

**Delete server**

Response (200):
```json
{ "message": "Server deleted successfully" }
```

## Database Schema

```prisma
model Server {
  id          Int     @id @default(autoincrement())
  name        String
  uuid        String  @unique
  ipAddress   String
  port        Int     @unique  // ← Prevents duplicates
  memory      Int
  diskSpace   Int
  status      String           // "provisioning", "online", "offline", "failed"
  rconPassword String?         // ← Stores RCON password
  
  userId      Int
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("servers")
}
```

**Key Fields**:
- `port @unique`: Database constraint prevents duplicate ports
- `rconPassword`: Stores RCON password for later access
- `status`: Tracks provisioning progress
  - "provisioning": Allocating resources
  - "online": Ready to accept players
  - "offline": Stopped gracefully
  - "failed": Provisioning error

## Security Checklist

- ✅ Use `crypto.randomBytes()` for all password generation
- ✅ Never store temporary password from creation response
- ✅ Always check port availability before assignment
- ✅ Use database `@unique` constraint on port
- ✅ Verify JWT token on all server endpoints
- ✅ Enforce user ownership (can only see own servers)
- ✅ Validate input (name 3-32 chars, memory 1-16 GB, etc.)
- ✅ Rate limit server creation endpoint
- ✅ Log provisioning operations for audit trail

## Common Workflows

### Workflow 1: Create Server with CLI

```bash
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Server",
    "memory": 4,
    "diskSpace": 50
  }'
```

### Workflow 2: Get User's Servers

```bash
curl http://localhost:5000/api/servers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Workflow 3: Execute RCON Command

```bash
# After getting rconPassword from creation response
docker run --rm --net host \
  javaberger/mcrcon \
  -H 154.12.1.45 \
  -P 25575 \
  -p "7a2B9xPq1mZ9" \
  "say Welcome to server!"
```

## Troubleshooting

### Port Allocation Fails

```javascript
// Check if port pool exhausted
const servers = await prisma.server.findMany();
console.log(`${servers.length} servers using 436 available ports`);

// If > 430 servers, port pool is exhausted
// Solution: Implement PortPool table (see PROVISIONING_PRODUCTION.md)
```

### RCON Password Not Working

```bash
# Verify password was set
docker exec <container_id> cat /data/server.properties | grep rcon.password

# Check RCON port is accessible
telnet 154.12.1.45 25575

# Verify container is actually running
docker ps | grep lighth_server
```

### Duplicate Port Assignment

```javascript
// This shouldn't happen with proper migration
// If it does, fix with:
UPDATE servers SET port = port + 1000 WHERE port = (
  SELECT port FROM servers GROUP BY port HAVING count(*) > 1
);

// Then add unique constraint in migration
```

## Performance Tips

### For Many Servers (100+)

```javascript
// 1. Add database indexes
// See schema.prisma for @@index directives

// 2. Implement port pool table
// See PROVISIONING_PRODUCTION.md for details

// 3. Cache region list
const REGIONS = [
  { name: 'US-East', ip: '154.12.1.' },
  // ...
]; // Don't recreate on every request

// 4. Use connection pooling
// In .env:
DATABASE_URL="postgresql://user:pass@host/db?schema=public&pool_size=20"
```

### For High Concurrency

```javascript
// Use transactions to prevent race conditions
const server = await prisma.$transaction(async (tx) => {
  // All queries run atomically
  const port = await allocateServerPort(userId);
  return await tx.server.create({
    data: { port, ... }
  });
}, { timeout: 5000 });
```

## Testing

```bash
# Run tests
npm test

# Test specific function
npm test -- provisioning.test.js

# Test with coverage
npm test -- --coverage
```

## Debugging

Enable detailed logging:

```javascript
// In provisioning.js
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log(`[Port Allocation] Checking port ${port}`);
  console.log(`[Provisioning] Allocated port ${port} for server ${serverId}`);
}
```

Run with debug enabled:
```bash
DEBUG=true node server.js
```

## Next Steps

1. **Database Migration**: Run `npx prisma migrate dev`
2. **Test Creation**: Create a server via API
3. **Docker Integration**: See `DOCKER_INTEGRATION.md` for launching containers
4. **Production Deployment**: See `PROVISIONING_PRODUCTION.md` for scalability

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [RCON Protocol](https://wiki.vg/RCON)
- [itzg/minecraft-server Docker Image](https://github.com/itzg/docker-minecraft-server)

---

**Questions?** Check the implementation in `lib/provisioning.js` or `src/controllers/serverController.js`.
