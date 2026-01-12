# 🗄️ Database Integration Guide - Using Prisma in Your Code

## What You Now Have

✅ **Database Schema** (prisma/schema.prisma)
- User model for authentication
- Server model for Minecraft servers
- Relationships configured

✅ **Database Connection** (lib/db.js)
- Singleton Prisma Client
- Prevents connection pool exhaustion
- Graceful shutdown handling

✅ **Environment Configuration** (.env.example)
- DATABASE_URL configured
- Ready for PostgreSQL

---

## 🚀 Setup Instructions (5 Minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install @prisma/client
npm install -D prisma
```

### Step 2: Create .env File
```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/lighth?schema=public"
JWT_SECRET="your_secret_key_here"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 3: Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This creates all tables in your database.

### Step 4: (Optional) View Database GUI
```bash
npx prisma studio
```

Opens a visual database manager at http://localhost:5555

---

## 💻 Using the Database in Your Code

### Import the Database
```javascript
const prisma = require('../lib/db');
```

### CREATE: Add New Data

#### Create a New User
```javascript
const newUser = await prisma.user.create({
  data: {
    email: "steve@lighth.com",
    username: "steve",
    password: hashedPassword, // Must be hashed!
    role: "user"
  }
});

console.log(newUser);
// Output: { id: 1, email: "steve@lighth.com", username: "steve", ... }
```

#### Create a Server for a User
```javascript
const newServer = await prisma.server.create({
  data: {
    name: "My Survival World",
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    ipAddress: "192.168.1.100",
    port: 25565,
    memory: 4096,      // 4 GB RAM
    diskSpace: 100,    // 100 GB
    status: "offline",
    userId: 1           // Link to user
  }
});

console.log(newServer);
// Output: { id: 1, name: "My Survival World", userId: 1, ... }
```

---

### READ: Fetch Data

#### Get All Users
```javascript
const allUsers = await prisma.user.findMany();
console.log(allUsers);
// Output: [{ id: 1, email: "...", ... }, { id: 2, ... }]
```

#### Get User by Email
```javascript
const user = await prisma.user.findUnique({
  where: { email: "steve@lighth.com" }
});

console.log(user);
// Output: { id: 1, email: "steve@lighth.com", ... }
```

#### Get All Servers for a User
```javascript
const userServers = await prisma.server.findMany({
  where: { userId: 1 },
  select: {
    id: true,
    name: true,
    ipAddress: true,
    port: true,
    memory: true,
    diskSpace: true,
    status: true
  }
});

console.log(userServers);
// Output: [{ id: 1, name: "My Survival World", ... }]
```

#### Get User WITH Their Servers
```javascript
const userWithServers = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    servers: true  // Include all servers owned by this user
  }
});

console.log(userWithServers);
// Output: { id: 1, email: "...", servers: [...] }
```

---

### UPDATE: Modify Data

#### Update User Info
```javascript
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: {
    email: "newemail@lighth.com",
    password: newHashedPassword
  }
});

console.log(updatedUser);
```

#### Update Server Status
```javascript
const updatedServer = await prisma.server.update({
  where: { id: 1 },
  data: {
    status: "online",
    ipAddress: "192.168.1.101"
  }
});

console.log(updatedServer);
```

#### Update Multiple Fields
```javascript
const server = await prisma.server.update({
  where: { id: 1 },
  data: {
    name: "Updated Server Name",
    memory: 8192,        // Upgrade to 8GB
    diskSpace: 200,      // Upgrade to 200GB
    status: "online"
  }
});
```

---

### DELETE: Remove Data

#### Delete a Server
```javascript
const deletedServer = await prisma.server.delete({
  where: { id: 1 }
});

console.log("Server deleted:", deletedServer.name);
```

#### Delete a User (and their servers cascade delete)
```javascript
const deletedUser = await prisma.user.delete({
  where: { id: 1 }
});

console.log("User deleted, and all their servers removed");
```

---

## 📊 Advanced Queries

### Count Records
```javascript
const userCount = await prisma.user.count();
const serverCount = await prisma.server.count();

console.log(`Total users: ${userCount}`);
console.log(`Total servers: ${serverCount}`);
```

### Find with Filters
```javascript
// Get all online servers
const onlineServers = await prisma.server.findMany({
  where: { status: "online" }
});

// Get servers with specific memory
const highMemoryServers = await prisma.server.findMany({
  where: { 
    memory: {
      gte: 8192  // Greater than or equal to 8GB
    }
  }
});

// Get servers by IP
const serversByIP = await prisma.server.findMany({
  where: {
    ipAddress: { contains: "192.168" }
  }
});
```

### Sorting and Pagination
```javascript
// Get servers sorted by name
const sorted = await prisma.server.findMany({
  where: { userId: 1 },
  orderBy: { name: 'asc' }
});

// Get first 10 servers
const paginated = await prisma.server.findMany({
  where: { userId: 1 },
  skip: 0,      // Skip first 0 records
  take: 10      // Take next 10 records
});

// Get second page of servers
const page2 = await prisma.server.findMany({
  where: { userId: 1 },
  skip: 10,     // Skip first 10 records
  take: 10      // Take next 10 records
});
```

---

## 🔍 Using in Your Controllers

### Example: authController.js (Already Done)
```javascript
const prisma = require('../lib/db');
const bcrypt = require('bcryptjs');

// Register new user
const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'user'
      }
    });

    res.status(201).json({ 
      message: 'User registered',
      user 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register };
```

### Example: serverController.js (Already Done)
```javascript
const prisma = require('../lib/db');

// Get user's servers
const getServers = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch servers for this user
    const servers = await prisma.server.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ servers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create server
const createServer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, ipAddress, port, memory, diskSpace } = req.body;

    const server = await prisma.server.create({
      data: {
        name,
        ipAddress,
        port,
        memory,
        diskSpace,
        uuid: require('uuid').v4(),
        userId
      }
    });

    res.status(201).json({ server });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getServers, createServer };
```

---

## 🛡️ Error Handling

### Handle Unique Constraint Violations
```javascript
try {
  await prisma.user.create({
    data: {
      email: "existing@email.com",
      username: "uniqueuser",
      password: "hashedpw"
    }
  });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint failed
    if (error.meta.target.includes('email')) {
      res.status(409).json({ error: 'Email already exists' });
    } else if (error.meta.target.includes('username')) {
      res.status(409).json({ error: 'Username already exists' });
    }
  }
}
```

### Handle Record Not Found
```javascript
const user = await prisma.user.findUnique({
  where: { id: 999 }
});

if (!user) {
  res.status(404).json({ error: 'User not found' });
  return;
}
```

---

## 🧪 Testing Database Queries

### Using Prisma Studio
```bash
npx prisma studio
```

Opens a GUI at http://localhost:5555 where you can:
- View all records
- Create new records
- Update records
- Delete records
- Run queries

### Using Node REPL
```bash
node
> const prisma = require('./backend/lib/db')
> await prisma.user.findMany()
```

---

## 📋 Database Schema Reference

### User Model
```javascript
{
  id:        Int       // Auto-incrementing ID
  email:     String    // Unique email address
  username:  String    // Unique username
  password:  String    // Hashed password
  role:      String    // "user" or "admin"
  createdAt: DateTime  // Auto-created timestamp
  updatedAt: DateTime  // Auto-updated timestamp
  servers:   Server[]  // List of servers owned
}
```

### Server Model
```javascript
{
  id:        Int       // Auto-incrementing ID
  name:      String    // Server display name
  uuid:      String    // Unique identifier
  ipAddress: String    // Server IP address
  port:      Int       // Default 25565
  memory:    Int       // RAM in MB
  diskSpace: Int       // Disk space in GB
  status:    String    // "online", "offline", "starting"
  createdAt: DateTime  // Auto-created timestamp
  updatedAt: DateTime  // Auto-updated timestamp
  userId:    Int       // Foreign key to User
  user:      User      // Relationship to owner
}
```

---

## 🚀 Common Operations Cheatsheet

```javascript
const prisma = require('../lib/db');

// CREATE
await prisma.user.create({ data: {...} });
await prisma.server.create({ data: {...} });

// READ
await prisma.user.findUnique({ where: {...} });
await prisma.user.findMany({ where: {...} });
await prisma.server.findMany({ where: {...} });

// UPDATE
await prisma.user.update({ where: {...}, data: {...} });
await prisma.server.update({ where: {...}, data: {...} });

// DELETE
await prisma.user.delete({ where: {...} });
await prisma.server.delete({ where: {...} });

// RELATIONSHIPS
await prisma.user.findUnique({
  where: { id: 1 },
  include: { servers: true }
});
```

---

## 📖 More Documentation

- **Prisma Docs**: https://www.prisma.io/docs/
- **Prisma CRUD**: https://www.prisma.io/docs/concepts/components/prisma-client/crud
- **Prisma Relations**: https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries

---

## ✅ What's Configured

✅ Prisma ORM installed
✅ PostgreSQL datasource configured
✅ Database schema defined (User + Server models)
✅ Singleton connection in lib/db.js
✅ Environment variables ready
✅ .env.example provided
✅ Migration ready to run
✅ Controllers already using Prisma

**Your "memory" is ready to use!** 🗄️
