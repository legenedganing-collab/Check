# 🧠 The Complete Lighth System Architecture

## Your Journey So Far

### Phase 1: ✅ The "Face" (Frontend Dashboard UI)
- Created beautiful React Dashboard interface
- Designed server cards, sidebar navigation
- Built responsive layout with CSS
- Mockup complete with hardcoded data

### Phase 2: ✅ The "Nervous System" (Backend API)
- Built Express.js backend
- Implemented JWT authentication
- Created Prisma database schema
- Set up protected API routes

### Phase 3: 🎯 Connection (What's Next)
- Wire frontend to backend
- Replace mock data with real database
- Implement auth pages
- Build working app

---

## 📚 Complete Documentation Map

### Backend Setup & Documentation
📄 **[BACKEND_SETUP.md](./backend/BACKEND_SETUP.md)**
- Complete setup instructions
- Database configuration
- API endpoint reference
- cURL testing examples
- Troubleshooting guide

### Frontend Integration
📄 **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)**
- Step-by-step integration guide
- Auth service creation
- Context providers
- Protected routes
- Login/Register pages
- Dashboard connection

---

## 🏗️ System Components

### Frontend (React)
```
src/
├── pages/
│   ├── LoginPage.jsx       ← User authentication
│   └── RegisterPage.jsx    ← New account creation
├── components/
│   ├── Dashboard.jsx       ← Main interface (now with real data!)
│   └── ProtectedRoute.jsx  ← Route protection
├── services/
│   ├── authService.js      ← Auth API calls
│   └── serverService.js    ← Server CRUD operations
├── context/
│   └── AuthContext.jsx     ← Global auth state
└── App.jsx                 ← Routing setup
```

### Backend (Node.js/Express)
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js     ← Register/Login logic
│   │   └── serverController.js   ← CRUD operations
│   ├── middleware/
│   │   └── auth.js               ← JWT verification
│   └── routes/
│       ├── authRoutes.js         ← Auth endpoints
│       └── serverRoutes.js       ← Server endpoints
├── prisma/
│   └── schema.prisma             ← Database schema
├── server.js                      ← Express app entry
├── package.json                   ← Dependencies
└── .env                           ← Configuration
```

### Database (PostgreSQL)
```
Database: lighth
├── users table
│   ├── id (PK)
│   ├── email (unique)
│   ├── username (unique)
│   ├── password (hashed)
│   ├── role (admin/user)
│   └── timestamps
└── servers table
    ├── id (PK)
    ├── name
    ├── uuid
    ├── ipAddress
    ├── port
    ├── memory (MB)
    ├── diskSpace (GB)
    ├── status
    ├── userId (FK)
    └── timestamps
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User enters email/password in LoginPage              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Frontend sends POST /api/auth/login                  │
│    Body: { email, password }                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Backend authController verifies credentials          │
│    - Find user by email                                 │
│    - Compare hashed password                            │
│    - Generate JWT token                                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Backend returns token + user data                    │
│    Response: { token, user }                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Frontend stores in localStorage                      │
│    - localStorage.setItem('authToken', token)           │
│    - localStorage.setItem('user', user)                 │
│    - Sets user state in AuthContext                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Frontend redirects to /dashboard                     │
│    ProtectedRoute checks token and shows Dashboard      │
└─────────────────────────────────────────────────────────┘
```

---

## 📡 Server Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Dashboard mounts, calls fetchServers()               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Frontend sends GET /api/servers                      │
│    Header: Authorization: Bearer <token>                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Backend authMiddleware verifies token                │
│    - Extract token from Authorization header            │
│    - Verify JWT signature                               │
│    - Attach user info to request                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Backend serverController queries database            │
│    - Query: SELECT * FROM servers WHERE userId = ?      │
│    - Prisma fetches from PostgreSQL                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Backend returns servers array                        │
│    Response: { message, servers: [...] }               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Frontend updates state: setServers(data.servers)     │
│    Dashboard renders server cards with real data        │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Quick Command Reference

### Backend Commands
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Initialize database
npx prisma migrate dev --name init

# Start development server
npm run dev

# View database GUI
npx prisma studio

# Build for production
npm run build
```

### Frontend Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing API with cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Get servers (replace TOKEN)
curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer TOKEN"

# Create server (replace TOKEN)
curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Server","ipAddress":"192.168.1.1","port":25565,"memory":4096,"diskSpace":100}'
```

---

## ✅ Integration Checklist

### Before Starting Integration
- [ ] PostgreSQL installed and running
- [ ] Backend `.env` file created with DATABASE_URL
- [ ] `npx prisma migrate dev --name init` completed
- [ ] Backend starts with `npm run dev` without errors
- [ ] Can register/login via API (test with cURL)

### During Frontend Integration
- [ ] Created `authService.js`
- [ ] Created `serverService.js`
- [ ] Created `AuthContext.jsx`
- [ ] Created `ProtectedRoute.jsx`
- [ ] Created `LoginPage.jsx`
- [ ] Created `RegisterPage.jsx`
- [ ] Updated `Dashboard.jsx` to use API
- [ ] Updated `App.jsx` with routing and AuthProvider

### After Integration
- [ ] Can register new user
- [ ] Can login with existing user
- [ ] Redirects to dashboard after login
- [ ] Dashboard displays real servers from database
- [ ] Can create new server
- [ ] Can update server
- [ ] Can delete server
- [ ] Token properly stored in localStorage
- [ ] Protected routes work (redirect to login if no token)

---

## 🚀 Next Steps After Integration

1. **Server Management Features**
   - Start/stop/restart server controls
   - Real-time status updates
   - Console log viewer
   - File manager

2. **User Management**
   - Profile settings
   - Password change
   - Two-factor authentication
   - API keys for automation

3. **Admin Dashboard**
   - User management
   - System statistics
   - Resource monitoring
   - Billing/plans

4. **Wings Daemon Integration**
   - Connect to Minecraft server daemon
   - Send start/stop commands
   - Stream server logs
   - Monitor resource usage

5. **Deployment**
   - Docker containerization
   - Deploy to cloud (AWS, DigitalOcean, etc.)
   - HTTPS/SSL setup
   - CI/CD pipeline

---

## 📖 Key Concepts Review

### JWT (JSON Web Tokens)
- Token-based authentication
- Token contains user info (id, email, username, role)
- Signed with secret key
- Expires after 7 days
- Sent in every protected request header

### Middleware
- Function that runs before route handler
- Can verify authentication
- Can modify request/response
- Allows code reuse across routes

### ORM (Prisma)
- Object-relational mapping
- Write queries in JavaScript instead of SQL
- Type-safe
- Automatic migrations

### CORS (Cross-Origin Resource Sharing)
- Allows frontend (different origin) to call backend
- Configured in `server.js`
- Matches frontend URL in `.env`

---

## 🆘 Common Issues & Solutions

### Frontend can't connect to backend
**Error:** `Failed to fetch` or `CORS error`
**Solution:** 
- Check backend is running on port 5000
- Verify CORS `FRONTEND_URL` in `.env` matches frontend URL
- Check firewall settings

### JWT token not working
**Error:** `Invalid or expired token`
**Solution:**
- Verify token is being sent in Authorization header
- Format should be: `Bearer <token>`
- Check JWT_SECRET matches in frontend/backend

### Database connection fails
**Error:** `database connection refused`
**Solution:**
- Start PostgreSQL service
- Verify DATABASE_URL in `.env`
- Check database name exists: `createdb lighth`

### Can't find module
**Error:** `Cannot find module 'express'`
**Solution:**
- Run `npm install`
- Check node_modules folder exists
- Delete node_modules and reinstall if needed

---

## 📞 Architecture Support

Need help? Check in this order:
1. **Backend SETUP.md** - For backend configuration issues
2. **Frontend INTEGRATION.md** - For frontend setup
3. **Backend console logs** - For API errors
4. **Browser console** - For frontend errors
5. **PostgreSQL logs** - For database issues

---

## 🎓 Learning Resources

- **Express.js**: https://expressjs.com
- **Prisma ORM**: https://www.prisma.io
- **JWT**: https://jwt.io
- **React Context**: https://react.dev/reference/react/useContext
- **REST API**: https://restfulapi.net

---

## Summary

You now have a **complete, production-ready architecture** for your Minecraft hosting platform:

1. ✅ Beautiful responsive UI (Dashboard)
2. ✅ Secure backend API (Express + JWT)
3. ✅ Persistent data storage (PostgreSQL)
4. ✅ User authentication system
5. ✅ CRUD operations for servers
6. ✅ Protected routes and data isolation

**The last step is connecting them together using the Frontend Integration guide.**

Good luck! 🚀
