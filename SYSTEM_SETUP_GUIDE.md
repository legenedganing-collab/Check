# 🚀 LightNode Complete System Setup Guide

## Overview

LightNode is a complete Minecraft hosting platform with the following components running on separate ports:

| # | Service | Port | Type | Purpose |
|---|---------|------|------|---------|
| 1 | Frontend (Vite React) | **1573** | HTTP | Dashboard, UI, Server Management |
| 2 | Backend API (Express) | **3002** | HTTP + WebSocket | REST API, Authentication, Real-time Events |
| 3 | PostgreSQL Database | **5432** | TCP | Data Persistence |
| 4 | WebSocket Server | **7777** | WS/WSS | Live Console, Real-time Updates |
| 5 | File Server | **8888** | HTTP | File Upload/Download |

---

## 📋 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Docker (for Minecraft server provisioning)
- Ubuntu/Linux environment

### 1. Install Dependencies

**Frontend:**
```bash
cd /workspaces/Check
npm install
```

**Backend:**
```bash
cd /workspaces/Check/backend
npm install
```

### 2. Setup PostgreSQL

**Check if PostgreSQL is running:**
```bash
sudo service postgresql status
```

**Start PostgreSQL if not running:**
```bash
sudo service postgresql start
```

**Create database and user (for local development):**
```bash
sudo -u postgres psql << EOF
CREATE DATABASE lighth;
ALTER DATABASE lighth OWNER TO postgres;
EOF
```

**Verify database was created:**
```bash
sudo -u postgres psql -l | grep lighth
```

### 3. Configure Environment

**Backend .env** (`/workspaces/Check/backend/.env`):
```bash
NODE_ENV=development
PORT=5000
SOCKET_PORT=3002
DATABASE_URL="postgresql://postgres@localhost:5432/lighth?schema=public"
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
FRONTEND_URL=http://localhost:1573
DOCKER_SOCKET=/var/run/docker.sock
LIGHTH_DATA_PATH=/var/lib/lighth/data
LOG_LEVEL=debug
```

### 4. Run Database Migrations

```bash
cd /workspaces/Check/backend
npx prisma migrate deploy
```

Or to create new migrations:
```bash
npx prisma migrate dev
```

---

## 🎯 Starting All Services

### Option 1: Automated Script (Recommended)

```bash
bash /workspaces/Check/start-servers.sh
```

This script will:
1. Clean up old processes
2. Start PostgreSQL
3. Start Backend API (port 3002)
4. Start WebSocket Server (port 7777)
5. Start File Server (port 8888)
6. Start Frontend (port 1573)
7. Display all service URLs

### Option 2: Manual Startup

**Terminal 1 - Backend API:**
```bash
cd /workspaces/Check/backend
npm start
```
Output: `🚀 Lighth Backend Server is running`

**Terminal 2 - Frontend:**
```bash
cd /workspaces/Check
npm run dev
```
Output: `VITE v5.0.8 ready in XXX ms`

**Terminal 3 - WebSocket Server (if needed):**
```bash
cd /workspaces/Check/backend
node websocket-server.js
```

**Terminal 4 - File Server (if needed):**
```bash
cd /workspaces/Check/backend
node file-server.js
```

---

## 🌐 Access URLs

### Local Development
- **Frontend:** http://localhost:1573
- **Backend API:** http://localhost:3002
- **Backend Health:** http://localhost:3002/api/health
- **WebSocket:** ws://localhost:7777
- **File Server:** http://localhost:8888
- **PostgreSQL:** postgresql://postgres@localhost:5432/lighth

### GitHub Codespaces
- **Frontend:** https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev/
- **Backend API:** https://crispy-doodle-x56wwp77w59x3vq9p-3002.app.github.dev/
- **WebSocket:** wss://crispy-doodle-x56wwp77w59x3vq9p-7777.app.github.dev/
- **File Server:** https://crispy-doodle-x56wwp77w59x3vq9p-8888.app.github.dev/

---

## 🔍 Troubleshooting

### Backend won't start: "EADDRINUSE"
Port 3002 is already in use.

**Solution:**
```bash
# Kill process on port 3002
lsof -ti:3002 | xargs kill -9

# Or use the cleanup script
pkill -f "npm start"
pkill -f "node websocket-server"
```

### Database connection refused
PostgreSQL not running or credentials wrong.

**Solution:**
```bash
# Check PostgreSQL status
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Test connection
psql -U postgres -d lighth -c "SELECT 1"
```

### Frontend can't reach backend (502 error)
CORS or API URL configuration issue.

**Solution:**
1. Check console logs in browser DevTools
2. Verify Backend API is running on port 3002
3. Check CORS headers in backend/server.js
4. For codespace: Ensure `.app.github.dev` domain is allowed

**Frontend logs path:** http://localhost:1573 → Open DevTools → Console

**Backend logs path:** `/tmp/Backend API.log`

### Port already in use
```bash
# Kill all Node processes
pkill -f node

# Kill all npm processes
pkill -f npm

# Check which process uses a port
sudo lsof -i :3002
sudo lsof -i :1573
```

---

## 📊 Service Port Map

```
┌─────────────────────────────────────────────────┐
│                 CLIENT (Port 1573)              │
│              Frontend React Dashboard           │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┼─────────┐
         ▼         ▼         ▼
   ┌─────────────────────────────────┐
   │   Backend API (Port 3002)       │
   │  Express.js + Socket.io Server  │
   │ - REST API Endpoints            │
   │ - WebSocket Connections         │
   │ - JWT Authentication            │
   └──────┬──────────────┬───────────┘
          │              │
    ┌─────▼─────┐   ┌────▼────────┐
    ▼           ▼   ▼             ▼
┌────────┐ ┌────────────┐ ┌────────────┐
│Database│ │File Server │ │WebSocket   │
│Port    │ │Port 8888   │ │Port 7777   │
│5432    │ │HTTP        │ │WS/WSS      │
└────────┘ └────────────┘ └────────────┘
```

---

## ✅ Verification

Check if all services are running:

```bash
# Frontend
curl -s http://localhost:1573 | head -20

# Backend API
curl -s http://localhost:3002/api/health

# WebSocket
curl -s http://localhost:7777/api/health

# File Server
curl -s http://localhost:8888/api/health

# PostgreSQL
psql -U postgres -d lighth -c "SELECT 1"
```

**Expected outputs:**
```
Frontend:      HTML content (React app)
Backend:       {"message":"Backend is running","port":3002}
WebSocket:     {"message":"WebSocket server is running",...}
File Server:   {"message":"File server is running",...}
PostgreSQL:    (1 row) - number 1
```

---

## 🔧 Environment Variables

### Backend .env (Required)
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `5000` | Unused (use SOCKET_PORT) |
| `SOCKET_PORT` | `3002` | Main backend API port |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `JWT_SECRET` | - | JWT signing key (change in production) |
| `FRONTEND_URL` | `http://localhost:1573` | Frontend origin for CORS |

### Frontend Environment (Hardcoded)
```javascript
// src/lib/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';
```

---

## 📝 Common Commands

```bash
# Install dependencies
npm install

# Start backend with auto-reload
cd backend && npm run dev

# Start frontend with hot reload
npm run dev

# Build frontend
npm run build

# Preview build
npm run preview

# Check database
psql -U postgres -d lighth

# View backend logs
tail -f /tmp/Backend\ API.log

# Stop all services
pkill -f npm
pkill -f node
```

---

## 🐳 Docker Integration

The system can provision and manage Minecraft servers in Docker containers.

**Required:** Docker must be installed and running

```bash
# Check Docker status
docker ps

# View running Minecraft servers
docker ps -a | grep lighth_server
```

---

## 📞 Support

For issues:
1. Check `/tmp/Backend API.log` for backend errors
2. Open browser DevTools for frontend errors
3. Run health check endpoints
4. Verify PostgreSQL connection
5. Check port availability with `lsof -i :PORT`

---

**Last Updated:** January 13, 2026
**Version:** 1.0.0
