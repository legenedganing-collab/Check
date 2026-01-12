# 🎮 Live Console Feature - Complete Implementation Guide

## Overview

The **Live Console** is a professional-grade server management interface that transforms Lighth from a basic control panel into a production-ready hosting platform (like Pterodactyl, AWS, or DigitalOcean).

**Architecture:**
- **Frontend:** xterm.js (same engine as VS Code terminal)
- **Protocol:** Socket.io WebSocket for real-time streaming
- **Backend:** Docker container stream attachment
- **Security:** JWT authentication on all connections

---

## 🔧 Installation & Setup

### 1. Install Dependencies

The packages have already been added to `package.json`:

**Backend:**
```bash
cd backend
npm install
# Installs: socket.io, dockerode
```

**Frontend:**
```bash
npm install
# Installs: xterm, xterm-addon-fit, socket.io-client
```

### 2. Environment Variables

Add these to your `.env` files:

**`backend/.env`:**
```bash
# Required for Socket.io
SOCKET_PORT=3002
FRONTEND_URL=http://localhost:5173

# Optional
DOCKER_SOCKET=/var/run/docker.sock
LIGHTH_DATA_PATH=/var/lib/lighth/data
```

**`frontend/.env`:**
```bash
# Optional - defaults to http://localhost:3002
REACT_APP_SOCKET_URL=http://localhost:3002
REACT_APP_API_URL=http://localhost:3002
```

### 3. Start the Servers

**Backend (with WebSocket support):**
```bash
cd backend
npm start
# Now runs on both HTTP (port 3002) and WebSocket (port 3002)
```

**Frontend:**
```bash
npm run dev
# Runs on http://localhost:5173
```

---

## 📡 How It Works: The WebSocket "Pipe"

### Connection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ServerManager.jsx (Page)                                  │  │
│  │  ├─ ServerControls.jsx (Power buttons)                   │  │
│  │  │   └─ REST API: /api/servers/:id/power                │  │
│  │  └─ ServerConsole.jsx (Terminal with xterm.js)          │  │
│  │      └─ WebSocket: socket.io connection                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                    WebSocket (port 3002)
                             │
┌────────────────────────────┴──────────────────────────────────────┐
│                         BACKEND SERVER                             │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ lib/socket.js (WebSocket Handler)                        │   │
│  │  ├─ Authentication: Verify JWT token                     │   │
│  │  ├─ Get container name from database                     │   │
│  │  ├─ Attach to Docker stream                             │   │
│  │  └─ Bi-directional streaming                            │   │
│  └───────────────────────────────────────────────────────────┘   │
│                             │                                      │
│                    Docker Socket API                             │
│                             │                                      │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ Docker Daemon (container stream)                          │   │
│  │  └─ Container stdout + stderr + stdin                    │   │
│  └───────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

### Step-by-Step

**1. User Opens Console (Frontend → Backend)**
```javascript
// ServerConsole.jsx
const socket = io('http://localhost:3002', {
  auth: { token: 'JWT_TOKEN_HERE' },
  query: { serverId: '1' }
});
```

**2. Backend Authenticates (Backend)**
```javascript
// lib/socket.js middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded;
    next();
  });
});
```

**3. Backend Attaches to Container (Backend)**
```javascript
// lib/socket.js connection handler
const container = docker.getContainer(containerName);
container.attach({
  stream: true,
  stdout: true,
  stderr: true,
  stdin: true
}, (err, dockerStream) => {
  // dockerStream now has LIVE access to container I/O
});
```

**4. Container Output → Frontend (Real-time)**
```javascript
// Docker sends data → Backend → Frontend
dockerStream.on('data', (chunk) => {
  socket.emit('console-output', chunk.toString('utf-8'));
});

// Frontend receives
socket.on('console-output', (data) => {
  term.write(data); // xterm.js renders it
});
```

**5. User Sends Command (Frontend → Backend → Container)**
```javascript
// User types in terminal
term.onData((input) => {
  socket.emit('console-input', input);
});

// Backend receives and writes to container
socket.on('console-input', (command) => {
  dockerStream.write(command);
});

// Container echoes back → cycle repeats
```

---

## 🚀 Features

### 1. Real-Time Console Streaming

The console displays **live output** from the Docker container as it happens.

```
🟢 Connected to server console...
Server: Survival SMP | Port: 25565 | Status: running

[12:34:56] [Server thread/INFO]: Starting minecraft server version 1.20.1
[12:34:57] [Server thread/INFO]: Loading properties
[12:34:58] [Server thread/INFO]: Default game type: SURVIVAL
[12:34:59] [Server thread/INFO]: Difficulty set to 3 (HARD)
[12:35:00] [Server thread/INFO]: Generating keypair
[12:35:02] [Server thread/INFO]: Starting Minecraft server on *:25565
[12:35:03] [Server thread/INFO]: Using epoll channel type
[12:35:04] [Server thread/INFO]: [RCON] Running in threaded mode
```

### 2. Full Terminal Emulation

The terminal supports:
- **Colors & Formatting** - Server logs with colors render correctly
- **Scrollback** - 1000 lines of history
- **Resizing** - Terminal auto-fits to window
- **Input** - Full keyboard support (arrows, backspace, etc)
- **Cursor** - Blinking cursor with visual feedback

### 3. Power Controls

**Buttons above the console:**

| Button | Action | Status | Effect |
|--------|--------|--------|--------|
| **Start** | `start` | Only when offline | Starts container via Docker |
| **Restart** | `restart` | Only when online | Graceful restart |
| **Stop** | `stop` | Only when online | Saves world, then stops (SIGTERM) |
| **Kill** | `kill` | Always (with confirm) | Force stop, no save (SIGKILL) |

Each button updates the server status in real-time.

### 4. Resource Monitoring

**Sidebar shows live stats:**
- **CPU Load** - Percentage used by container
- **Memory** - RAM usage (updated every 2 seconds)
- **Disk** - World file size
- **Uptime** - Seconds since server started
- **Console Status** - Connected/Disconnected indicator

### 5. Server Information

**Header displays:**
- Server name
- Server UUID
- IP address + port
- Allocated resources (RAM, storage)
- Current status indicator

---

## 🔌 File Structure

```
backend/
├── lib/
│   ├── socket.js (NEW) ← WebSocket handler
│   ├── dockerProvisioner.js
│   └── provisioning.js
├── src/
│   ├── controllers/
│   │   └── serverController.js (UPDATED - added powerControl)
│   ├── routes/
│   │   └── serverRoutes.js (UPDATED - added /power endpoint)
│   └── middleware/
│       └── auth.js
└── server.js (UPDATED - now runs HTTP + WebSocket)

src/
├── pages/
│   └── ServerManager.jsx (NEW) ← Main management page
├── components/
│   ├── ServerConsole.jsx (NEW) ← Terminal with xterm.js
│   ├── ServerControls.jsx (NEW) ← Power buttons
│   └── Dashboard.jsx
└── index.css
```

---

## 📡 API Reference

### Power Control Endpoint

**Endpoint:** `POST /api/servers/:id/power`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "start" | "stop" | "restart" | "kill"
}
```

**Response:**
```json
{
  "message": "Server start command executed successfully",
  "status": "online",
  "server": {
    "id": 1,
    "name": "Survival SMP",
    "status": "online"
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/servers/1/power', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ action: 'restart' })
});
```

### WebSocket Events

**Frontend → Backend:**
```javascript
// Send command to server
socket.emit('console-input', 'say Hello everyone!');

// Or for raw input (including newlines)
socket.emit('console-input', 'stop\n');
```

**Backend → Frontend:**
```javascript
// Receive console output
socket.on('console-output', (data) => {
  console.log(data); // Raw terminal output
});

// Connection errors
socket.on('console-error', (message) => {
  console.error(message);
});

// Connection status
socket.on('connect', () => { /* connected */ });
socket.on('disconnect', () => { /* disconnected */ });
```

---

## 🔐 Security

### 1. JWT Authentication

Every WebSocket connection requires a valid JWT token:

```javascript
// Connection rejected without token
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded;
    next();
  });
});
```

### 2. Server Ownership Verification

Backend verifies the user owns the server before attaching:

```javascript
const server = await prisma.server.findFirst({
  where: {
    id: parseInt(serverId),
    userId: userId  // ← Ensures ownership
  }
});

if (!server) {
  socket.emit('console-error', 'Server not found or access denied');
  socket.disconnect();
}
```

### 3. Kill Confirmation Dialog

The Kill button requires user confirmation:

```javascript
if (window.confirm('⚠️ DANGER: Force killing will NOT save world data!\n\nThis may cause corruption. Are you sure?')) {
  sendPowerAction('kill');
}
```

### 4. CORS Protection

Socket.io CORS is restricted to frontend origin:

```javascript
const io = socketIo(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

## 🐛 Troubleshooting

### Issue: "Console disconnected" immediately after connecting

**Causes:**
1. Docker container not running
2. Container name mismatch
3. Docker socket not accessible

**Fix:**
```bash
# Check if container is running
docker ps | grep mc-

# Verify Docker socket permissions
ls -la /var/run/docker.sock
# Should be readable by your Node.js process

# Check backend logs for container name
npm start
# Look for: "[Console] Attempting to attach to container: mc-1-..."
```

### Issue: Commands not being sent to server

**Causes:**
1. Stream is in "destroyed" state
2. Container stopped while connected
3. Network lag

**Fix:**
```javascript
// ServerConsole.jsx - check if stream is healthy
socket.on('console-input', (input) => {
  if (dockerStream && !dockerStream.destroyed) {
    dockerStream.write(input);
  }
});
```

### Issue: "Authentication error" when connecting

**Causes:**
1. Token is invalid or expired
2. JWT_SECRET mismatch between backend and frontend
3. Token not being sent

**Fix:**
```javascript
// Make sure token is stored and sent
const token = localStorage.getItem('token');
console.log('Token:', token); // Debug

const socket = io('http://localhost:3002', {
  auth: { token: token } // ← Must be included
});
```

---

## 🎯 Next Steps

### Features to Add:

1. **Tab auto-complete** for Minecraft commands
   ```javascript
   // Listen for Tab key
   term.onKey(event => {
     if (event.key === '\t') {
       // Emit auto-complete request
     }
   });
   ```

2. **Command history** (Up/Down arrows)
   ```javascript
   let commandHistory = [];
   let historyIndex = 0;
   ```

3. **Log downloading** (export console to file)
   ```javascript
   const downloadLogs = () => {
     const logs = term.buffer.active.getLine(0); // Get all lines
     // Create downloadable file
   };
   ```

4. **Server metrics** (graph CPU/memory over time)
   ```javascript
   // Use Chart.js or Recharts
   <LineChart data={stats} />
   ```

5. **Multiple console tabs** (manage multiple servers side-by-side)
   ```javascript
   <ServerTabs>
     <Tab serverId={1} />
     <Tab serverId={2} />
   </ServerTabs>
   ```

---

## 📚 Code Examples

### Example 1: Send a Broadcast Message

```javascript
// In ServerConsole component
const sendBroadcast = () => {
  const message = prompt("Broadcast message:");
  if (message) {
    socket.emit('console-input', `say ${message}\n`);
  }
};
```

### Example 2: Automatic Server Restart at Scheduled Time

```javascript
// In ServerManager component
useEffect(() => {
  const checkSchedule = setInterval(() => {
    const now = new Date().getHours();
    if (now === 3) { // 3 AM daily restart
      sendPowerAction('restart');
    }
  }, 60000); // Check every minute

  return () => clearInterval(checkSchedule);
}, []);
```

### Example 3: Custom Command Shortcuts

```javascript
// Create quick command buttons
const CommandShortcuts = () => {
  const commands = [
    { label: 'List Players', cmd: 'list\n' },
    { label: 'Weather Off', cmd: 'weather clear\n' },
    { label: 'Time Set Day', cmd: 'time set day\n' },
  ];

  return (
    <div className="flex gap-2">
      {commands.map(({ label, cmd }) => (
        <button
          key={cmd}
          onClick={() => socket.emit('console-input', cmd)}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm"
        >
          {label}
        </button>
      ))}
    </div>
  );
};
```

---

## ✅ Testing Checklist

- [ ] Backend starts with HTTP + WebSocket on port 3002
- [ ] Frontend connects to `http://localhost:3002`
- [ ] Can see live console output
- [ ] Can type commands and see server response
- [ ] Start button works when server is offline
- [ ] Stop button works when server is online
- [ ] Restart button works
- [ ] Kill button shows confirmation
- [ ] Server status updates after power action
- [ ] Console reconnects if connection drops
- [ ] Sidebar stats update in real-time
- [ ] Can navigate away and back without issues
- [ ] JWT auth prevents unauthorized access
- [ ] Mobile/tablet responsive design works

---

## 🎓 Learning Resources

- **xterm.js Docs:** https://xtermjs.org/
- **Socket.io Docs:** https://socket.io/docs/
- **Docker Streams:** https://docs.docker.com/engine/api/v1.41/#tag/Container/operation/ContainerAttach
- **React Hooks:** https://react.dev/reference/react/hooks

---

**The Live Console transforms Lighth into a professional server hosting platform.** 🚀

Now your users have **complete control** over their servers - just like using a real VPS or dedicated hosting provider!
