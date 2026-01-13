# 🚀 LightNode - Complete Startup Guide

## Quick Start (5 Minutes)

### Option 1: Run Everything at Once
```bash
bash /workspaces/Check/quick-start.sh
```

### Option 2: Run Each Service in Separate Terminals

**Terminal 1 - Backend API (Port 3002)**
```bash
cd /workspaces/Check/backend
npm start
```

**Terminal 2 - WebSocket Server (Port 7777)**
```bash
cd /workspaces/Check/backend
node websocket-server.js
```

**Terminal 3 - File Server (Port 8888)**
```bash
cd /workspaces/Check/backend
node file-server.js
```

**Terminal 4 - Frontend (Port 1573)**
```bash
cd /workspaces/Check
npm run dev
```

---

## 📊 All Running Services & Ports

| Service | Port | Local URL | Codespace URL | Status |
|---------|------|-----------|---------------|--------|
| Frontend | 1573 | http://localhost:1573 | https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev | ✅ |
| Backend API | 3002 | http://localhost:3002 | https://crispy-doodle-x56wwp77w59x3vq9p-3002.app.github.dev | ✅ |
| WebSocket | 7777 | ws://localhost:7777 | wss://crispy-doodle-x56wwp77w59x3vq9p-7777.app.github.dev | ✅ |
| File Server | 8888 | http://localhost:8888 | https://crispy-doodle-x56wwp77w59x3vq9p-8888.app.github.dev | ✅ |
| PostgreSQL | 5432 | localhost:5432 | N/A (Internal) | Setup needed |

---

## 🔐 Demo Account

**Email:** `test@lighth.io`  
**Password:** `test123456`

Or register new at: https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev/register

---

## 🛠️ Check Running Processes

```bash
# See all running ports
bash /workspaces/Check/check-status.sh

# Or manually check:
ss -tuln | grep -E "1573|3002|7777|8888"
ps aux | grep -E "node|npm" | grep -v grep
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
pkill -f "npm start"
pkill -f "npm run dev"
pkill -f "websocket-server"
pkill -f "file-server"
```

### Frontend Shows 502 Error
- Check if backend is running: `curl http://localhost:3002/api/health`
- Check if WebSocket is running: `curl http://localhost:7777/api/health`
- Check if File Server is running: `curl http://localhost:8888/api/health`

### Backend Won't Start
```bash
cd /workspaces/Check/backend
npm install  # Install dependencies if missing
npm start
```

### Check Logs
```bash
tail -f /tmp/*.log
```

---

## 📝 Service Details

### Frontend (1573) - Vite React App
- Dashboard with server management
- Login/Register pages
- File manager interface
- Real-time console viewer

### Backend API (3002) - Express.js
```
POST   /api/auth/register      - Create account
POST   /api/auth/login         - Login
GET    /api/servers            - List servers
POST   /api/servers            - Create server
GET    /api/servers/:id/files  - List server files
```

### WebSocket (7777) - Real-time Updates
- Live console streaming
- Server status updates
- Player count metrics
- Command execution

### File Server (8888) - Upload/Download
```
POST   /api/upload             - Upload files
GET    /api/files              - List files
GET    /api/files/:filename    - Download file
DELETE /api/files/:filename    - Delete file
```

---

## ✅ Verification Checklist

After starting services:

```bash
# 1. Check all ports are listening
ss -tuln | grep -E "1573|3002|7777|8888"

# 2. Test Backend
curl http://localhost:3002/api/health

# 3. Test WebSocket
curl http://localhost:7777/api/health

# 4. Test File Server
curl http://localhost:8888/api/health

# 5. Open Frontend in browser
# https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev
```

---

## 🎮 Next Steps

1. Open https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev
2. Login with test@lighth.io / test123456
3. Create your first server
4. Upload modpacks using the file server
5. View live console via WebSocket
