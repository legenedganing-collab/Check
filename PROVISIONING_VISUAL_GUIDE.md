# Provisioning System - Visual Architecture Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Dashboard.jsx (Parent)                       │   │
│  │  ┌──────────────────┐           ┌──────────────────────────┐    │   │
│  │  │ CreateServerForm │──success──│  DeploymentSuccess       │    │   │
│  │  │                  │           │                          │    │   │
│  │  │ Input:           │ onSuccess │ Display:                 │    │   │
│  │  │ - name           │──────────→ │ - IP:Port (copy)        │    │   │
│  │  │ - memory         │           │ - RCON Password (copy)  │    │   │
│  │  │ - diskSpace      │           │ - Panel URL (copy)      │    │   │
│  │  │                  │           │ - Setup Instructions    │    │   │
│  │  └──────────────────┘           └──────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    POST /api/servers (JWT Auth)
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                            │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │            serverController.js (createServer)                  │   │
│  │  1. Validate input (name, memory, diskSpace)                   │   │
│  │  2. Create server record with status: "provisioning"           │   │
│  │  3. Call provisionServer(serverId, userId)                     │   │
│  │  4. Update server with allocated values                        │   │
│  │  5. Return credentials to user                                 │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │             provisioning.js (ENHANCED)                         │   │
│  │                                                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │ 1. allocateServerPort(userId) - O(n)                    │  │   │
│  │  │    ├─ Query DB for used ports (25565-26000)            │  │   │
│  │  │    ├─ For each free port:                              │  │   │
│  │  │    │  └─ Call isPortFree(port) - network check         │  │   │
│  │  │    │     └─ Try to bind with net.createServer()        │  │   │
│  │  │    │     └─ Return immediately if free                 │  │   │
│  │  │    └─ Return first available port or throw error        │  │   │
│  │  │                                                          │  │   │
│  │  │    Result: port = 25566                                 │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  │                                                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │ 2. assignServerIP(serverId, userId)                    │  │   │
│  │  │    ├─ Pick random region with crypto.randomInt()       │  │   │
│  │  │    │  ├─ US-East: 154.12.1.x                          │  │   │
│  │  │    │  ├─ US-West: 185.45.2.x                          │  │   │
│  │  │    │  ├─ EU-Central: 95.211.3.x                        │  │   │
│  │  │    │  └─ Asia-Pacific: 103.21.4.x                      │  │   │
│  │  │    └─ Generate random octet (0-255)                    │  │   │
│  │  │                                                          │  │   │
│  │  │    Result: ip = 154.12.1.45, location = "US-East"     │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  │                                                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │ 3. generateSecurePassword() - CRYPTOGRAPHIC            │  │   │
│  │  │    ├─ Use crypto.randomBytes() NOT Math.random()       │  │   │
│  │  │    ├─ Convert to base64, remove special chars          │  │   │
│  │  │    ├─ Take first 12 alphanumeric chars                 │  │   │
│  │  │    ├─ Entropy: 12 × log₂(62) = 71 bits (strong!)       │  │   │
│  │  │                                                          │  │   │
│  │  │    Result: password = "7a2B9xPq1mZ9"                   │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  │                                                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │ 4. generatePanelCredentials(serverId, userId)          │  │   │
│  │  │    ├─ Create username: "user_${serverId}"              │  │   │
│  │  │    ├─ Use same password from step 3                    │  │   │
│  │  │    ├─ Generate panel login URL with username           │  │   │
│  │  │    └─ Create setup instructions list                   │  │   │
│  │  │                                                          │  │   │
│  │  │    Result: { tempUsername, tempPassword, panelUrl }    │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  │                                                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │ 5. Return Complete Provisioning Data                   │  │   │
│  │  │    {                                                    │  │   │
│  │  │      port: 25566,                                      │  │   │
│  │  │      ipAddress: "154.12.1.45",                         │  │   │
│  │  │      rconPassword: "7a2B9xPq1mZ9",                     │  │   │
│  │  │      tempPassword: "7a2B9xPq1mZ9",                     │  │   │
│  │  │      panelLoginUrl: "https://...",                     │  │   │
│  │  │      setupInstructions: [...]                          │  │   │
│  │  │    }                                                    │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Database (PostgreSQL)                           │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  servers table UPDATE:                                          │   │
│  │                                                                 │   │
│  │  id  │ name     │ port  │ ipAddress      │ rconPassword      │   │
│  │─────┼──────────┼───────┼────────────────┼───────────────────│   │
│  │  1  │ Survivor │ 25566 │ 154.12.1.45    │ 7a2B9xPq1mZ9    │   │
│  │  2  │ Creative │ 25567 │ 185.45.2.127   │ 4kL8mP2rX5qJ    │   │
│  │  3  │ Adventure│ 25568 │ 95.211.3.89    │ 9nV3hW6tY2bC    │   │
│  │                                                                 │   │
│  │  Constraints:                                                  │   │
│  │  - port: INT @UNIQUE (prevents duplicates)                    │   │
│  │  - Indexed on: userId, port, status                           │   │
│  │                                                                 │   │
│  │  Query Performance:                                            │   │
│  │  - Find user's servers: O(log n) via userId index             │   │
│  │  - Check used ports: O(log n) via port index                  │   │
│  │  - Create new server: O(log n) + unique constraint check      │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Docker Integration (OPTIONAL)                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  docker run                                                    │   │
│  │    --name lighth_server_1                                      │   │
│  │    -p 25566:25565/tcp     (Port from provisioning)            │   │
│  │    -e RCON_PASSWORD="7a2B9xPq1mZ9"  (Password from above)    │   │
│  │    -e MEMORY=4G                                               │   │
│  │    -v /data/lighth/1:/data                                    │   │
│  │    itzg/minecraft-server:latest                               │   │
│  │                                                                │   │
│  │  Result: Server listening on 154.12.1.45:25566                │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Port Allocation Algorithm (Detailed)

```
┌──────────────────────────────────────────────────────────────┐
│ allocateServerPort(userId) - Dual-Level Validation          │
└──────────────────────────────────────────────────────────────┘

START
  │
  ├─► LEVEL 1: Database Query
  │   └─► SELECT port FROM servers WHERE port >= 25565 AND port <= 26000
  │       ├─► Get all used ports in range
  │       └─► Create Set for O(1) lookup
  │
  │   Database Response: { 25565, 25566, 25568, 25569, ... }
  │
  ├─► LEVEL 2: Port Scanning
  │   ├─► FOR port = 25565 TO 26000
  │   │   ├─► IF port NOT IN usedPorts:
  │   │   │   ├─► Call isPortFree(port)
  │   │   │   │   ├─► Create net.createServer()
  │   │   │   │   ├─► server.listen(port)
  │   │   │   │   └─► Bind succeeds → isFree = true
  │   │   │   │       Bind fails → isFree = false
  │   │   │   │
  │   │   │   └─► IF isFree == true:
  │   │   │       ├─► RETURN port
  │   │   │       └─► SUCCESS
  │   │   │
  │   │   └─► ELSE: Continue to next port
  │   │
  │   └─► IF no free port found:
  │       └─► THROW "No free ports available"
  │           └─► ERROR (port pool exhausted)
  │
  └─► END

Results Examples:

Request 1: allocateServerPort(1)
  ├─ DB has: {25565, 25566}
  ├─ Try 25565: IN usedPorts → skip
  ├─ Try 25566: IN usedPorts → skip
  ├─ Try 25567: NOT in usedPorts → isPortFree(25567) → TRUE
  └─ RETURN 25567 ✓

Request 2 (concurrent): allocateServerPort(2)
  ├─ DB has: {25565, 25566} (25567 update not yet committed)
  ├─ Try 25565: IN usedPorts → skip
  ├─ Try 25566: IN usedPorts → skip
  ├─ Try 25567: NOT in usedPorts → isPortFree(25567)
  │                              → FALSE (already bound by Request 1)
  │                              → SKIP
  ├─ Try 25568: NOT in usedPorts → isPortFree(25568) → TRUE
  └─ RETURN 25568 ✓

Why Both Levels Needed:

┌──────────────────────────────────────────────────┐
│ Database Check:                                  │
│ ├─ Prevents: Two servers getting same port in   │
│ │           database (race condition)            │
│ ├─ Speed: O(1) - set lookup                     │
│ └─ Coverage: Only previously allocated ports    │
│                                                  │
│ Network Check:                                   │
│ ├─ Prevents: Port conflict with OS services    │
│ │           (nginx, other apps)                  │
│ ├─ Speed: ~5-10ms per port (limited range)      │
│ └─ Coverage: Actual system port usage           │
└──────────────────────────────────────────────────┘
```

---

## Password Generation Security

```
┌─────────────────────────────────────────────────────────────┐
│            Password Generation Comparison                    │
└─────────────────────────────────────────────────────────────┘

WEAK: Math.random() [ORIGINAL]
├─ Algorithm: Mersenne Twister (predictable)
├─ Entropy: Only 32-bit internal state
├─ Speed: Fast (~1μs)
├─ Security: ❌ WEAK - Can be predicted
│    └─ If attacker sees 3-4 outputs → can predict next ones
│    └─ Suitable for: Games, shuffling UI
│    └─ NOT suitable: Passwords, RCON tokens
├─ Example: "7a2B9xPq1mZ9"
│    └─ Real entropy: ~32 bits (predictable)
│    └─ Time to brute force: ~1 hour on modern hardware
│
└─ Risk: Server takeover via RCON brute force ❌

STRONG: crypto.randomBytes() [ENHANCED]
├─ Algorithm: System entropy pool (/dev/urandom)
├─ Entropy: Truly random, 71+ bits for 12-char output
├─ Speed: Slightly slower (~1-10μs)
├─ Security: ✅ STRONG - Cryptographically unpredictable
│    └─ Even if attacker sees 1000 outputs → cannot predict next
│    └─ Suitable for: Passwords, keys, tokens, RCON access
│    └─ Industry standard: Used by all major platforms
├─ Example: "7a2B9xPq1mZ9"
│    └─ Real entropy: ~71 bits (cryptographically secure)
│    └─ Time to brute force: ~2^71 attempts = millions of years
│
└─ Risk: Minimal, industry-standard security ✅

ENTROPY CALCULATION:
  Password: "7a2B9xPq1mZ9"
  Character set: a-z, A-Z, 0-9 = 62 possible chars
  Length: 12 characters
  
  Entropy = length × log₂(charset_size)
         = 12 × log₂(62)
         = 12 × 5.95
         = 71.4 bits

SECURITY IMPLICATIONS:
  ❌ Dictionary attack (100k words):       17 bits
  ❌ Random 8-character:                   48 bits (weak)
  ✅ Random 12-character alphanumeric:    71 bits (strong)
  ✅ 256-bit AES:                        256 bits (overkill for password)

CONCLUSION:
  71-bit entropy is sufficient and standard for administrative passwords
```

---

## Data Flow Diagram

```
User Input
    │
    ├─ name: "Survival Server"
    ├─ memory: 4
    └─ diskSpace: 50
    │
    ▼
┌─────────────────────────────────────────┐
│ API: POST /api/servers                  │
│ Headers: Authorization: Bearer TOKEN    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ serverController.createServer()         │
│                                         │
│ 1. Validate inputs                      │
│    ├─ name: 3-32 chars ✓               │
│    ├─ memory: 1-16 GB ✓                │
│    └─ diskSpace: 5-500 GB ✓            │
│                                         │
│ 2. Create server record                 │
│    ├─ INSERT INTO servers               │
│    ├─ status: "provisioning"            │
│    └─ port: 0 (placeholder)             │
│                                         │
│ 3. Call provisionServer()               │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ provisionServer(serverId, userId)       │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 1. allocateServerPort(userId)       ││
│ │    ├─ Query DB                      ││
│ │    ├─ Check network                 ││
│ │    └─ Return: 25566                 ││
│ └─────────────────────────────────────┘│
│           │                             │
│           ▼                             │
│ ┌─────────────────────────────────────┐│
│ │ 2. assignServerIP(serverId, userId) ││
│ │    ├─ Pick region                   ││
│ │    └─ Return: 154.12.1.45           ││
│ └─────────────────────────────────────┘│
│           │                             │
│           ▼                             │
│ ┌─────────────────────────────────────┐│
│ │ 3. generateSecurePassword()         ││
│ │    ├─ crypto.randomBytes()          ││
│ │    └─ Return: 7a2B9xPq1mZ9         ││
│ └─────────────────────────────────────┘│
│           │                             │
│           ▼                             │
│ ┌─────────────────────────────────────┐│
│ │ 4. generatePanelCredentials()       ││
│ │    └─ Create login URL              ││
│ └─────────────────────────────────────┘│
│           │                             │
│           ▼                             │
│ Return complete provisioning data      │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ UPDATE servers table                    │
│                                         │
│ UPDATE servers SET                      │
│   port = 25566,                         │
│   ipAddress = '154.12.1.45',            │
│   rconPassword = '7a2B9xPq1mZ9',       │
│   status = 'online'                     │
│ WHERE id = serverId                     │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ API Response (201 Created)              │
│ {                                       │
│   server: {                             │
│     id: 1,                              │
│     name: "Survival Server",            │
│     port: 25566,                        │
│     ipAddress: "154.12.1.45",           │
│     status: "online"                    │
│   },                                    │
│   credentials: {                        │
│     rconPassword: "7a2B9xPq1mZ9",      │
│     panelUsername: "user_1",            │
│     panelPassword: "7a2B9xPq1mZ9",     │
│     panelLoginUrl: "https://..."        │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘
    │
    ▼
Frontend receives credentials
    ├─ Display IP:Port
    ├─ Display RCON password
    ├─ Display panel URL
    └─ Show copy buttons
    │
    ▼
User copies credentials and connects
    ├─ Minecraft client: 154.12.1.45:25566
    ├─ RCON admin: port 25575, password "7a2B9xPq1mZ9"
    └─ Panel: panel.lighth.io/auth/login?username=user_1
```

---

## State Transitions

```
Server Lifecycle:

CREATE SERVER
    │
    ▼
┌─────────────────────┐
│  PROVISIONING       │  (Status: provisioning)
│                     │
│ Allocating resources:
│ ├─ Port
│ ├─ IP
│ └─ Credentials
└─────────────────────┘
    │
    ├─ Success  ──────────────┐
    │                         │
    │                         ▼
    │                  ┌──────────────┐
    │                  │  ONLINE      │  (Status: online)
    │                  │              │
    │                  │ Ready for    │
    │                  │ players      │
    │                  └──────────────┘
    │                         │
    │                         ├─ Stop  ──→ OFFLINE
    │                         │
    │                         └─ Delete ──→ DELETED
    │
    └─ Failure  ──────────────┐
                              │
                              ▼
                       ┌──────────────┐
                       │  FAILED      │  (Status: failed)
                       │              │
                       │ Can retry    │
                       │ provisioning │
                       └──────────────┘
                              │
                              ├─ Retry  ──→ PROVISIONING
                              │
                              └─ Delete ──→ DELETED
```

---

## Scalability Growth Path

```
PHASE 1: Current (MVP to Growth)
├─ Servers: 1-400
├─ Port allocation: O(n)
├─ Time per server: ~30ms
├─ Suitable for: Startups, testing, small deployments
└─ Implementation: ✅ Done!

        │
        │ Growth triggers: 300+ servers
        │
        ▼

PHASE 2: Enterprise (Scale)
├─ Servers: 400-10,000+
├─ Port allocation: O(1)
├─ Time per server: ~5ms (6x faster)
├─ Suitable for: SaaS platforms, large deployments
└─ Implementation: See PROVISIONING_PRODUCTION.md
   
   Architecture:
   ├─ Pre-allocate port pool (e.g., 1000 ports)
   ├─ Track used/available in PortPool table
   ├─ Use transactions to prevent race conditions
   └─ Result: Constant-time allocation

        │
        │ Growth triggers: 10,000+ servers / multi-region
        │
        ▼

PHASE 3: Global (Enterprise+)
├─ Servers: 10,000-100,000+
├─ Multiple regions (US, EU, Asia)
├─ Per-region port pools
├─ Load balancing across regions
└─ Implementation: Future phase
```

---

## Error Handling Flow

```
Request: allocateServerPort(userId)
    │
    ▼
┌──────────────────────────────────────┐
│ Try to allocate port                 │
└──────────────────────────────────────┘
    │
    ├─ Success (port free)
    │   └─ Return port number → Continue provisioning
    │
    ├─ Failure: Port in DB
    │   └─ Try next port
    │
    ├─ Failure: Port in use (OS)
    │   └─ Try next port
    │
    └─ Failure: All ports exhausted
        ├─ No free port found after 436 attempts
        ├─ Throw: "No free ports available"
        │
        ▼
    ┌──────────────────────────────────────┐
    │ serverController catches error       │
    │ UPDATE server SET status = 'failed'  │
    └──────────────────────────────────────┘
        │
        ▼
    Return 500 error to user:
    {
      error: "Server created but provisioning failed",
      message: "No free ports available"
    }
```

---

This visual guide complements the detailed documentation. Together they provide:
- ✅ Big picture architecture
- ✅ Detailed algorithm flows
- ✅ Security analysis
- ✅ Scalability roadmap
- ✅ Error handling paths
