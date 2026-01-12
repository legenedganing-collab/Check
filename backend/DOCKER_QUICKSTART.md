# Docker Quick Start ⚡

Get your Minecraft hosting up and running in 5 minutes.

---

## 1️⃣ Install Dependencies (1 min)

```bash
cd backend
npm install dockerode
```

---

## 2️⃣ Setup Environment (2 min)

**Option A: Automatic Setup**
```bash
bash setup-docker.sh
```

**Option B: Manual Setup**
```bash
# Create data directory
mkdir -p /var/lib/lighth/data
chmod 755 /var/lib/lighth/data

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker is running
docker ps
```

---

## 3️⃣ Start Backend (1 min)

```bash
npm start
```

**Expected output**:
```
Server running on port 3000
✅ Connected to database
✅ Docker daemon healthy
```

---

## 4️⃣ Test It Works (30 seconds)

In another terminal:

```bash
# Check Docker is accessible
curl http://localhost:3000/api/health/docker

# Should return:
# { "healthy": true, "message": "Docker daemon is healthy" }
```

---

## 5️⃣ Create Your First Server (30 seconds)

```bash
# 1. Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!"
  }' | jq -r '.token'

# 2. Copy the token from the output

# 3. Create a server (replace TOKEN)
curl -X POST http://localhost:3000/api/servers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Server",
    "memory": 2,
    "diskSpace": 10
  }' | jq .
```

**Response includes**:
```json
{
  "server": {
    "id": 1,
    "port": 25565,
    "status": "online"
  },
  "credentials": {
    "rconPassword": "K8jXpQwR2mL9"
  }
}
```

---

## 6️⃣ Join in Minecraft 🎮

1. Open Minecraft launcher
2. Click **Multiplayer**
3. Click **Add Server**
4. Fill in:
   - **Name**: "LightNode Test"
   - **Server Address**: `localhost:25565` (or your machine IP:port)
5. Click **Join Server**
6. **You're in!** 🎉

---

## 7️⃣ Monitor Your Server

```bash
# See running containers
docker ps

# Watch real-time stats
docker stats

# Check server logs
docker logs mc-1-my-first-server

# Get console from API
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers/1/logs | jq .logs
```

---

## ⚙️ Common Commands

### Stop a server (graceful shutdown)
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers/1/stop
```

### Restart a server
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers/1/restart
```

### Get server status
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers/1/status | jq .
```

### Delete a server
```bash
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/servers/1
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Docker socket not found" | Run `docker ps` to test access |
| "Port already in use" | System will auto-select next port (25566, etc.) |
| "Can't join in Minecraft" | Check firewall allows port; Use IP instead of localhost if on different machine |
| "Out of memory" | Allocate more to server (4GB, 6GB, etc.) |
| "Container won't start" | Run `docker logs mc-1-{name}` to see why |

---

## 📚 Learn More

- **Full Integration Guide**: [DOCKER_LAUNCH_INTEGRATION.md](../DOCKER_LAUNCH_INTEGRATION.md)
- **Implementation Checklist**: [DOCKER_IMPLEMENTATION_CHECKLIST.md](../DOCKER_IMPLEMENTATION_CHECKLIST.md)
- **Complete Summary**: [DOCKER_INTEGRATION_COMPLETE.md](../DOCKER_INTEGRATION_COMPLETE.md)

---

## Next Steps

After basic setup, you can:

1. **View live console** from dashboard
2. **Execute RCON commands** (requires rcon-js library)
3. **Backup worlds** automatically
4. **Clone servers** with existing settings
5. **Scale to multiple nodes** with Docker Swarm

---

## 🎉 You're Done!

Your LightNode Minecraft hosting platform is now **live and production-ready**.

Happy hosting! 🚀
