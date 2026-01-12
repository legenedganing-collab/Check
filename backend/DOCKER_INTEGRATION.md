# Docker Integration Guide

## Overview

This guide explains how to use the provisioning system's generated credentials to launch actual Minecraft servers in Docker containers.

## Architecture

```
Provisioning System (provisioning.js)
    ↓
Generates: { port, ipAddress, rconPassword }
    ↓
Docker Container Launch
    ↓
Server Running on Allocated Port
```

## Step 1: Docker Image Preparation

### Option A: Official Minecraft Server Image

Use the `itzg/minecraft-server` image (recommended for production):

```bash
docker pull itzg/minecraft-server:latest
```

### Option B: Custom Image

Create a custom Dockerfile:

```dockerfile
FROM openjdk:17-jdk-slim

# Install Minecraft server
WORKDIR /minecraft
RUN wget https://launcher.mojang.com/v1/objects/.../server.jar

# Install RCON CLI tool
RUN apt-get update && apt-get install -y netcat && rm -rf /var/lib/apt/lists/*

EXPOSE 25565 25575

CMD ["java", "-Xmx${MEMORY}M", "-Xms${MEMORY}M", "-jar", "server.jar", "nogui"]
```

## Step 2: Docker Run Command

### Using Generated Provisioning Data

When your backend provisions a server, you receive:

```json
{
  "port": 25566,
  "ipAddress": "154.12.1.45",
  "rconPassword": "7a2B9xPq1mZ9",
  "rconPort": 25575
}
```

### Launch Container

```bash
docker run -d \
  --name lighth_server_{SERVER_ID} \
  -p {PORT}:{PORT}/tcp \
  -p 25575:25575/tcp \
  -e EULA=TRUE \
  -e MEMORY={MEMORY_MB} \
  -e DIFFICULTY=3 \
  -e GAMEMODE=survival \
  -e ONLINE_MODE=true \
  -e RCON_PORT=25575 \
  -e RCON_PASSWORD={RCON_PASSWORD} \
  -v /data/lighth/{SERVER_ID}:/data \
  itzg/minecraft-server:latest
```

### Environment Variables Explained

| Variable | Source | Purpose |
|----------|--------|---------|
| `{PORT}` | `provisioningData.port` | External Minecraft server port |
| `{MEMORY_MB}` | `server.memory * 1024` | Server RAM allocation |
| `{RCON_PASSWORD}` | `provisioningData.rconPassword` | RCON admin password |
| `EULA` | `TRUE` | Accept Minecraft EULA |
| `ONLINE_MODE` | `true` | Verify player accounts |

## Step 3: Docker Compose (Recommended)

Create `docker-compose.yml` for each server:

```yaml
version: '3.8'

services:
  minecraft-server:
    image: itzg/minecraft-server:latest
    container_name: lighth_server_{SERVER_ID}
    environment:
      EULA: "TRUE"
      MEMORY: "{MEMORY_GB}G"
      DIFFICULTY: "3"
      GAMEMODE: "survival"
      ONLINE_MODE: "true"
      RCON_ENABLED: "true"
      RCON_PORT: "25575"
      RCON_PASSWORD: "{RCON_PASSWORD}"
      JVM_OPTS: "-Xmx{MEMORY_MB}M -Xms{MEMORY_MB}M"
    ports:
      - "{PORT}:25565/tcp"
      - "25575:25575/tcp"
    volumes:
      - /data/lighth/{SERVER_ID}:/data
      - /data/lighth/{SERVER_ID}/logs:/minecraft/logs
    restart: unless-stopped
    networks:
      - lighth-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:25565"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

networks:
  lighth-network:
    driver: bridge
```

## Step 4: Server Controller Integration

### Updated serverController.js with Docker Launch

```javascript
const docker = require('dockerode');
const dockerClient = new docker();

const createServer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, memory, diskSpace } = req.body;

    // ... validation code ...

    // Create server record
    const server = await prisma.server.create({
      data: {
        name,
        uuid: uuidv4(),
        ipAddress: '0.0.0.0',
        port: 0,
        memory,
        diskSpace,
        status: 'provisioning',
        userId,
      },
    });

    // Provision (allocate port, IP, credentials)
    const provisioningData = await provisionServer(server.id, userId);

    // Launch Docker container
    try {
      const container = await dockerClient.createContainer({
        Image: 'itzg/minecraft-server:latest',
        name: `lighth_server_${server.id}`,
        Env: [
          'EULA=TRUE',
          `MEMORY=${memory}G`,
          'DIFFICULTY=3',
          'GAMEMODE=survival',
          'ONLINE_MODE=true',
          'RCON_ENABLED=true',
          'RCON_PORT=25575',
          `RCON_PASSWORD=${provisioningData.rconPassword}`,
        ],
        ExposedPorts: {
          '25565/tcp': {},
          '25575/tcp': {},
        },
        HostConfig: {
          PortBindings: {
            '25565/tcp': [{ HostPort: provisioningData.port.toString() }],
            '25575/tcp': [{ HostPort: '25575' }],
          },
          Binds: [
            `/data/lighth/${server.id}:/data`,
          ],
          Memory: memory * 1024 * 1024 * 1024, // Convert GB to bytes
          RestartPolicy: {
            Name: 'unless-stopped',
            MaximumRetryCount: 0,
          },
        },
        Healthcheck: {
          Test: ['CMD', 'curl', '-f', 'http://localhost:25565'],
          Interval: 30000000000, // 30 seconds in nanoseconds
          Timeout: 10000000000,
          Retries: 3,
        },
      });

      // Start container
      await container.start();
      console.log(`[Docker] Started container for server ${server.id}`);

      // Update server with successful status
      const updatedServer = await prisma.server.update({
        where: { id: server.id },
        data: {
          ipAddress: provisioningData.ipAddress,
          port: provisioningData.port,
          rconPassword: provisioningData.rconPassword,
          status: 'online',
        },
      });

      res.status(201).json({
        message: 'Server created, provisioned, and launched successfully',
        server: updatedServer,
        credentials: {
          panelUsername: provisioningData.tempUsername,
          panelPassword: provisioningData.tempPassword,
          rconHost: provisioningData.rconHost,
          rconPort: provisioningData.rconPort,
          rconPassword: provisioningData.rconPassword,
        },
      });
    } catch (dockerError) {
      // If Docker launch fails, mark server as failed
      await prisma.server.update({
        where: { id: server.id },
        data: { status: 'failed' },
      });

      console.error('[Docker Error]', dockerError);
      return res.status(500).json({
        message: 'Server provisioned but Docker launch failed: ' + dockerError.message,
      });
    }
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(500).json({ message: 'Error creating server: ' + error.message });
  }
};
```

## Step 5: RCON Command Execution

Once the server is running, execute commands via RCON:

### Using mcrcon

```bash
docker run --rm --net host \
  javaberger/mcrcon \
  -H 127.0.0.1 \
  -P 25575 \
  -p "7a2B9xPq1mZ9" \
  "say Welcome to the server!"
```

### In Node.js with rcon-js

```javascript
const Rcon = require('rcon-js');

const executeCommand = async (server) => {
  const rcon = new Rcon(
    server.ipAddress,
    server.rconPassword,
    server.rconPort
  );

  try {
    await rcon.connect();
    const response = await rcon.execute('list'); // Get connected players
    console.log(response);
    await rcon.disconnect();
  } catch (error) {
    console.error('RCON Error:', error);
  }
};
```

## Step 6: Volume Management

### Directory Structure

```
/data/lighth/
├── 1/          # Server ID 1
│   ├── world/
│   ├── server.properties
│   ├── logs/
│   └── ...
├── 2/          # Server ID 2
│   ├── world/
│   └── ...
└── ...
```

### Backup Strategy

```bash
# Backup a server's world
docker exec lighth_server_1 sh -c 'tar czf /data/world_backup.tar.gz /data/world'

# Restore from backup
docker exec lighth_server_1 sh -c 'tar xzf /data/world_backup.tar.gz -C /data'
```

## Step 7: Monitoring and Logging

### View Container Logs

```bash
# Real-time logs
docker logs -f lighth_server_1

# Last 100 lines
docker logs --tail 100 lighth_server_1

# Logs from Prisma
const logs = await prisma.server.findUnique({
  where: { id: serverId }
});
console.log(logs); // Check status field
```

### Health Status

```javascript
const getServerHealth = async (serverId) => {
  try {
    const dockerClient = new docker();
    const container = dockerClient.getContainer(`lighth_server_${serverId}`);
    const inspect = await container.inspect();
    
    return {
      status: inspect.State.Status, // 'running', 'exited', 'paused'
      memory: inspect.HostConfig.Memory,
      ports: inspect.HostConfig.PortBindings,
    };
  } catch (error) {
    console.error('Health check error:', error);
    return { status: 'unknown', error: error.message };
  }
};
```

## Step 8: Teardown and Cleanup

### Stop and Remove Server

```javascript
const deleteServer = async (serverId) => {
  try {
    const dockerClient = new docker();
    const container = dockerClient.getContainer(`lighth_server_${serverId}`);
    
    // Stop container
    await container.stop({ t: 10 }); // 10 second grace period
    
    // Backup data before deletion (optional)
    // await backupServerData(serverId);
    
    // Remove container
    await container.remove();
    
    // Delete database record
    await prisma.server.delete({
      where: { id: serverId }
    });
    
    console.log(`Server ${serverId} deleted`);
  } catch (error) {
    console.error('Error deleting server:', error);
  }
};
```

## Production Checklist

- [ ] Use `--restart unless-stopped` for automatic recovery
- [ ] Set memory limits with `--memory` flag
- [ ] Use named volumes for data persistence
- [ ] Implement health checks
- [ ] Set up centralized logging (ELK stack, CloudWatch, etc.)
- [ ] Monitor port availability continuously
- [ ] Implement rate limiting on Docker launch calls
- [ ] Backup world data regularly
- [ ] Test failover and recovery procedures
- [ ] Use Docker network isolation
- [ ] Keep base images updated
- [ ] Implement container resource quotas

## Example: Complete Flow

```javascript
// 1. User creates server via API
POST /api/servers
{
  "name": "Survival Server",
  "memory": 4,
  "diskSpace": 50
}

// 2. Backend provisions
// - Allocates port 25566
// - Assigns IP 154.12.1.45
// - Generates password "7a2B9xPq1mZ9"

// 3. Docker container launches
docker run -d \
  --name lighth_server_1 \
  -p 25566:25565/tcp \
  -e RCON_PASSWORD="7a2B9xPq1mZ9" \
  itzg/minecraft-server

// 4. User receives credentials
{
  "ipAddress": "154.12.1.45",
  "port": 25566,
  "rconPassword": "7a2B9xPq1mZ9",
  "panelLoginUrl": "https://panel.lighth.io/..."
}

// 5. Players connect
// java -jar launcher.jar
// Server: 154.12.1.45:25566

// 6. Admin issues RCON commands
mcrcon -H 154.12.1.45 -P 25575 -p "7a2B9xPq1mZ9" "say Hello!"
```

## Troubleshooting

### Port Already in Use

```javascript
// Verify with provisioning.js
const isFree = await isPortFree(25566);
if (!isFree) {
  // Port is bound by another process
  // Check with: lsof -i :25566
}
```

### RCON Connection Failed

```bash
# Test RCON connectivity
telnet 154.12.1.45 25575
# Should connect successfully

# Verify password
docker exec lighth_server_1 cat /data/server.properties | grep rcon.password
```

### Container Not Starting

```bash
# Check logs
docker logs lighth_server_1

# Inspect container
docker inspect lighth_server_1

# Common issues:
# - EULA not set
# - Invalid memory allocation
# - Port already bound
# - Permission issues with /data volume
```

---

## Summary

The Docker integration combines:
1. **Provisioning** (secure credentials, port allocation)
2. **Container Launch** (Docker API, resource allocation)
3. **RCON Integration** (server command execution)
4. **Data Persistence** (volume management)
5. **Monitoring** (health checks, logging)

This creates a complete, production-grade Minecraft hosting platform.
