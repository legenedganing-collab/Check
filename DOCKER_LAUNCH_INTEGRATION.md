# Docker Launch Integration Guide

## Overview

This guide explains how your LightNode provisioning system launches live Minecraft servers using Docker containers. When a user creates a server, the system:

1. **Generates credentials** (port, RCON password) via the provisioning system
2. **Creates a database record** with server metadata
3. **Launches a Docker container** using itzg/minecraft-server image with those credentials
4. **Manages the container lifecycle** (start, stop, restart, logs)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Creates Server                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ provisionServer()         │
        │ - Allocate port           │
        │ - Assign IP               │
        │ - Generate credentials    │
        └──────────────┬────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ launchMinecraftServer()   │
        │ - Create Docker container │
        │ - Set environment vars    │
        │ - Map ports               │
        │ - Mount volumes           │
        └──────────────┬────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ Docker Daemon             │
        │ - Pulls image             │
        │ - Creates container       │
        │ - Starts service          │
        └──────────────┬────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ Live Minecraft Server     │
        │ - Accepting players       │
        │ - Running Java process    │
        │ - Saving world to volume  │
        └──────────────────────────┘
```

---

## Code Files

### 1. Docker Provisioner (`backend/lib/dockerProvisioner.js`)

**Purpose**: Bridge between provisioning system and Docker daemon

**Key Functions**:

#### `checkDockerHealth()`
Verify Docker daemon is accessible before allowing server creation.

```javascript
const isHealthy = await checkDockerHealth();
if (!isHealthy) {
  // Warn user Docker is not available
}
```

**Status**: Returns Docker container and image counts

---

#### `launchMinecraftServer(serverConfig)`
The main server launcher. Called immediately after provisioning completes.

**Parameters**:
```javascript
{
  serverId: 1,                          // Database ID
  name: "My Server",                    // User-friendly name
  port: 25568,                          // Allocated by provisioning
  rconPassword: "XyZ123abc",            // Secure password
  memory: 4,                            // GB (1-16)
  version: "LATEST"                     // Minecraft version
}
```

**What It Does**:
1. Generates container name: `mc-1-my-server`
2. Creates container with:
   - Image: `itzg/minecraft-server:latest`
   - Environment variables (EULA, VERSION, MEMORY, RCON credentials)
   - Port bindings (host:container)
   - Volume mounts (persistent world data)
   - Health checks
   - Auto-restart policy
3. Starts the container
4. Returns container ID

**Example Response**:
```javascript
{
  containerId: "a1b2c3d4e5f6g7h8",
  containerName: "mc-1-my-server",
  status: "running",
  port: 25568,
  healthCheck: {
    status: "healthy",
    timestamp: "2026-01-12T10:30:00Z"
  }
}
```

---

#### `getServerStatus(containerId)`
Get live container health and metrics.

```javascript
const status = await getServerStatus("mc-1-my-server");

// Returns:
{
  id: "a1b2c3d4",
  name: "mc-1-my-server",
  status: "running",
  memory: 4,
  health: "healthy",
  uptime: "2026-01-12T10:30:00Z",
  restarts: 0,
  ports: {
    "25565/tcp": [{ HostIp: "0.0.0.0", HostPort: "25568" }]
  }
}
```

---

#### `stopServer(containerId, timeout = 10)`
Gracefully shut down a server.

```javascript
await stopServer("mc-1-my-server", 10); // 10 second grace period

// What happens:
// 1. Docker sends SIGTERM to Java process
// 2. Minecraft saves world
// 3. Process gracefully shuts down
// 4. Container stops
```

**Grace Period**: 10 seconds gives Minecraft time to save before force kill

---

#### `restartServer(containerId)`
Restart without losing world data.

```javascript
await restartServer("mc-1-my-server");
```

---

#### `deleteServer(containerId)`
Stop and remove container (world data persists in volumes).

```javascript
await deleteServer("mc-1-my-server");
// Container is removed but /var/lib/lighth/data/1/* remains
```

---

#### `getServerLogs(containerId, options)`
Retrieve container logs for live dashboard console.

```javascript
const logs = await getServerLogs("mc-1-my-server", { tail: 100 });

// Output: Last 100 lines of server output
// Useful for:
// - Player joining/leaving
// - Server errors
// - Performance metrics (TPS, memory)
```

---

### 2. Server Controller Updates (`backend/src/controllers/serverController.js`)

**Modified `createServer()` Function**:

**Before** (Old Way):
```javascript
// Just provisioned, server in DB
await prisma.server.update({
  data: { status: 'online' } // Not actually running!
});
```

**After** (New Way):
```javascript
// Step 1: Provision (port, IP, credentials)
const provisioningData = await provisionServer(server.id, userId);

// Step 2: Launch Docker container
const dockerResult = await launchMinecraftServer({
  serverId: server.id,
  name: server.name,
  port: provisioningData.port,
  rconPassword: provisioningData.rconPassword,
  memory: server.memory,
  version: 'LATEST'
});

// Step 3: Mark as online (now truly running)
await prisma.server.update({
  data: { status: 'online' }
});

// Return credentials so user can join
return res.json({
  credentials: {
    rconPassword: provisioningData.rconPassword,
    panelLoginUrl: provisioningData.panelLoginUrl,
    // ... etc
  }
});
```

**Error Handling**:
- If Docker launch fails, server marked as "waiting"
- User still gets credentials (can retry manually)
- Provisioning system data preserved

---

**New Endpoints**:

#### `GET /api/servers/:id/status`
Live container health

```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers/1/status

# Response:
{
  "status": {
    "name": "mc-1-my-server",
    "status": "running",
    "health": "healthy",
    "memory": 4,
    "uptime": "2h 30m"
  }
}
```

---

#### `POST /api/servers/:id/stop`
Stop server gracefully

```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers/1/stop

# Response:
{
  "message": "Server stopped successfully",
  "status": "offline"
}
```

---

#### `POST /api/servers/:id/restart`
Restart server

```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers/1/restart

# Response:
{
  "message": "Server restarted successfully",
  "status": "online"
}
```

---

#### `GET /api/servers/:id/logs`
Get console logs (for live console widget)

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/servers/1/logs?tail=50"

# Response:
{
  "logs": "[10:30:00] [Server thread/INFO]: Done (2.543s)!\n[10:30:00] [Server thread/INFO]: For help, type \"help\"\n..."
}
```

---

#### `GET /api/health/docker` (Public)
Check if Docker is available

```bash
curl http://localhost:3000/api/health/docker

# Response when Docker is up:
{
  "healthy": true,
  "message": "Docker daemon is healthy"
}

# Response when Docker is down:
{
  "healthy": false,
  "message": "Docker daemon is unavailable"
}
```

Use this in your frontend to:
- Show warning if Docker isn't running
- Disable "Create Server" button
- Suggest troubleshooting steps

---

## Prerequisites & Setup

### 1. Docker Daemon Access

**Verify Docker is installed**:
```bash
docker --version
# Docker version 25.0+
```

**Add your user to docker group** (so you don't need sudo):
```bash
sudo usermod -aG docker $USER
# Then logout/login or: newgrp docker
```

**Verify access**:
```bash
docker ps
# Should list containers (may be empty)
```

### 2. Data Directory

Create persistent storage directory:
```bash
sudo mkdir -p /var/lib/lighth/data
sudo chown $USER:$USER /var/lib/lighth/data
chmod 755 /var/lib/lighth/data
```

Each server gets: `/var/lib/lighth/data/{serverId}/`

### 3. npm Dependencies

Install dockerode (Docker API client):
```bash
cd backend
npm install dockerode
```

### 4. Environment Variables (Optional)

In `backend/.env`:
```bash
# Docker socket path (default: /var/run/docker.sock)
DOCKER_SOCKET=/var/run/docker.sock

# Data directory (default: /var/lib/lighth/data)
LIGHTH_DATA_PATH=/var/lib/lighth/data
```

---

## How It Works: Step-by-Step

### Scenario: User Creates "SkyBlock Server" with 4GB Memory

**Step 1: User submits form**
```json
{
  "name": "SkyBlock Server",
  "memory": 4,
  "diskSpace": 50
}
```

**Step 2: Database record created**
```javascript
// Server status: "provisioning"
{
  id: 1,
  name: "SkyBlock Server",
  memory: 4,
  ipAddress: "0.0.0.0", // Placeholder
  port: 0,              // Placeholder
  status: "provisioning"
}
```

**Step 3: Provisioning system allocates**
```javascript
const provisioningData = {
  port: 25568,                    // Found available port
  ipAddress: "10.20.30.50",       // Regional IP assigned
  rconPassword: "K8jXpQwR2mL9",  // Secure password generated
  tempUsername: "admin",          // Temporary panel user
  tempPassword: "TempPass123!"    // Temporary password
}
```

**Step 4: Docker launcher runs**
```javascript
const dockerResult = await launchMinecraftServer({
  serverId: 1,
  name: "SkyBlock Server",
  port: 25568,
  rconPassword: "K8jXpQwR2mL9",
  memory: 4,
  version: "LATEST"
});

// Dockerode creates:
// - Container name: mc-1-skyblock-server
// - Environment: EULA=TRUE, MEMORY=4G, RCON_PASSWORD=K8jXpQwR2mL9, etc.
// - Port mapping: host:25568 -> container:25565
// - Volume: /var/lib/lighth/data/1:/data (inside container)
// - Health check: curl http://localhost:25565/
// - Restart: unless-stopped
```

**Step 5: Docker daemon pulls image**
```bash
# First run only (cached after)
docker pull itzg/minecraft-server:latest
```

**Step 6: Container starts**
```bash
docker run \
  --name mc-1-skyblock-server \
  -e EULA=TRUE \
  -e MEMORY=4G \
  -e RCON_PASSWORD=K8jXpQwR2mL9 \
  -p 25568:25565 \
  -v /var/lib/lighth/data/1:/data \
  --restart unless-stopped \
  itzg/minecraft-server:latest
```

**Step 7: Minecraft server starts**
```
[10:30:00] [Server thread/INFO]: Starting minecraft server version 1.21
[10:30:02] [Server thread/INFO]: Loading properties file
[10:30:03] [Server thread/INFO]: Default game type: SURVIVAL
[10:30:10] [Server thread/INFO]: Done (5.234s)!
[10:30:10] [Server thread/INFO]: For help, type "help"
```

**Step 8: Response to user**
```json
{
  "message": "Server created, provisioned, and launched successfully",
  "server": {
    "id": 1,
    "name": "SkyBlock Server",
    "port": 25568,
    "status": "online",
    "ipAddress": "10.20.30.50"
  },
  "credentials": {
    "rconPassword": "K8jXpQwR2mL9",
    "panelLoginUrl": "http://localhost:3000/panel/servers/1"
  },
  "setupInstructions": [
    "1. Add server to Minecraft: your-ip:25568",
    "2. Join and set admin: /op username",
    "3. Access console: Click 'Console' tab"
  ]
}
```

**Step 9: User joins**
```
Player joins through Minecraft client
-> Connects to 10.20.30.50:25568
-> Docker maps to container:25565
-> Minecraft server receives join
-> Player spawns!
```

---

## Environment Variables in Container

The `launchMinecraftServer()` function sets these in the container:

```javascript
Env: [
  'EULA=TRUE',                          // Accept Minecraft EULA
  'VERSION=LATEST',                     // Server version
  'MEMORY=4G',                          // Java heap size
  'ENABLE_RCON=true',                   // Remote console enabled
  'RCON_PASSWORD=K8jXpQwR2mL9',        // RCON admin password
  'RCON_PORT=25575',                    // RCON internal port
  'DIFFICULTY=3',                       // Hard mode
  'GAMEMODE=survival',                  // Survival mode
  'ONLINE_MODE=true',                   // Verify player accounts
  'ENABLE_COMMAND_BLOCK=true',          // /execute support
  'SPAWN_PROTECTION=16',                // Protected spawn area
  'JVM_XX_OPTS=...',                    // Aikar's Flags (performance)
  'JVM_OPTS=-XX:+AlwaysPreTouch'       // JVM memory optimization
]
```

### Why Aikar's Flags?

```javascript
'-XX:+UseG1GC'                    // Better garbage collection
'-XX:+ParallelRefProcEnabled'     // Faster reference processing
'-XX:MaxGCPauseMillis=200'        // Limit GC pause to 200ms (less lag)
'-XX:+UnlockExperimentalVMOptions'// Enable experimental optimizations
'-XX:+DisableExplicitGC'          // Prevent memory thrashing
```

**Impact**: 
- Reduces lag spikes during garbage collection
- More consistent TPS (ticks per second)
- Lower memory usage
- Better player experience

**Reference**: [Aikar's Minecraft Server Tuning Guide](https://aikar.co/2018/07/02/tuning-the-jvm-g1gc-garbage-collector-for-minecraft-servers-guide/)

---

## Volume Management

### What Gets Persisted?

```
/var/lib/lighth/data/1/
├── world/                  # Main world data
├── world_nether/           # Nether dimension
├── world_the_end/          # End dimension
├── ops.json                # Operator list
├── server.properties       # Server config
├── logs/
│   └── latest.log          # Server output
└── plugins/                # Installed plugins
```

### Backup Strategy

Volumes persist on the host, so backups are simple:

```bash
# Backup a server
tar -czf skyblock-backup.tar.gz /var/lib/lighth/data/1/

# Restore a server (after deleting old container)
tar -xzf skyblock-backup.tar.gz -C /var/lib/lighth/data/
```

### Clean Up After Deletion

When you delete a server (container), the volume remains:

```bash
# Delete server (removes container only)
DELETE /api/servers/1

# Volume still exists
ls -la /var/lib/lighth/data/1/

# To free space, manually delete:
sudo rm -rf /var/lib/lighth/data/1/
```

---

## Health Checks

Docker health check runs every 30 seconds:

```javascript
HealthCheck: {
  Test: ['CMD', 'curl', '-f', 'http://localhost:25565/'],
  Interval: 30 * 1000000000,      // 30 seconds
  Timeout: 10 * 1000000000,        // Fail if takes >10s
  Retries: 3,                      // Retry 3 times before marking unhealthy
  StartPeriod: 60 * 1000000000     // Allow 60s startup grace period
}
```

**What This Does**:
- Waits 60s for server to fully start
- Every 30s, tries to curl Minecraft server status
- If 3 consecutive failures, marks container as "unhealthy"
- Docker auto-restart still works (separate from health)

**Check health status**:
```javascript
const status = await getServerStatus("mc-1-my-server");
console.log(status.health); // "healthy" | "unhealthy" | "none"
```

---

## Auto-Restart Policy

```javascript
RestartPolicy: {
  Name: 'unless-stopped',
  MaximumRetryCount: 0
}
```

**What This Means**:
- If server crashes: Docker automatically restarts it
- If server is stopped by user: Docker won't restart
- No limit on restart attempts

**Scenarios**:
1. Java OutOfMemory → Container exits → Docker restarts automatically
2. User runs `/stop` command → Server stops gracefully → Docker respects stop
3. User clicks "Stop" button → We call `stopServer()` → Docker respects stop

---

## Troubleshooting

### Docker daemon not accessible

**Error**:
```
Docker Health ❌ Failed to connect to Docker daemon
Error: connect ENOENT /var/run/docker.sock
```

**Fix**:
```bash
# Check Docker is running
docker ps

# If not, start Docker
sudo systemctl start docker

# Check user permissions
sudo usermod -aG docker $USER
newgrp docker  # Apply group changes
```

### Port already in use

**Error**:
```
Port 25568 is already bound - cannot allocate
```

**Fix**:
```bash
# Find what's using the port
lsof -i :25568
# Kill the process or choose different port

# Or let provisioning system choose
# It checks ports 25565-26000 automatically
```

### Container won't start

**Error**:
```
Container created but not running
```

**Debug**:
```bash
# Check container logs
docker logs mc-1-my-server

# Common issues:
# - EULA=TRUE missing (fix in dockerProvisioner.js)
# - Insufficient memory (memory * 1024MB > available RAM)
# - Java version incompatible (rare with itzg image)
```

### Out of disk space

**Error**:
```
Error creating layer: no space left on device
```

**Fix**:
```bash
# Check disk usage
df -h /var/lib/lighth/data

# Remove old server data
rm -rf /var/lib/lighth/data/{old-server-id}/

# Clean Docker unused images/volumes
docker system prune
```

---

## Integration with Your Frontend

### Check Docker Status on App Load

```javascript
// Dashboard.jsx
useEffect(() => {
  fetch('http://localhost:3000/api/health/docker')
    .then(r => r.json())
    .then(data => {
      if (!data.healthy) {
        setAlert({
          type: 'error',
          message: 'Docker is not available. Servers will not launch.'
        });
      }
    });
}, []);
```

### Show Server Status

```javascript
// Real-time status polling
useEffect(() => {
  const interval = setInterval(async () => {
    const status = await fetch(`/api/servers/${serverId}/status`).then(r => r.json());
    setStatus(status); // Running, offline, unhealthy
  }, 5000); // Every 5 seconds
  
  return () => clearInterval(interval);
}, [serverId]);
```

### Live Console Widget

```javascript
// Console.jsx
useEffect(() => {
  const fetchLogs = async () => {
    const response = await fetch(`/api/servers/${serverId}/logs?tail=50`);
    const data = await response.json();
    setLogs(data.logs);
    scrollToBottom(); // Auto-scroll
  };
  
  const interval = setInterval(fetchLogs, 2000); // Every 2s
  return () => clearInterval(interval);
}, [serverId]);
```

### Server Control Buttons

```javascript
// ServerControls.jsx
const handleStop = async () => {
  await fetch(`/api/servers/${serverId}/stop`, { method: 'POST' });
  // Refetch status
};

const handleRestart = async () => {
  await fetch(`/api/servers/${serverId}/restart`, { method: 'POST' });
  // Refetch status
};

const handleDelete = async () => {
  if (confirm('This will stop and delete the container')) {
    await fetch(`/api/servers/${serverId}`, { method: 'DELETE' });
    // Redirect to servers list
  }
};
```

---

## Performance Metrics

### System Requirements

| Metric | Requirement |
|--------|-------------|
| RAM per 1GB server | ~1.5GB physical |
| CPU per server | 2-4 vCPU cores |
| Disk per server | 5-10GB initial + growth |
| Network | 1 Mbps per active player |

### Expected Performance

With Aikar's Flags:

| Players | TPS | Lag | Memory |
|---------|-----|-----|--------|
| 1-10 | 19-20 | None | ~2GB |
| 10-20 | 19-20 | Minimal | ~3GB |
| 20-50 | 18-20 | Occasional | ~4GB |
| 50+ | 15-18 | Moderate | 6-8GB |

---

## Next Steps

1. **Install Dependencies**:
   ```bash
   npm install dockerode
   ```

2. **Set Up Directories**:
   ```bash
   mkdir -p /var/lib/lighth/data
   ```

3. **Test Docker Connection**:
   ```bash
   curl http://localhost:3000/api/health/docker
   # Should return healthy: true
   ```

4. **Create First Server**:
   ```bash
   POST /api/servers
   {
     "name": "Test Server",
     "memory": 2,
     "diskSpace": 10
   }
   ```

5. **Monitor Container**:
   ```bash
   docker ps -a
   docker logs mc-1-test-server
   ```

6. **Join Minecraft**:
   - Add server: `localhost:25568` (or your IP)
   - Select and join
   - See live console in dashboard

---

## Live Console Feature (Next Phase)

The `/api/servers/:id/logs` endpoint is ready for a real-time console widget.

**What you'll build**:
```javascript
<LiveConsole serverId={1} />
```

**Features**:
- Shows last 100 lines of server output
- Updates every 2 seconds
- Auto-scrolls to bottom
- Filters by log level (INFO, ERROR, WARN)
- Timestamps for each message

**Commands to dashboard** (future):
- Use RCON client to send `/op username` directly
- Dashboard sends to container port 25575
- Requires: rcon-js library

---

## Summary

You now have a **production-grade Docker integration** that:

✅ Generates secure credentials  
✅ Launches containers with optimized Java settings  
✅ Manages server lifecycle (start, stop, restart)  
✅ Persists world data in volumes  
✅ Provides live health and logs  
✅ Auto-restarts on failures  
✅ Scales to multiple servers  

Your LightNode platform is now a real hosting service! 🎉
