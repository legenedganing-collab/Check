# Lighth Backend - The Nervous System

This is the backend API for the Lighth Minecraft hosting platform. It handles authentication, database management, and server operations.

## 🏗️ Architecture

```
Frontend (Dashboard)
        ↓ (sends requests)
        ↓
Backend (Express API) ← JWT Authentication
        ↓
Database (PostgreSQL) ← Stores users, servers, data
```

## 📦 Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework for API routes
- **Prisma** - ORM for database management
- **PostgreSQL** - Relational database
- **JWT** - Secure authentication tokens
- **bcryptjs** - Password hashing

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/lighth?schema=public"
JWT_SECRET="your_super_secret_key_change_this"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Setup PostgreSQL Database

Make sure PostgreSQL is running:

```bash
# On Ubuntu/Debian
sudo service postgresql start

# Or using Docker
docker run --name lighth-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=lighth -p 5432:5432 -d postgres:15
```

### 4. Setup Prisma & Create Database Schema

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate
```

### 5. Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication Routes

#### Register a New User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "steve",
  "password": "securepassword123"
}

Response:
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "steve",
    "role": "user"
  }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "steve",
    "role": "user"
  }
}
```

### Server Routes (All require JWT token in Authorization header)

#### Get All User's Servers
```
GET /api/servers
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "message": "Servers retrieved successfully",
  "servers": [
    {
      "id": 1,
      "name": "SurvivalServer",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "ipAddress": "192.168.1.100",
      "port": 25565,
      "memory": 2048,
      "diskSpace": 50,
      "status": "online",
      "createdAt": "2024-01-10T10:30:00Z"
    }
  ]
}
```

#### Create New Server
```
POST /api/servers
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "SkyblockServer",
  "ipAddress": "192.168.1.101",
  "port": 25566,
  "memory": 4096,
  "diskSpace": 100
}

Response:
{
  "message": "Server created successfully",
  "server": {
    "id": 2,
    "name": "SkyblockServer",
    "uuid": "550e8400-e29b-41d4-a716-446655440001",
    "ipAddress": "192.168.1.101",
    "port": 25566,
    "memory": 4096,
    "diskSpace": 100,
    "status": "offline",
    "createdAt": "2024-01-12T14:20:00Z"
  }
}
```

#### Get Specific Server
```
GET /api/servers/1
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "message": "Server retrieved successfully",
  "server": { ... }
}
```

#### Update Server
```
PUT /api/servers/1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "UpdatedServerName",
  "status": "online",
  "memory": 8192
}

Response:
{
  "message": "Server updated successfully",
  "server": { ... }
}
```

#### Delete Server
```
DELETE /api/servers/1
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "message": "Server deleted successfully"
}
```

#### Health Check
```
GET /api/health

Response:
{
  "message": "Backend is running"
}
```

## 🗄️ Database Schema

### User Model
```prisma
- id: Integer (primary key)
- email: String (unique)
- password: String (hashed)
- username: String (unique)
- role: String (admin/user)
- createdAt: DateTime
- updatedAt: DateTime
- servers: Server[] (relationship)
```

### Server Model
```prisma
- id: Integer (primary key)
- name: String
- uuid: String (unique)
- ipAddress: String
- port: Integer (default: 25565)
- memory: Integer (RAM in MB)
- diskSpace: Integer (in GB)
- status: String (online/offline)
- createdAt: DateTime
- updatedAt: DateTime
- userId: Integer (foreign key)
- user: User (relationship)
```

## 🔐 Authentication Flow

1. **Register**: User creates account with email/password
2. **Hash Password**: Password is hashed with bcryptjs
3. **Generate JWT**: Server creates a signed JWT token (7-day expiration)
4. **Store Token**: Frontend saves token to localStorage/sessionStorage
5. **Protected Requests**: Frontend sends token in `Authorization: Bearer <token>` header
6. **Verify Token**: Backend middleware verifies token on protected routes
7. **Extract User Info**: Token contains user ID, used to filter servers

## 🛠️ Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (visual database browser)
npm run prisma:studio

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Reset database (deletes all data)
npx prisma migrate reset
```

## 📝 Error Handling

All endpoints return standardized error responses:

```json
{
  "message": "Error description here"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (missing/invalid data)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not found
- `409` - Conflict (duplicate user)
- `500` - Server error

## 🔒 Security Best Practices

1. **JWT Secret**: Change `JWT_SECRET` in production to a strong random string
2. **Password Hashing**: Passwords are hashed with bcryptjs (salt rounds: 10)
3. **CORS**: Only allows requests from `FRONTEND_URL`
4. **Token Expiration**: JWT tokens expire after 7 days
5. **Protected Routes**: All server routes require valid JWT token
6. **Data Isolation**: Users can only access their own servers

## 🧪 Testing with curl/Postman

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","username":"testuser","password":"pass123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123"}'
```

### Get Servers (with token)
```bash
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚧 Next Steps

1. **Connect Frontend to Backend**: Update Dashboard to call these APIs
2. **Wings Daemon Integration**: Connect to actual Minecraft server management
3. **Real-time Updates**: Add WebSocket for live server status
4. **File Management**: Add endpoints for server files, configs
5. **Monitoring**: Add metrics for CPU, RAM, disk usage

## 📖 Resources

- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [JWT Introduction](https://jwt.io/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
