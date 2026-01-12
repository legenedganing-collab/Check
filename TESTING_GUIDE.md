# 🧪 Testing Guide - Verify Your Nervous System Works

## Complete End-to-End Testing

This guide will help you verify that your backend "nervous system" is working correctly before connecting the frontend.

---

## Phase 1: Backend Startup Test

### Start the Backend
```bash
cd backend
npm run dev
```

**Expected Output:**
```
🚀 Lighth Backend Server is running on http://localhost:5000
📚 API Documentation:
   - POST   /api/auth/register  - Register a new user
   - POST   /api/auth/login     - Login user
   - GET    /api/servers        - Get all user's servers (requires JWT)
   - POST   /api/servers        - Create new server (requires JWT)
   - GET    /api/servers/:id    - Get specific server (requires JWT)
   - PUT    /api/servers/:id    - Update server (requires JWT)
   - DELETE /api/servers/:id    - Delete server (requires JWT)
   - GET    /api/health         - Health check
```

### Test Health Endpoint
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{"message":"Backend is running"}
```

✅ If you see this, backend is ready!

---

## Phase 2: Authentication Testing

### 2.1 Register a New User

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "steve@lighth.com",
    "username": "steve",
    "password": "StrongPassword123"
  }'
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdGV2ZUBsaWdodC5jb20iLCJ1c2VybmFtZSI6InN0ZXZlIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2NzM0MTIwMDAsImV4cCI6MTY3NDAyMjgwMH0.XyZ_abc...",
  "user": {
    "id": 1,
    "email": "steve@lighth.com",
    "username": "steve",
    "role": "user"
  }
}
```

**Save the token!** We'll use it in next steps:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2.2 Try Registering Again (Duplicate)

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "steve@lighth.com",
    "username": "steve",
    "password": "AnotherPassword456"
  }'
```

**Expected Response (409):**
```json
{
  "message": "User already exists"
}
```

✅ Duplicate prevention works!

### 2.3 Login with Valid Credentials

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "steve@lighth.com",
    "password": "StrongPassword123"
  }'
```

**Expected Response (200):**
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

### 2.4 Login with Wrong Password

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "steve@lighth.com",
    "password": "WrongPassword"
  }'
```

**Expected Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

✅ Password validation works!

### 2.5 Register Another User (For Later Testing)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@lighth.com",
    "username": "alice",
    "password": "AlicePassword789"
  }'
```

Save Alice's token for later:
```bash
TOKEN_ALICE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Phase 3: Server Management Testing

### 3.1 Get Servers (Empty List)

**Request:**
```bash
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Servers retrieved successfully",
  "servers": []
}
```

✅ Empty list is correct (no servers created yet)

### 3.2 Access Protected Route Without Token

**Request:**
```bash
curl -X GET http://localhost:5000/api/servers
```

**Expected Response (401):**
```json
{
  "message": "No token provided"
}
```

✅ Route protection works!

### 3.3 Access Protected Route With Invalid Token

**Request:**
```bash
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response (401):**
```json
{
  "message": "Invalid or expired token"
}
```

✅ Token validation works!

### 3.4 Create First Server

**Request:**
```bash
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Survival Server",
    "ipAddress": "192.168.1.100",
    "port": 25565,
    "memory": 4096,
    "diskSpace": 100
  }'
```

**Expected Response (201):**
```json
{
  "message": "Server created successfully",
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

✅ Server creation works!

### 3.5 Create Second Server

**Request:**
```bash
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Creative Server",
    "ipAddress": "192.168.1.101",
    "port": 25566,
    "memory": 8192,
    "diskSpace": 200
  }'
```

**Expected Response (201):**
```json
{
  "message": "Server created successfully",
  "server": {
    "id": 2,
    "name": "Creative Server",
    "ipAddress": "192.168.1.101",
    "port": 25566,
    "memory": 8192,
    "diskSpace": 200,
    ...
  }
}
```

### 3.6 Get All Servers

**Request:**
```bash
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
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
      "status": "offline",
      "createdAt": "2026-01-12T10:35:00.000Z"
    }
  ]
}
```

✅ List shows both servers!

### 3.7 Get Specific Server

**Request:**
```bash
curl -X GET http://localhost:5000/api/servers/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
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

### 3.8 Update Server

**Request:**
```bash
curl -X PUT http://localhost:5000/api/servers/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Survival Server",
    "memory": 6144,
    "status": "online"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Server updated successfully",
  "server": {
    "id": 1,
    "name": "Updated Survival Server",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "ipAddress": "192.168.1.100",
    "port": 25565,
    "memory": 6144,
    "diskSpace": 100,
    "status": "online",
    "createdAt": "2026-01-12T10:30:00.000Z",
    "updatedAt": "2026-01-12T10:45:00.000Z",
    "userId": 1
  }
}
```

✅ Update works!

### 3.9 Delete Server

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/servers/2 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Server deleted successfully"
}
```

### 3.10 Verify Deletion

**Request:**
```bash
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Servers retrieved successfully",
  "servers": [
    {
      "id": 1,
      "name": "Updated Survival Server",
      ...
    }
  ]
}
```

✅ Only one server remains!

---

## Phase 4: Data Isolation Testing

### 4.1 Verify Alice Can't See Steve's Servers

**Request (using Alice's token):**
```bash
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN_ALICE"
```

**Expected Response (200):**
```json
{
  "message": "Servers retrieved successfully",
  "servers": []
}
```

✅ Alice sees empty list (not Steve's servers)!

### 4.2 Create Server as Alice

**Request:**
```bash
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice's Server",
    "ipAddress": "192.168.1.200",
    "port": 25567,
    "memory": 2048,
    "diskSpace": 50
  }'
```

### 4.3 Verify Users See Only Their Own Servers

**Steve's servers:**
```bash
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN"
```
Should return only Steve's server

**Alice's servers:**
```bash
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN_ALICE"
```
Should return only Alice's server

✅ Data isolation works!

---

## Phase 5: Error Handling

### 5.1 Invalid Server ID

**Request:**
```bash
curl -X GET http://localhost:5000/api/servers/999 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (404):**
```json
{
  "message": "Server not found"
}
```

### 5.2 Missing Required Fields

**Request:**
```bash
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Server Without IP"
  }'
```

**Expected Response (400):**
```json
{
  "message": "Name, IP address, memory, and disk space are required"
}
```

### 5.3 Access Another User's Server

**Request (Alice trying to update Steve's server):**
```bash
curl -X PUT http://localhost:5000/api/servers/1 \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hacked!"
  }'
```

**Expected Response (404):**
```json
{
  "message": "Server not found"
}
```

✅ Access control works!

---

## Summary: Complete Test Checklist

### ✅ Authentication
- [ ] Health check returns 200
- [ ] User registration succeeds
- [ ] Duplicate registration blocked
- [ ] Login succeeds
- [ ] Wrong password rejected
- [ ] Protected routes require token
- [ ] Invalid token rejected

### ✅ Server Management
- [ ] Can create server
- [ ] Can read servers list
- [ ] Can read specific server
- [ ] Can update server
- [ ] Can delete server
- [ ] Non-existent server returns 404

### ✅ Data Security
- [ ] Users see only their servers
- [ ] Users can't modify other users' servers
- [ ] Users can't delete other users' servers
- [ ] Each server properly assigned to owner

### ✅ Error Handling
- [ ] Missing fields return 400
- [ ] Invalid IDs return 404
- [ ] No token returns 401
- [ ] Expired token returns 401

---

## Next Steps

Once all tests pass ✅:

1. Proceed to [Frontend Integration](./FRONTEND_INTEGRATION.md)
2. Create login/register pages
3. Build dashboard connection to real API
4. Test entire flow end-to-end

**Congratulations! Your backend nervous system is fully operational!** 🎉

