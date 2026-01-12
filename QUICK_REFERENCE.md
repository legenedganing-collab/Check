# ⚡ Quick Reference Card

## 🚀 Start Everything (Copy & Paste)

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
**Expected:** `🚀 Lighth Backend Server is running on http://localhost:5000`

### Terminal 2 - Frontend
```bash
npm run dev
```
**Expected:** `VITE ... ready in ... ms`

### Open Browser
```
http://localhost:5173
```

---

## 🔑 Test Credentials

### Quick User for Testing
```
Email: test@lighth.com
Password: TestPass123
Username: testuser
```

Register via API:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lighth.com","username":"testuser","password":"TestPass123"}'
```

---

## 📡 API Endpoints Cheat Sheet

| Method | Endpoint | Protected | Purpose |
|--------|----------|-----------|---------|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Get JWT token |
| GET | `/api/servers` | ✅ | List your servers |
| POST | `/api/servers` | ✅ | Create server |
| GET | `/api/servers/:id` | ✅ | Get server details |
| PUT | `/api/servers/:id` | ✅ | Update server |
| DELETE | `/api/servers/:id` | ✅ | Delete server |
| GET | `/api/health` | ❌ | Health check |

**Note:** Protected endpoints require: `Authorization: Bearer <token>`

---

## 🔐 How to Get a Token

### 1. Register (Creates User + Returns Token)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "username": "yourname",
    "password": "SecurePass123"
  }'
```

Response includes `token` → Copy and save it!

### 2. Or Login (Returns Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"SecurePass123"}'
```

---

## 🧪 Copy-Paste Test Commands

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Create Server (Replace TOKEN)
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X POST http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"My Server",
    "ipAddress":"192.168.1.100",
    "port":25565,
    "memory":4096,
    "diskSpace":100
  }'
```

### Get All Servers (Replace TOKEN)
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X GET http://localhost:5000/api/servers \
  -H "Authorization: Bearer $TOKEN"
```

### Update Server (Replace TOKEN and ID)
```bash
TOKEN="YOUR_TOKEN_HERE"
SERVER_ID=1

curl -X PUT http://localhost:5000/api/servers/$SERVER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","memory":6144}'
```

### Delete Server (Replace TOKEN and ID)
```bash
TOKEN="YOUR_TOKEN_HERE"
SERVER_ID=1

curl -X DELETE http://localhost:5000/api/servers/$SERVER_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 Environment Setup

### Backend `.env` File
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lighth?schema=public"
JWT_SECRET="super_secret_key_change_in_production"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Generate Secure JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ Database Useful Commands

### Connect to Database
```bash
psql -d lighth
```

### View Tables
```bash
\dt
```

### View Users
```bash
SELECT * FROM users;
```

### View Servers
```bash
SELECT * FROM servers;
```

### Exit
```bash
\q
```

### View All Data
```bash
SELECT 'Users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'Servers', COUNT(*) FROM servers;
```

---

## 🐛 Common Errors & Quick Fixes

### "DATABASE_URL not set"
```bash
# Make sure .env exists in /backend
# And has DATABASE_URL="postgresql://..."
```

### "Port 5000 already in use"
```bash
# Kill the process
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env
PORT=5001
```

### "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### CORS Error
```bash
# Update FRONTEND_URL in backend/.env
# to match your frontend URL
FRONTEND_URL=http://localhost:5173
```

### "JWT_SECRET is not defined"
```bash
# Add to backend/.env:
JWT_SECRET="your_secret_here"
```

---

## 📚 Quick Links to Docs

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Project overview |
| [BACKEND_SETUP.md](./backend/BACKEND_SETUP.md) | Backend configuration & API reference |
| [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) | Connect frontend to backend |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | System design & architecture |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Complete API testing guide |

---

## ✅ Pre-Integration Checklist

- [ ] Backend running on `http://localhost:5000`
- [ ] Can register user (get token)
- [ ] Can login user (get token)
- [ ] Can create server with token
- [ ] Can get servers list with token
- [ ] Frontend running on `http://localhost:5173`
- [ ] PostgreSQL running and database created

---

## 🎯 Next Immediate Step

**Follow this file:** [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)

It will walk you through:
1. Creating auth services
2. Building login/register pages
3. Connecting dashboard to real API
4. Making it all work together

---

## 💡 Remember

- **JWT Token expires in 7 days** - Keep it in localStorage
- **Token is in Authorization header** - Must be `Bearer <token>`
- **Only see your own servers** - Users have data isolation
- **Backend validates everything** - Frontend can't bypass security
- **Passwords are hashed** - Never stored as plain text

---

## 🆘 Need Help?

1. **Backend issue?** → Check [BACKEND_SETUP.md](./backend/BACKEND_SETUP.md)
2. **Testing API?** → Use [TESTING_GUIDE.md](./TESTING_GUIDE.md)
3. **Frontend issue?** → Follow [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
4. **Architecture question?** → See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

---

**Good luck! You've got this! 🚀**
