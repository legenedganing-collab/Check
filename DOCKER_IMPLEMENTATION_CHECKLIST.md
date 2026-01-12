# Docker Implementation Checklist

## Overview

This guide walks you through implementing Docker-based Minecraft server provisioning in LightNode. Follow each step to go from development to production.

**Total Time**: 2-4 hours  
**Difficulty**: Intermediate  
**Prerequisites**: Docker installed, Node.js backend running, Minecraft launcher

---

## Phase 1: Environment Setup (15 minutes)

### ✅ Step 1.1: Install dockerode

```bash
cd backend
npm install dockerode
```

**Verify**:
```bash
npm list dockerode
# Should show: dockerode@2.x.x
```

### ✅ Step 1.2: Create Data Directory

```bash
# Create persistent storage
mkdir -p /var/lib/lighth/data
chmod 755 /var/lib/lighth/data

# Verify
ls -la /var/lib/lighth/data
```

### ✅ Step 1.3: Configure Docker Socket Access

```bash
# Check Docker socket
ls -la /var/run/docker.sock

# Test connection
docker ps
# Should list containers (may be empty)
```

### ✅ Step 1.4: Configure Environment Variables (Optional)

Create or update `backend/.env`:
```bash
# Docker configuration
DOCKER_SOCKET=/var/run/docker.sock
LIGHTH_DATA_PATH=/var/lib/lighth/data

# Server provisioning
MIN_PORT=25565
MAX_PORT=26000
```

**Status**: ✅ Environment ready

---

## Phase 2: Code Verification (10 minutes)

### ✅ Step 2.1: Verify dockerProvisioner.js

```bash
# Check file exists and has functions
grep -E "launchMinecraftServer|getServerStatus|stopServer" \
  backend/lib/dockerProvisioner.js
```

**Expected output**: Three function definitions

### ✅ Step 2.2: Verify serverController Integration

```bash
# Check Docker imports
grep "dockerProvisioner" backend/src/controllers/serverController.js
```

**Expected output**: Import statement for dockerProvisioner

### ✅ Step 2.3: Verify Routes

```bash
# Check Docker endpoints
grep -E "status|stop|restart|logs" backend/src/routes/serverRoutes.js
```

**Expected output**: New route definitions for Docker operations

### ✅ Step 2.4: Verify Test Files

```bash
# Check test file exists
test -f backend/src/__tests__/docker-provisioner.test.js && echo "✅ Tests exist"
```

**Status**: ✅ Code is integrated

---

## Phase 3: Database Migration (5 minutes)

### ✅ Step 3.1: Apply Prisma Migration

```bash
cd backend
npx prisma migrate dev --name docker_integration
```

**What this does**:
- Adds `containerId` field to Server model (optional, for tracking)
- Updates schema version
- Generates migration file

### ✅ Step 3.2: Verify Schema

```bash
# Check schema updates
grep -A 5 "model Server" prisma/schema.prisma
```

**Expected output**: Server model with docker-related fields

### ✅ Step 3.3: Check Database

```bash
# Test database connection
npx prisma db push
```

**Status**: ✅ Database ready

---

## Phase 4: Docker Image Preparation (10 minutes)

### ✅ Step 4.1: Test Docker Daemon

```bash
# Should list containers (may be empty)
docker ps

# Should show Docker version
docker --version
```

### ✅ Step 4.2: Pre-Pull Minecraft Image

```bash
# This is optional but recommended
# Pulls image in advance so first server creation is faster
docker pull itzg/minecraft-server:latest

# Verify
docker images | grep minecraft-server
```

**Expected output**: itzg/minecraft-server with LATEST tag

### ✅ Step 4.3: Verify Docker System Health

```bash
# Complete system check
docker system info | head -20
```

**Check these values**:
- Running: Should be 0-X containers
- Paused: Should be 0
- Stopped: Check for old containers
- Images: Should have minecraft-server

**Status**: ✅ Docker ready

---

## Phase 5: Backend Server Testing (15 minutes)

### ✅ Step 5.1: Start Backend Server

```bash
cd backend
npm start
```

**Expected output**:
```
Server running on port 3000
Connected to database
[Docker Health] ✅ Connected to Docker daemon
```

### ✅ Step 5.2: Test Docker Health Endpoint

```bash
# In another terminal
curl http://localhost:3000/api/health/docker
```

**Expected response**:
```json
{
  "healthy": true,
  "message": "Docker daemon is healthy"
}
```

**If healthy=false**:
- Check Docker daemon is running: `docker ps`
- Check socket permissions: `ls -la /var/run/docker.sock`
- Check user is in docker group: `groups $USER`

### ✅ Step 5.3: Test Authentication

```bash
# Register a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123!"
  }'

# Expected response: { message: "User registered...", token: "..." }
# Copy the token for next steps
```

### ✅ Step 5.4: Test Server Creation API

```bash
# Create a test server
# Replace TOKEN with the token from step 5.3

curl -X POST http://localhost:3000/api/servers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Server",
    "memory": 2,
    "diskSpace": 10
  }'
```

**Expected response**:
```json
{
  "message": "Server created, provisioned, and launched successfully",
  "server": {
    "id": 1,
    "name": "Test Server",
    "port": 25565,
    "status": "online"
  },
  "credentials": {
    "rconPassword": "K8jXpQwR2mL9"
  }
}
```

**If you get an error**:
- Check Docker is running: `docker ps`
- Check logs: `docker logs mc-1-test-server`
- Check port isn't in use: `lsof -i :25565`

### ✅ Step 5.5: Verify Container is Running

```bash
# List Docker containers
docker ps

# Should show: mc-1-test-server (or similar name)

# Check container logs
docker logs mc-1-test-server

# Should contain:
# [10:30:00] [Server thread/INFO]: Done (2.543s)!
# [10:30:00] [Server thread/INFO]: For help, type "help"
```

### ✅ Step 5.6: Test Server Status Endpoint

```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers/1/status
```

**Expected response**:
```json
{
  "status": {
    "name": "mc-1-test-server",
    "status": "running",
    "health": "healthy",
    "memory": 2
  }
}
```

### ✅ Step 5.7: Test Console Logs Endpoint

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/servers/1/logs?tail=20"
```

**Expected response**: Last 20 lines of server output

**Status**: ✅ Backend fully functional

---

## Phase 6: Frontend Integration (30 minutes)

### ✅ Step 6.1: Check Docker Status on Load

Update `src/components/Dashboard.jsx`:

```javascript
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [dockerHealthy, setDockerHealthy] = useState(null);

  useEffect(() => {
    // Check Docker status
    fetch('/api/health/docker')
      .then(r => r.json())
      .then(data => {
        setDockerHealthy(data.healthy);
        if (!data.healthy) {
          alert('⚠️ Docker is not available - servers may not launch');
        }
      })
      .catch(err => {
        console.error('Could not check Docker:', err);
        setDockerHealthy(false);
      });
  }, []);

  if (dockerHealthy === false) {
    return (
      <div className="alert alert-error">
        <p>⚠️ Docker daemon is unavailable</p>
        <p>Ensure Docker is running before creating servers</p>
      </div>
    );
  }

  return (
    <div>
      {/* Rest of dashboard */}
    </div>
  );
}
```

### ✅ Step 6.2: Show Creation Status

Update server creation form to disable submit while Docker is unhealthy:

```javascript
<button 
  type="submit"
  disabled={!dockerHealthy}
>
  Create Server
</button>
```

### ✅ Step 6.3: Display Credentials After Creation

Update `DeploymentSuccess.jsx`:

```javascript
export default function DeploymentSuccess({ server, credentials }) {
  return (
    <div>
      <h2>🎉 Server Created!</h2>
      
      <div className="credentials">
        <h3>Server Details</h3>
        <p>Address: {server.ipAddress}:{server.port}</p>
        <p>Status: {server.status}</p>
        
        <h3>RCON Credentials</h3>
        <p>Password: {credentials.rconPassword}</p>
        <button onClick={() => copyToClipboard(credentials.rconPassword)}>
          Copy
        </button>
        
        <h3>Setup Instructions</h3>
        <ol>
          {credentials.setupInstructions.map((inst, i) => (
            <li key={i}>{inst}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

### ✅ Step 6.4: Add Server Control Buttons

Create `src/components/ServerControls.jsx`:

```javascript
import { useState } from 'react';

export default function ServerControls({ serverId, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  const handleStop = async () => {
    if (!confirm('Stop server?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      onStatusChange(data.status);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/restart`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      onStatusChange(data.status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="controls">
      <button onClick={handleStop} disabled={loading}>
        ⏹️ Stop
      </button>
      <button onClick={handleRestart} disabled={loading}>
        🔄 Restart
      </button>
    </div>
  );
}
```

### ✅ Step 6.5: Add Live Console Widget

Create `src/components/ServerConsole.jsx`:

```javascript
import { useEffect, useState, useRef } from 'react';

export default function ServerConsole({ serverId }) {
  const [logs, setLogs] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    // Fetch logs every 2 seconds
    const interval = setInterval(async () => {
      const res = await fetch(`/api/servers/${serverId}/logs?tail=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs);
    }, 2000);

    return () => clearInterval(interval);
  }, [serverId]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="console">
      <h3>📋 Server Console</h3>
      <div className="logs">
        <pre>{logs}</pre>
        <div ref={endRef} />
      </div>
    </div>
  );
}
```

### ✅ Step 6.6: Update Server List to Show Status

Modify server listing to show live status:

```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    // Refresh server statuses every 10 seconds
    servers.forEach(async (server) => {
      const res = await fetch(`/api/servers/${server.id}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      // Update UI with new status
      updateServerStatus(server.id, data.status.status);
    });
  }, 10000);

  return () => clearInterval(interval);
}, [servers]);
```

**Status**: ✅ Frontend integrated

---

## Phase 7: Manual Testing (20 minutes)

### ✅ Step 7.1: Create a Test Server

1. Open frontend application
2. Go to "Create Server"
3. Fill in:
   - Name: "SkyBlock"
   - Memory: 2 GB
   - Disk: 10 GB
4. Click "Create"
5. **Verify**:
   - ✅ Server appears in list
   - ✅ Status shows "online"
   - ✅ Port is assigned (25565, 25566, etc.)
   - ✅ Credentials are displayed

### ✅ Step 7.2: Join the Server

1. Open Minecraft launcher
2. Click "Multiplayer"
3. Click "Add Server"
4. Fill in:
   - Name: "LightNode Test"
   - Server Address: `localhost:25565` (or your IP:port)
5. Click "Done"
6. Select server and click "Join Server"
7. **Verify**:
   - ✅ Server appears in multiplayer list
   - ✅ Server responds to ping
   - ✅ Can join and see "Done loading" message
   - ✅ Can walk around and place blocks

### ✅ Step 7.3: Test Server Controls

1. From dashboard, click your server
2. Click "Stop Server"
3. **Verify**:
   - ✅ Container stops (docker ps shows it gone)
   - ✅ Status in UI changes to "offline"
   - ✅ Minecraft client shows "Disconnected from Server"
4. Click "Restart Server"
5. **Verify**:
   - ✅ Container restarts
   - ✅ Status returns to "online"
   - ✅ Can rejoin immediately

### ✅ Step 7.4: Test Multiple Servers

1. Create a second server "Survival"
2. Create a third server "Creative"
3. **Verify**:
   - ✅ Each has unique port (25565, 25566, 25567, etc.)
   - ✅ Each has unique RCON password
   - ✅ All show as "online"
   - ✅ Docker shows 3 running containers

### ✅ Step 7.5: Test Logs Viewing

1. From dashboard, click "Console"
2. **Verify**:
   - ✅ Shows last 50 lines of server output
   - ✅ Updates every 2 seconds
   - ✅ Shows "Player joined" when you connect
   - ✅ Shows "Player left" when you disconnect

### ✅ Step 7.6: Verify Data Persistence

1. Create a server "Persistence Test"
2. Join and place some blocks
3. Type `/save-all` in chat
4. From dashboard, stop the server
5. From dashboard, restart the server
6. Rejoin the server
7. **Verify**:
   - ✅ Your blocks are still there
   - ✅ Data persisted through restart

### ✅ Step 7.7: Test Cleanup

1. Delete a server from dashboard
2. Check Docker: `docker ps -a`
3. **Verify**:
   - ✅ Container no longer appears
   - ✅ Data directory still exists at `/var/lib/lighth/data/{id}/`
   - ✅ Can potentially restore if needed

**Status**: ✅ All manual tests passing

---

## Phase 8: Performance Testing (15 minutes)

### ✅ Step 8.1: Monitor Resource Usage

```bash
# Watch Docker stats in real-time
docker stats --no-stream mc-1-skyblock

# Expected for 2GB server:
# CONTAINER | CPU % | MEM USAGE | MEM % | NET I/O
# mc-1...   | 5-10% | 1.2-1.5G | 60%   | 100MB/s
```

### ✅ Step 8.2: Test Under Load

1. Create server with 4GB memory
2. Have 5+ players join
3. Monitor with `docker stats`
4. **Verify**:
   - ✅ CPU stays < 80%
   - ✅ Memory stays < allocated amount
   - ✅ No out-of-memory errors
   - ✅ TPS stays above 18.0

### ✅ Step 8.3: Check Disk Usage

```bash
# See how much space servers are using
du -sh /var/lib/lighth/data/*

# Expected:
# 500M    /var/lib/lighth/data/1
# 600M    /var/lib/lighth/data/2
```

### ✅ Step 8.4: Verify Image Cache

```bash
# After first launch, image is cached
docker images | grep minecraft-server

# Second server creation should use cached image
# (Much faster, no pull needed)
```

**Status**: ✅ Performance acceptable

---

## Phase 9: Security Checklist (10 minutes)

### ✅ Security Check 1: Passwords

```bash
# Verify RCON passwords are cryptographically random
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers

# Check passwords:
# - Should be 12+ characters
# - Mix of upper, lower, numbers
# - No sequential patterns
```

### ✅ Security Check 2: Port Allocation

```bash
# Verify unique ports across servers
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers | grep port

# Expected: Each server has different port
```

### ✅ Security Check 3: Data Permissions

```bash
# Verify only owner can access data
ls -la /var/lib/lighth/data/

# Expected: User-owned, mode 755 (no world-writable)
```

### ✅ Security Check 4: Docker Socket

```bash
# Verify restricted socket access
ls -la /var/run/docker.sock

# Expected: Owned by root:docker, mode 660
# Your user should be in 'docker' group
```

### ✅ Security Check 5: Environment Variables

```bash
# Verify sensitive vars aren't logged
grep -r "RCON_PASSWORD\|rconPassword" \
  backend/src --include="*.js" | \
  grep -v "console.log"

# Expected: Not in logs, only in environment
```

**Status**: ✅ Security checks passed

---

## Phase 10: Production Deployment (Varies)

### ✅ Step 10.1: Deploy to Production Server

Option A: Using Docker Compose
```yaml
# docker-compose.yml
version: '3'
services:
  lighth-backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - DOCKER_SOCKET=/var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/lighth/data:/var/lib/lighth/data
    restart: unless-stopped
```

Option B: Using systemd service
```ini
# /etc/systemd/system/lighth.service
[Unit]
Description=LightNode Minecraft Hosting
After=docker.service

[Service]
Type=simple
User=lighth
ExecStart=/usr/bin/npm start
WorkingDirectory=/opt/lighth/backend
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### ✅ Step 10.2: Configure Networking

```bash
# Open ports for Minecraft servers
# Ports 25565-26000 should be accessible from outside

# For production, consider:
# 1. Firewall rules (ufw, iptables, cloud provider)
# 2. Reverse proxy (nginx for web, direct for game)
# 3. DDoS protection (Cloudflare, Imperva)
# 4. Load balancing (multiple servers, same IP)
```

### ✅ Step 10.3: Set Up Monitoring

```bash
# Monitor Docker containers
docker stats --no-stream > /var/log/lighth/docker-stats.log

# Monitor application logs
tail -f /var/log/lighth/app.log

# Monitor disk usage
df -h /var/lib/lighth/data >> /var/log/lighth/disk.log
```

### ✅ Step 10.4: Set Up Backups

```bash
# Automated daily backup
0 2 * * * tar -czf /backup/lighth-$(date +%Y%m%d).tar.gz /var/lib/lighth/data
```

### ✅ Step 10.5: Configure SSL/TLS

```bash
# For API endpoint (if exposed)
# Install certbot: sudo apt install certbot
# Get certificate: sudo certbot certonly --standalone -d yourdomain.com
# Configure nginx to proxy with SSL
```

**Status**: ✅ Production ready

---

## Troubleshooting

### Issue: "Docker socket not found"

**Error**:
```
connect ENOENT /var/run/docker.sock
```

**Solutions**:
1. Check Docker is running:
   ```bash
   sudo systemctl start docker
   ```
2. Check user has access:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```
3. Verify socket exists:
   ```bash
   ls -la /var/run/docker.sock
   ```

### Issue: "Port already in use"

**Error**:
```
EADDRINUSE 0.0.0.0:25565
```

**Solutions**:
1. Find what's using it:
   ```bash
   lsof -i :25565
   ```
2. Stop that service:
   ```bash
   kill -9 <PID>
   ```
3. Or let provisioning pick next port (25566, etc.)

### Issue: "Out of memory"

**Error**:
```
java.lang.OutOfMemoryError: Java heap space
```

**Solutions**:
1. Increase server memory: Edit request to 4GB, 6GB, etc.
2. Stop other containers to free RAM
3. Check host has enough space:
   ```bash
   free -h
   ```

### Issue: "Container won't start"

**Debug**:
```bash
# Check logs
docker logs mc-1-test

# Common issues:
# - EULA not accepted (add EULA=TRUE to env)
# - Port conflict (choose different port)
# - Memory limit exceeded (increase allocated)

# Rebuild container
docker rm mc-1-test
docker run -it itzg/minecraft-server /bin/bash
```

### Issue: "Slow server, high lag"

**Diagnose**:
```bash
# Check resource usage
docker stats mc-1-test

# If CPU > 90%: Java GC issue (Aikar flags should help)
# If Memory > allocated: Need more RAM
# If Network slow: Host network congestion
```

**Solutions**:
1. Ensure Aikar flags are set in dockerProvisioner.js
2. Reduce player count
3. Reduce render distance
4. Use server-side optimizations (Spigot, Paper)

---

## Verification Checklist

Before considering implementation complete, verify all of these:

- [ ] Docker installed and running
- [ ] Backend server starts without errors
- [ ] `/api/health/docker` returns healthy
- [ ] Can create server via API
- [ ] Container appears in `docker ps`
- [ ] Can join server from Minecraft
- [ ] Can stop and restart server
- [ ] Data persists through restarts
- [ ] Console logs show in dashboard
- [ ] Port allocation is unique per server
- [ ] RCON passwords are secure
- [ ] No errors in backend logs
- [ ] Frontend shows server status
- [ ] Multiple servers can run simultaneously
- [ ] Disk usage is reasonable
- [ ] Memory usage matches allocated

---

## Next Steps

After basic implementation, consider:

1. **RCON Command Execution**: Let users execute commands from dashboard
   - Install: `npm install rcon-js`
   - Create endpoint: `POST /api/servers/:id/command`
   - Feature: `/op username`, `/save-all`, etc.

2. **Server Backups**: Automated world snapshots
   - Create endpoint: `POST /api/servers/:id/backup`
   - Feature: Schedule daily backups

3. **Server Cloning**: Duplicate server with all settings
   - Feature: Copy world + plugins to new server

4. **Server Templates**: Pre-configured server types
   - Vanilla, Spigot, Paper, Fabric
   - With plugins pre-installed

5. **Monitoring Dashboard**: Real-time performance metrics
   - TPS graph, player count, memory usage
   - Performance optimization recommendations

6. **Multi-Node Architecture**: Run servers across multiple machines
   - Use Docker Swarm or Kubernetes
   - Load balance game servers

---

## Summary

You've now implemented a production-grade Minecraft hosting platform with:

✅ Secure credential generation  
✅ Intelligent port allocation  
✅ Docker container orchestration  
✅ Live server management  
✅ Persistent world data  
✅ Performance monitoring  
✅ User-friendly dashboard  

**Happy hosting!** 🎮
