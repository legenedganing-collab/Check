# 🧠 Lighth Backend - Complete Setup & Integration Guide

## The "Nervous System" is Built!

Your Minecraft hosting platform now has a complete backend that connects your beautiful Dashboard UI to a real database. Here's what's implemented:

---

## ✅ What's Already Built

### 1. **Authentication System** (The Gatekeeper)
- ✓ User registration with email/username/password
- ✓ Secure password hashing with bcryptjs
- ✓ JWT token-based authentication (7-day expiration)
- ✓ Login endpoint that returns tokens
- ✓ Protected routes via `authMiddleware`

### 2. **Database Schema** (The Memory)
- ✓ **User Model** - Stores accounts, roles (admin/user), timestamps
- ✓ **Server Model** - Stores Minecraft servers with:
  - Server name, UUID, IP address, port
  - Memory (RAM in MB), Disk Space (in GB)
  - Status (online/offline)
  - Owner relationship (userId)

### 3. **Complete API** (The Brain)
- ✓ `POST /api/auth/register` - Create accounts
- ✓ `POST /api/auth/login` - Authenticate users
- ✓ `GET /api/servers` - List all user's servers (protected)
- ✓ `POST /api/servers` - Create new server (protected)
- ✓ `GET /api/servers/:id` - Get specific server (protected)
- ✓ `PUT /api/servers/:id` - Update server (protected)
- ✓ `DELETE /api/servers/:id` - Delete server (protected)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

**What gets installed:**
- `express` - Web framework
- `@prisma/client` - Database ORM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `uuid` - Unique server IDs

### Step 2: Configure Environment

Create a `.env` file in the `backend` folder:

```env
# PostgreSQL Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/lighth?schema=public"

# JWT Secret (generate a random string in production)
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"

# Server Config
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

**To generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Setup PostgreSQL Database

**Install PostgreSQL:**
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql`
- Windows: https://www.postgresql.org/download/windows/

**Create the database:**
```bash
createdb lighth
```

**Update DATABASE_URL with your credentials:**
```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/lighth?schema=public"
```

### Step 4: Initialize Prisma Schema

```bash
npx prisma migrate dev --name init
npx prisma generate
```

This creates all tables and relationships defined in `schema.prisma`.

### Step 5: Start the Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Lighth Backend Server is running on http://localhost:5000
📚 API Documentation:
   - POST   /api/auth/register  - Register a new user
   - POST   /api/auth/login     - Login user
   - GET    /api/servers        - Get all user's servers (requires JWT)
   ...
```

✅ **Backend is ready!**

---

## 📚 API Endpoint Reference

### Authentication Endpoints

#### Register a New User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "steve@lighth.com",
  "username": "steve",
  "password": "securepassword123"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdGV2ZUBsaWdodGguY29tIiwiaWF0IjoxNjczNDEyMDAwLCJleHAiOjE2NzQwMTY4MDB9.gE7W...",
  "user": {
    "id": 1,
    "email": "steve@lighth.com",
    "username": "steve",
    "role": "user"
  }
}
```

---

#### Login User
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "steve@lighth.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "steve@lighth.com",
    "username": "steve",
    "role": "user"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

---

### Server Endpoints (All Require JWT)

**⚠️ All server endpoints require JWT token in header:**
```
Authorization: Bearer <your_token_here>
```

#### Get All User's Servers
```bash
GET /api/servers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "Servers retrieved successfully",
  "servers": [
    {
      "id": 1,
      "name": "Survival Server",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "ipAddress": "192.168.1.100",
      "port": 25565,
      "memory": 4096,
      "diskSpace": 100,
      "status": "offline",
      "createdAt": "2026-01-12T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Creative Server",
      "uuid": "660e8400-e29b-41d4-a716-446655440001",
      "ipAddress": "192.168.1.101",
      "port": 25566,
      "memory": 8192,
      "diskSpace": 200,
      "status": "online",
      "createdAt": "2026-01-12T10:35:00.000Z"
    }
  ]
}
```

---

#### Create a New Server
```bash
POST /api/servers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Modded Server",
  "ipAddress": "192.168.1.102",
  "port": 25567,
  "memory": 6144,
  "diskSpace": 150
}
```

**Response (201):**
```json
{
  "message": "Server created successfully",
  "server": {
    "id": 3,
    "name": "Modded Server",
    "uuid": "770e8400-e29b-41d4-a716-446655440002",
    "ipAddress": "192.168.1.102",
    "port": 25567,
    "memory": 6144,
    "diskSpace": 150,
    "status": "offline",
    "createdAt": "2026-01-12T10:40:00.000Z",
    "updatedAt": "2026-01-12T10:40:00.000Z",
    "userId": 1
  }
}
```

---

#### Get Specific Server
```bash
GET /api/servers/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "Server retrieved successfully",
  "server": {
    "id": 1,
    "name": "Survival Server",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "ipAddress": "192.168.1.100",
    "port": 25565,
    "memory": 4096,
    "diskSpace": 100,
    "status": "offline",
    "createdAt": "2026-01-12T10:30:00.000Z",
    "updatedAt": "2026-01-12T10:30:00.000Z",
    "userId": 1
  }
}
```

---

#### Update Server
```bash
PUT /api/servers/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Updated Survival",
  "memory": 5120,
  "status": "online"
}
```

**Response (200):**
```json
{
  "message": "Server updated successfully",
  "server": {
    "id": 1,
    "name": "Updated Survival",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "ipAddress": "192.168.1.100",
    "port": 25565,
    "memory": 5120,
    "diskSpace": 100,
    "status": "online",
    "createdAt": "2026-01-12T10:30:00.000Z",
    "updatedAt": "2026-01-12T10:45:00.000Z",
    "userId": 1
  }
}
```

---

#### Delete Server
```bash
DELETE /api/servers/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "Server deleted successfully"
}
```

---

## 🔌 Frontend Integration Guide

### Step 1: Store JWT Token After Login

In your React Login component:

```javascript
const handleLogin = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (response.ok) {
    // Store token in localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect to dashboard
    navigate('/dashboard');
  } else {
    console.error(data.message);
  }
};
```

### Step 2: Include Token in API Requests

Create a helper function:

```javascript
// apiClient.js
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`http://localhost:5000${endpoint}`, {
    ...options,
    headers,
  });
  
  return response.json();
};

// Usage in components
const servers = await apiCall('/api/servers');
const newServer = await apiCall('/api/servers', {
  method: 'POST',
  body: JSON.stringify({ name: 'My Server', ... })
});
```

### Step 3: Create Auth Context (Recommended)

```javascript
// AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => 
    localStorage.getItem('authToken')
  );
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const register = async (email, username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage hook
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Step 4: Update Dashboard to Fetch Real Data

```javascript
// Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/servers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setServers(data.servers);
      } catch (error) {
        console.error('Failed to fetch servers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchServers();
    }
  }, [token]);

  if (loading) return <div>Loading servers...</div>;

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <div className="server-list">
        {servers.map(server => (
          <div key={server.id} className="server-card">
            <h3>{server.name}</h3>
            <p>IP: {server.ipAddress}:{server.port}</p>
            <p>Memory: {server.memory}MB | Disk: {server.diskSpace}GB</p>
            <p>Status: {server.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧪 Testing the API

### Using cURL

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lighth.com",
    "username": "testuser",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lighth.com","password":"password123"}'
```

**Get servers (replace TOKEN with actual token):**
```bash
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer TOKEN"
```

**Create a server:**
```bash
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Server",
    "ipAddress": "192.168.1.100",
    "port": 25565,
    "memory": 4096,
    "diskSpace": 100
  }'
```

### Using Postman

1. **Create a new collection** for Lighth API
2. **Set environment variable:** `token` = your JWT token
3. **Create requests:**
   - POST `/api/auth/register`
   - POST `/api/auth/login`
   - GET `/api/servers` (with Authorization header: `Bearer {{token}}`)
   - POST `/api/servers` (with Authorization header and JSON body)
   - etc.

---

## 🏗️ System Architecture

```
┌──────────────────────────────┐
│   Frontend Dashboard (React)  │
│   - Login/Register Pages      │
│   - Server List Display       │
│   - Server Create/Edit Forms  │
└──────────────┬───────────────┘
               │ HTTPS/REST API
               ↓
┌──────────────────────────────┐
│  Express Backend (Node.js)   │
│  - Auth Controller           │
│  - Server Controller         │
│  - JWT Middleware            │
│  - Error Handling            │
└──────────────┬───────────────┘
               │ Prisma ORM
               ↓
┌──────────────────────────────┐
│   PostgreSQL Database        │
│  - Users Table               │
│  - Servers Table             │
│  - Relationships             │
└──────────────────────────────┘
```

---

## ✅ Pre-Integration Checklist

Before connecting your frontend, verify:

- [ ] PostgreSQL installed and running
- [ ] `.env` file created with valid `DATABASE_URL`
- [ ] `npm install` completed
- [ ] `npx prisma migrate dev --name init` succeeded
- [ ] Backend starts with `npm run dev`
- [ ] `/api/health` returns status 200
- [ ] Can register a user via `/api/auth/register`
- [ ] Can login and receive JWT token
- [ ] Can create a server with valid token
- [ ] Can fetch servers with valid token
- [ ] CORS is properly configured for frontend URL

---

## 🚨 Troubleshooting

### Error: "DATABASE_URL not set"
**Solution:** Create `.env` file in `/backend` with valid PostgreSQL connection string.

### Error: "JWT_SECRET is not defined"
**Solution:** Add `JWT_SECRET` to `.env`. Generate one:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Error: CORS errors in frontend
**Solution:** Update `FRONTEND_URL` in `.env` to match your frontend dev server:
```env
FRONTEND_URL=http://localhost:5173
```

### Error: "Port 5000 already in use"
**Solution:** Kill the process or change PORT in `.env`:
```bash
lsof -i :5000
kill -9 <PID>
```

### Error: "prisma: not found"
**Solution:** Install Prisma CLI:
```bash
npm install -D prisma
npx prisma migrate dev
```

### Database connection fails
**Solution:** Verify PostgreSQL is running:
```bash
psql -U postgres -c "SELECT version();"
```

---

## 📋 Next Steps

1. **Connect Frontend to Backend**
   - Implement Login/Register pages
   - Create Auth context
   - Update Dashboard to fetch real servers

2. **Add Server Management UI**
   - Create/Edit server forms
   - Delete server confirmations
   - Real-time status updates

3. **Implement Wings Integration** (Future)
   - Connect to Minecraft server daemon
   - Send start/stop/restart commands
   - Receive server logs

4. **Add Admin Panel** (Future)
   - User management
   - Server monitoring
   - System resources

---

## 📞 API Base URL Reference

- **Development:** `http://localhost:5000`
- **Production:** `https://your-domain.com/api`

Remember to update CORS `FRONTEND_URL` when deploying!

