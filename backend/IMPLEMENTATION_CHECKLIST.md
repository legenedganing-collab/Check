# Implementation Checklist - Production-Grade Provisioning

## Phase 1: Database & Schema Updates

### Step 1: Review Changes
- [ ] Read `ENHANCEMENT_SUMMARY.md` to understand what changed
- [ ] Review `PROVISIONING_PRODUCTION.md` for security rationale
- [ ] Check `backend/prisma/schema.prisma` for new fields

**Files to Review:**
- `backend/prisma/schema.prisma` - New port @unique and rconPassword fields
- `ENHANCEMENT_SUMMARY.md` - Before/after comparison

**Expected Changes in schema.prisma:**
```prisma
port        Int     @unique        ← NEW
rconPassword String?               ← NEW
status      String  @default("provisioning")  ← CHANGED
```

### Step 2: Run Database Migration
```bash
cd backend
npx prisma migrate dev --name add_port_tracking
```

**What it does:**
- Adds `port` column with @unique constraint
- Adds `rconPassword` column (nullable)
- Updates `status` field defaults
- Creates migration file: `backend/prisma/migrations/add_port_tracking/migration.sql`

**Verification:**
```bash
# Check migration was applied
npx prisma db push

# Verify schema
npx prisma generate
```

### Step 3: Backup Existing Data
```bash
# Before migration, backup your database
pg_dump lighth > lighth_backup_$(date +%Y%m%d).sql
```

---

## Phase 2: Code Updates

### Step 1: Verify provisioning.js Changes
```bash
# Review the new provisioning system
cat backend/lib/provisioning.js | head -100

# Verify key functions exist
grep -n "generateSecurePassword\|allocateServerPort\|isPortFree" backend/lib/provisioning.js
```

**Expected Functions:**
- ✅ `generateSecurePassword()` - Cryptographically secure passwords
- ✅ `isPortFree()` - Network port availability test
- ✅ `allocateServerPort()` - Intelligent port allocation
- ✅ `assignServerIP()` - Regional IP assignment
- ✅ `generatePanelCredentials()` - Panel login setup
- ✅ `provisionServer()` - Complete orchestration

### Step 2: Verify serverController.js Changes
```bash
# Check updated createServer function
grep -A 30 "const createServer = async" backend/src/controllers/serverController.js
```

**Expected Changes:**
- ✅ Port is allocated automatically (not user input)
- ✅ provisionServer() is called with proper error handling
- ✅ Response includes structured credentials
- ✅ Setup instructions are provided
- ✅ Status transitions: provisioning → online/failed

### Step 3: Test Imports
```bash
# Verify provisioning.js can be imported
node -e "const p = require('./backend/lib/provisioning.js'); console.log(Object.keys(p));"
```

**Expected Output:**
```
[
  'generateSecurePassword',
  'generateSecurePasswordWithSpecial',
  'isPortFree',
  'allocateServerPort',
  'assignServerIP',
  'generatePanelCredentials',
  'provisionServer'
]
```

---

## Phase 3: Testing

### Step 1: Unit Tests
```bash
# Run the comprehensive test suite
npm test -- provisioning.test.js

# Or if jest is configured:
npx jest src/__tests__/provisioning.test.js
```

**Test Coverage:**
- ✅ Password generation (uniqueness, entropy, format)
- ✅ Port allocation (uniqueness, validity, conflict detection)
- ✅ IP assignment (region distribution, format)
- ✅ Credentials generation (structure, validity)
- ✅ Complete provisioning (all components together)

### Step 2: Manual Testing - Single Server
```bash
# 1. Start backend
npm start

# 2. Get JWT token (from login)
export TOKEN="your_jwt_token_here"

# 3. Create first server
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Server 1",
    "memory": 2,
    "diskSpace": 20
  }' | jq .

# Expected response:
# {
#   "server": {
#     "port": 25565,
#     "status": "online"
#   },
#   "credentials": {
#     "rconPassword": "7a2B9xPq1mZ9",
#     "rconHost": "154.12.1.45",
#     "rconPort": 25575
#   }
# }
```

**Verification:**
- [ ] Port is assigned (not 0 or default)
- [ ] IP address is in valid format
- [ ] rconPassword is 12 characters, alphanumeric
- [ ] Status is "online"
- [ ] setupInstructions array exists

### Step 3: Manual Testing - Multiple Servers
```bash
# Create 3 servers in sequence
for i in {1..3}; do
  curl -X POST http://localhost:5000/api/servers \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test Server $i\",
      \"memory\": 2,
      \"diskSpace\": 20
    }" | jq '.server.port'
done

# Expected: 25565, 25566, 25567 (all different)
```

**Verification:**
- [ ] Each server gets a unique port
- [ ] Ports are sequential (no conflicts)
- [ ] Each server has different rconPassword
- [ ] All servers show "online" status

### Step 4: Concurrent Testing
```bash
# Test rapid concurrent requests
for i in {1..5}; do
  (curl -X POST http://localhost:5000/api/servers \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Concurrent'$i'","memory":2,"diskSpace":20}' \
    -H "Content-Type: application/json") &
done
wait

# Verify no port conflicts in database
psql -d lighth -c "SELECT port, COUNT(*) FROM servers GROUP BY port HAVING COUNT(*) > 1;"
# Should return no rows (no duplicates)
```

### Step 5: Verify Database State
```bash
# Check servers table
psql -d lighth -c "SELECT id, name, port, status, rconPassword FROM servers LIMIT 5;"

# Verify port uniqueness constraint
psql -d lighth -c "\d servers" | grep port

# Should show: port int NOT NULL UNIQUE
```

---

## Phase 4: Frontend Integration

### Step 1: Review API Response Format
```javascript
// Check what the new API returns
const response = {
  server: {
    id: 1,
    port: 25566,
    ipAddress: "154.12.1.45",
    status: "online"
  },
  credentials: {
    panelUsername: "user_1",
    panelPassword: "7a2B9xPq1mZ9",
    panelLoginUrl: "https://panel.lighth.io/auth/login?username=user_1",
    rconHost: "154.12.1.45",
    rconPort: 25575,
    rconPassword: "7a2B9xPq1mZ9"
  },
  setupInstructions: [
    "1. Visit: https://...",
    "2. Enter username: user_1",
    // ...
  ]
};
```

### Step 2: Update DeploymentSuccess Component
The frontend needs to display these new credentials:

```javascript
// In src/components/DeploymentSuccess.jsx

const DeploymentSuccess = ({ server, credentials, setupInstructions }) => {
  return (
    <>
      {/* Server Details */}
      <div>IP: {server.ipAddress}</div>
      <div>Port: {server.port}</div>
      
      {/* RCON Credentials */}
      <div>RCON Host: {credentials.rconHost}</div>
      <div>RCON Port: {credentials.rconPort}</div>
      <div>RCON Password: {credentials.rconPassword}</div>
      
      {/* Panel Login */}
      <div>Panel Username: {credentials.panelUsername}</div>
      <div>Panel Password: {credentials.panelPassword}</div>
      
      {/* Setup Instructions */}
      {setupInstructions.map((instruction, i) => (
        <p key={i}>{instruction}</p>
      ))}
    </>
  );
};
```

### Step 3: Update CreateServerForm
```javascript
// Ensure form calls API correctly
const response = await fetch('/api/servers', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    name,
    memory,
    diskSpace
    // Remove: port, ipAddress (auto-allocated)
  })
});

const data = await response.json();
// Pass to parent: data.server, data.credentials, data.setupInstructions
onServerCreated(data);
```

### Step 4: Test Frontend Workflow
```bash
# 1. Start frontend
cd src && npm run dev

# 2. Login
# 3. Create server
# 4. Verify success screen displays:
#    - Port from server.port
#    - IP from server.ipAddress
#    - RCON credentials
#    - Setup instructions
```

---

## Phase 5: Docker Integration (Optional)

See `DOCKER_INTEGRATION.md` for complete Docker setup.

### Quick Docker Test
```bash
# 1. Ensure Docker is running
docker ps

# 2. Pull Minecraft image
docker pull itzg/minecraft-server:latest

# 3. Test container launch with generated credentials
docker run -d \
  --name test_minecraft \
  -p 25566:25565/tcp \
  -e EULA=TRUE \
  -e MEMORY=2G \
  -e RCON_ENABLED=true \
  -e RCON_PASSWORD="7a2B9xPq1mZ9" \
  itzg/minecraft-server:latest

# 4. Verify container is running
docker logs test_minecraft | head -20

# 5. Clean up
docker stop test_minecraft
docker rm test_minecraft
```

---

## Phase 6: Documentation & Knowledge Transfer

### Step 1: Review Documentation
- [ ] Read `PROVISIONING_PRODUCTION.md` (security & scalability)
- [ ] Read `DOCKER_INTEGRATION.md` (Docker setup)
- [ ] Read `PROVISIONING_QUICKREF.md` (developer reference)
- [ ] Read `ENHANCEMENT_SUMMARY.md` (what changed)

### Step 2: Setup Team Wiki
- [ ] Create wiki page from `PROVISIONING_QUICKREF.md`
- [ ] Create troubleshooting guide section
- [ ] Document your infrastructure setup
- [ ] Record any environment-specific changes

### Step 3: Create Runbooks
- [ ] Provisioning failure recovery
- [ ] Port pool exhaustion handling
- [ ] Database migration rollback
- [ ] Emergency port deallocation

---

## Phase 7: Monitoring & Observability

### Step 1: Add Monitoring Logs
```javascript
// In provisioning.js - logs are already there:
console.log(`[Port Allocation] Allocated port ${port}`);
console.log(`[Provisioning] Complete for server ${serverId}`);
console.error(`[Provisioning Error]`, error);
```

### Step 2: Setup Alerts
```javascript
// Monitor metrics in production:
if (provisionedServersCount > 430) {
  alert('Port pool nearly exhausted'); // 436 total ports
}

if (provisioningErrors > 10) {
  alert('Provisioning failures detected');
}
```

### Step 3: Add APM Integration
Consider integrating with:
- [ ] New Relic
- [ ] DataDog
- [ ] Sentry
- [ ] CloudWatch (if AWS)

---

## Phase 8: Performance & Load Testing

### Step 1: Single Server Provisioning
```bash
# Time a single server creation
time curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test","memory":2,"diskSpace":20}' \
  -H "Content-Type: application/json"

# Expected: 25-35ms total time
```

### Step 2: Concurrent Load Test
```bash
# Use Apache Bench or similar
ab -n 100 -c 10 -p data.json http://localhost:5000/api/servers

# Expected:
# - Requests per second: 40-100
# - Failed requests: 0
# - No duplicate ports allocated
```

### Step 3: Database Performance
```bash
# Check slow queries
psql -d lighth -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 5;"
```

---

## Phase 9: Security Audit

### Step 1: Password Security
```bash
# Verify crypto is used (not Math.random)
grep -r "Math\.random" backend/lib/provisioning.js
# Should return: (nothing)

grep -r "crypto\.randomBytes" backend/lib/provisioning.js
# Should return: (multiple matches)
```

### Step 2: Port Verification
```bash
# Verify @unique constraint exists
psql -d lighth -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='servers' AND constraint_type='UNIQUE';"

# Should show: servers_port_key (or similar)
```

### Step 3: SQL Injection Testing
```bash
# Try malicious input
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"test; DROP TABLE servers;--","memory":2,"diskSpace":20}' \
  -H "Content-Type: application/json"

# Should safely escape and create server with literal name
```

### Step 4: JWT Verification
```bash
# Attempt request without token
curl http://localhost:5000/api/servers
# Should return 401 Unauthorized

# Attempt with invalid token
curl -H "Authorization: Bearer invalid" http://localhost:5000/api/servers
# Should return 401 Unauthorized
```

---

## Phase 10: Production Deployment

### Step 1: Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Database migration tested on staging
- [ ] Performance load tested
- [ ] Security audit completed
- [ ] Team trained on new system
- [ ] Runbooks created
- [ ] Monitoring configured
- [ ] Rollback plan documented

### Step 2: Deployment Steps
```bash
# 1. Stop backend
pm2 stop lighth-backend

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm install

# 4. Run migration
npx prisma migrate deploy

# 5. Start backend
pm2 start lighth-backend

# 6. Verify health
curl http://localhost:5000/health
```

### Step 3: Post-Deployment Verification
```bash
# 1. Test API
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Prod Test","memory":2,"diskSpace":20}' \
  -H "Content-Type: application/json"

# 2. Check logs
pm2 logs lighth-backend | grep "Provisioning"

# 3. Verify database
psql -d lighth -c "SELECT COUNT(*) FROM servers;"

# 4. Test port allocation
psql -d lighth -c "SELECT port FROM servers WHERE created > now() - interval '1 minute';"
```

### Step 4: Gradual Rollout (Optional)
- [ ] Deploy to staging first
- [ ] Run acceptance tests
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Keep rollback plan ready

---

## Common Issues & Fixes

### Issue: Port constraint violation
```sql
-- Fix: Existing servers need unique ports
ALTER TABLE servers ADD CONSTRAINT servers_port_unique UNIQUE(port);

-- If duplicates exist, fix them:
UPDATE servers SET port = port + 1000 WHERE port = (
  SELECT port FROM servers GROUP BY port HAVING count(*) > 1 LIMIT 1
);
```

### Issue: Migration fails with existing data
```bash
# Rollback migration
npx prisma migrate resolve --rolled-back add_port_tracking

# Clean up existing duplicates
psql -d lighth -c "DELETE FROM servers WHERE id NOT IN (SELECT MIN(id) FROM servers GROUP BY port);"

# Re-run migration
npx prisma migrate dev --name add_port_tracking
```

### Issue: RCON password not working
```bash
# Verify password was set correctly
docker inspect lighth_server_1 | grep -i rcon

# Check if process is listening on RCON port
netstat -tlnp | grep 25575

# Test with mcrcon
mcrcon -H 154.12.1.45 -P 25575 -p "7a2B9xPq1mZ9" "say Test"
```

---

## Success Criteria

You've successfully implemented production-grade provisioning when:

- ✅ Database migration applied without errors
- ✅ All unit tests passing (100% on provisioning)
- ✅ Multiple servers created with unique ports
- ✅ Passwords are 12-char alphanumeric
- ✅ RCON credentials work
- ✅ Frontend displays credentials
- ✅ Docker containers launch with credentials
- ✅ No port conflicts under load
- ✅ Monitoring shows provisioning metrics
- ✅ Team understands system architecture

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Database & Schema | 30 min | None |
| 2. Code Updates | 15 min | Phase 1 |
| 3. Testing | 1-2 hrs | Phase 2 |
| 4. Frontend | 1 hr | Phase 3 |
| 5. Docker (opt) | 2 hrs | Phase 4 |
| 6. Documentation | 30 min | Phases 1-5 |
| 7. Monitoring | 1 hr | Phase 2 |
| 8. Load Testing | 1 hr | Phases 3-4 |
| 9. Security Audit | 1 hr | Phases 2-8 |
| 10. Production Deploy | 1 hr | Phases 1-9 |

**Total: 8-10 hours for complete implementation**

---

## Rollback Procedure (If Needed)

```bash
# 1. Restore from backup
psql lighth < lighth_backup_20240120.sql

# 2. Revert code changes
git revert HEAD~1  # Revert the provisioning update commit

# 3. Restart backend
pm2 restart lighth-backend

# 4. Verify systems
curl http://localhost:5000/api/servers -H "Authorization: Bearer $TOKEN"
```

---

**Ready to begin? Start with Phase 1: Database & Schema Updates**

Good luck! 🚀
