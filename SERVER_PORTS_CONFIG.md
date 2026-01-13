# LightNode Hosting Platform - Complete Port Configuration

## 🎯 All Server Ports & URLs

| # | Service | Port | Local URL | Codespace URL | Function |
|---|---------|------|-----------|---------------|----------|
| 1️⃣ | **Frontend (Vite)** | **1573** | http://localhost:1573 | https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev/ | Dashboard, Login, Server Management |
| 2️⃣ | **Backend API** | **3002** | http://localhost:3002 | https://crispy-doodle-x56wwp77w59x3vq9p-3002.app.github.dev/ | Authentication, Server CRUD, Provisioning |
| 3️⃣ | **PostgreSQL Database** | **5432** | postgresql://lighth:pass@localhost:5432/lighth | N/A (Internal) | User & Server Data Storage |
| 4️⃣ | **WebSocket Server** | **7777** | ws://localhost:7777 | wss://crispy-doodle-x56wwp77w59x3vq9p-7777.app.github.dev/ | Live Console, Real-time Updates |
| 5️⃣ | **File Server** | **8888** | http://localhost:8888 | https://crispy-doodle-x56wwp77w59x3vq9p-8888.app.github.dev/ | File Upload/Download, Modpacks |

---

## 🚀 Quick Start

### Step 1: Install PostgreSQL
```bash
bash /workspaces/Check/backend/setup-postgres.sh
```

This automatically:
- Installs PostgreSQL
- Creates `lighth` user with password `lighth_dev_password_123`
- Creates `lighth` database
- Shows connection string

### Step 2: Run Prisma Migrations
```bash
cd /workspaces/Check/backend
npx prisma migrate dev --name init
```

### Step 3: Start All Servers
```bash
# Option A: Run startup script (recommended)
bash /workspaces/Check/startup-all.sh

# Option B: Start servers manually in separate terminals
# Terminal 1: Backend (3002)
cd /workspaces/Check/backend && npm start

# Terminal 2: WebSocket (7777)
cd /workspaces/Check/backend && node websocket-server.js

# Terminal 3: File Server (8888)
cd /workspaces/Check/backend && node file-server.js

# Terminal 4: Frontend (1573)
cd /workspaces/Check && npm run dev
```

---

## 📡 Service Details

### 1️⃣ Frontend (Port 1573)
- **Technology**: Vite + React 18
- **Features**: Dashboard, Login/Register, Server Management UI
- **Files**: `/workspaces/Check/src/`
- **Command**: `npm run dev`

### 2️⃣ Backend API (Port 3002)
- **Technology**: Express.js + Prisma
- **Features**: 
  - User authentication (JWT)
  - Server CRUD operations
  - Docker provisioning
  - File listing
- **Files**: `/workspaces/Check/backend/src/`
- **Command**: `npm start`
- **Routes**:
  - `POST /api/auth/register` - Create account
  - `POST /api/auth/login` - Login
  - `GET /api/servers` - Get user's servers
  - `POST /api/servers` - Create server
  - `GET /api/servers/:id/files` - List server files

### 3️⃣ PostgreSQL Database (Port 5432)
- **Technology**: PostgreSQL 12+
- **Tables**: users, servers
- **Connection**: `postgresql://lighth:lighth_dev_password_123@localhost:5432/lighth?schema=public`
- **Command**: `sudo service postgresql start`
- **Files**: 
  - Schema: `/workspaces/Check/backend/prisma/schema.prisma`
  - Migrations: `/workspaces/Check/backend/prisma/migrations/`

### 4️⃣ WebSocket Server (Port 7777)
- **Technology**: Socket.io
- **Features**:
  - Live console output streaming
  - Real-time server status updates
  - Player count & metrics
  - Server command execution
- **Files**: `/workspaces/Check/backend/websocket-server.js`
- **Command**: `node websocket-server.js`
- **Events**:
  - `console-input` - Send command to server
  - `server-status` - Get live server stats

### 5️⃣ File Server (Port 8888)
- **Technology**: Express.js + Multer
- **Features**:
  - File upload (500MB max)
  - File download
  - Directory browsing
  - File deletion
- **Files**: `/workspaces/Check/backend/file-server.js`
- **Command**: `node file-server.js`
- **Routes**:
  - `POST /api/upload` - Upload file
  - `GET /api/files` - List files
  - `GET /api/files/:filename` - Download file
  - `DELETE /api/files/:filename` - Delete file

---

## 🔐 Demo Account

**Email**: `test@lighth.io`  
**Password**: `test123456`

Or register a new account at `http://localhost:1573/register`

---

## 🛠️ Troubleshooting

### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Test connection
psql -U lighth -d lighth -h localhost
```

### Database Locked Error
```bash
cd /workspaces/Check/backend
npx prisma migrate resolve --rolled-back init
npx prisma migrate dev --name init
```

### Port Already in Use
```bash
# Find process using port
lsof -i :3002
lsof -i :7777
lsof -i :8888

# Kill process
pkill -f "node server.js"
pkill -f "node websocket-server.js"
pkill -f "node file-server.js"
```

### Frontend Can't Connect to Backend
Check that:
1. Backend is running on port 3002
2. CORS is enabled in `backend/server.js`
3. Frontend API URL in `src/lib/api.js` is correct

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Browser / Client                      │
└─────────────┬───────────────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌────────┐ ┌─────────┐ ┌──────────┐
│Frontend│ │WebSocket│ │File Srv  │
│(1573)  │ │(7777)   │ │(8888)    │
└────────┘ └─────────┘ └──────────┘
    │         │         │
    └─────────┼─────────┘
              │
              ▼
        ┌──────────────┐
        │Backend API   │
        │(3002)        │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │PostgreSQL DB │
        │(5432)        │
        └──────────────┘
```

---

## 🎮 Features by Port

| Feature | Port | Example |
|---------|------|---------|
| User Dashboard | 1573 | View servers, create servers |
| Server Creation | 3002 | POST /api/servers |
| User Accounts | 5432 | Database storage |
| Live Console | 7777 | Real-time server output |
| Modpack Upload | 8888 | Upload .zip files |
| File Manager | 3002 | GET /api/servers/:id/files |
| Authentication | 3002 | JWT tokens |

---

## ✅ Verification Checklist

```bash
# 1. Check PostgreSQL
sudo service postgresql status

# 2. Test Backend
curl http://localhost:3002/api/health

# 3. Test WebSocket
curl http://localhost:7777/api/health

# 4. Test File Server
curl http://localhost:8888/api/health

# 5. Check Frontend
curl http://localhost:1573/ | head -50
```

---

## 📚 Documentation Links

- [PostgreSQL Setup](POSTGRESQL_SETUP.md)
- [Backend Implementation](backend/README.md)
- [Prisma Schema](backend/prisma/schema.prisma)
- [API Routes](backend/src/routes/)
- [Docker Provisioning](backend/lib/dockerProvisioner.js)

---

**Ready to go!** 🚀 Start with `bash /workspaces/Check/startup-all.sh`
