# PostgreSQL Setup Guide

## Installation & Setup

### 1. Install PostgreSQL (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
```

### 2. Start PostgreSQL Service
```bash
sudo service postgresql start
# or
sudo systemctl start postgresql
```

### 3. Create Database & User
```bash
sudo -u postgres psql
```

Then in the PostgreSQL CLI, run:
```sql
CREATE USER lighth WITH PASSWORD 'lighth_dev_password_123';
CREATE DATABASE lighth OWNER lighth;
GRANT ALL PRIVILEGES ON DATABASE lighth TO lighth;
\q
```

### 4. Update .env File
Make sure your `.env` has:
```dotenv
DATABASE_URL="postgresql://lighth:lighth_dev_password_123@localhost:5432/lighth?schema=public"
JWT_SECRET="lighth_dev_secret_key_change_in_production_12345"
PORT=5000
SOCKET_PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:1573
DOCKER_SOCKET=/var/run/docker.sock
LIGHTH_DATA_PATH=/var/lib/lighth/data
PANEL_URL=https://panel.lighth.io
```

### 5. Run Prisma Migrations
```bash
cd /workspaces/Check/backend
npx prisma migrate dev --name init
```

### 6. Verify Database Connection
```bash
psql -U lighth -d lighth -h localhost
# You should see the lighth=# prompt
\dt
# Should list: users, servers tables
\q
```

## All Server Ports

| Port | Service | URL | Status |
|------|---------|-----|--------|
| **1573** | Frontend (Vite) | https://crispy-doodle-x56wwp77w59x3vq9p-1573.app.github.dev/ | ✅ Running |
| **3002** | Main Backend API | http://localhost:3002 or https://crispy-doodle-x56wwp77w59x3vq9p-3002.app.github.dev/ | ✅ Running |
| **5432** | PostgreSQL Database | postgresql://lighth:password@localhost:5432/lighth | 🔧 Setup required |
| **7777** | WebSocket (Real-time) | wss://crispy-doodle-x56wwp77w59x3vq9p-7777.app.github.dev/ | ✅ Running |
| **8888** | File Server | https://crispy-doodle-x56wwp77w59x3vq9p-8888.app.github.dev/ | ✅ Running |

## Commands to Run

```bash
# Terminal 1: Start PostgreSQL
sudo service postgresql start

# Terminal 2: Start Backend (API on 3002)
cd /workspaces/Check/backend
npm start

# Terminal 3: Start WebSocket Server (7777)
cd /workspaces/Check/backend
node websocket-server.js

# Terminal 4: Start File Server (8888)
cd /workspaces/Check/backend
node file-server.js

# Terminal 5: Start Frontend (1573)
cd /workspaces/Check
npm run dev
```

## Test Connection

```bash
# Test backend API
curl http://localhost:3002/api/health

# Test WebSocket server
curl http://localhost:7777/api/health

# Test file server
curl http://localhost:8888/api/health

# Test database
psql -U lighth -d lighth -h localhost -c "SELECT version();"
```

## Demo Account

Once database is set up, the user table will be empty. You can:
- Register a new account at http://localhost:1573/register
- Or use SQL to create a demo account:

```sql
-- Hash password 'test123456' with bcrypt first
INSERT INTO users (email, username, password, role, "createdAt", "updatedAt")
VALUES ('test@lighth.io', 'testuser', '$2a$10$YIjlrLxTWydVVXgEPMZUiuu7K.sHVRfYEDCvp9/RHhVaA7qwPDGPm', 'user', NOW(), NOW());
```

## Troubleshooting

### PostgreSQL not starting
```bash
sudo service postgresql status
sudo service postgresql restart
```

### Permission denied
```bash
sudo -u postgres psql -c "SELECT version();"
```

### Connection refused on 5432
- Check if PostgreSQL is running: `sudo service postgresql status`
- Check firewall: `sudo ufw allow 5432`
- Verify .env DATABASE_URL is correct

### Prisma migration error
```bash
cd /workspaces/Check/backend
npx prisma migrate reset --force
npx prisma migrate dev --name init
```
