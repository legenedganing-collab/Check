# 🎮 Live Console - Quick Reference & Examples

## Quick Start (5 Minutes)

### 1. Start Backend
```bash
cd backend
npm start
# Output: 🚀 HTTP Server: http://localhost:3002
#         🔌 WebSocket Server: ws://localhost:3002
```

### 2. Start Frontend
```bash
npm run dev
# Runs on http://localhost:5173
```

### 3. Navigate to Server Manager
```
http://localhost:5173/server/1
# (Replace '1' with actual server ID)
```

### 4. See the Console
- Live terminal with server output
- Power buttons (Start/Stop/Restart/Kill)
- Resource monitoring sidebar

---

## Common Tasks

### How to Send Commands to the Server

**Option A: Type directly in terminal**
```
Type in the xterm console, press Enter
Example: say Hello everyone!
```

**Option B: Programmatically**
```javascript
// Send command from React component
const sendCommand = (cmd) => {
  socket.emit('console-input', cmd + '\n');
};

// Usage
sendCommand('save-all');
sendCommand('weather clear');
sendCommand('time set day');
```

### How to Parse Console Output

```javascript
// Receive raw output
socket.on('console-output', (data) => {
  // Data is raw string from Docker
  console.log(data);
  
  // Parse player joins
  if (data.includes('joined the game')) {
    const player = data.match(/(\w+) joined the game/)[1];
    console.log(`${player} joined!`);
  }
  
  // Parse player quits
  if (data.includes('left the game')) {
    const player = data.match(/(\w+) left the game/)[1];
    console.log(`${player} left!`);
  }
});
```

### How to Monitor Server Status

```javascript
// The power control automatically updates status
const sendPowerAction = async (action) => {
  const response = await fetch(`/api/servers/${serverId}/power`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ action })
  });
  
  const data = await response.json();
  console.log('New status:', data.status); // 'online', 'offline', 'provisioning'
};
```

---

## Advanced Patterns

### Pattern 1: Auto-Save on Interval

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    socket.emit('console-input', 'save-all\n');
  }, 5 * 60 * 1000); // Every 5 minutes
  
  return () => clearInterval(interval);
}, []);
```

### Pattern 2: Player Count Tracker

```javascript
const [playerCount, setPlayerCount] = useState(0);

useEffect(() => {
  socket.on('console-output', (data) => {
    // Watch for player count in logs
    const match = data.match(/There are (\d+) of a max of \d+ players online/);
    if (match) {
      setPlayerCount(parseInt(match[1]));
    }
  });
}, []);

return <div>Players Online: {playerCount}</div>;
```

### Pattern 3: Backup on Shutdown

```javascript
const handleShutdown = async () => {
  // Send save command
  socket.emit('console-input', 'save-all\n');
  
  // Wait for save
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create backup
  const backup = await createBackup(serverId);
  console.log('Backup created:', backup.id);
  
  // Stop server
  sendPowerAction('stop');
};
```

### Pattern 4: Command Queue

```javascript
class ServerCommandQueue {
  constructor(socket) {
    this.socket = socket;
    this.queue = [];
    this.processing = false;
  }
  
  enqueue(command) {
    this.queue.push(command);
    this.process();
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const command = this.queue.shift();
    
    this.socket.emit('console-input', command + '\n');
    
    // Wait before next command
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.processing = false;
    this.process();
  }
}

// Usage
const cmdQueue = new ServerCommandQueue(socket);
cmdQueue.enqueue('weather clear');
cmdQueue.enqueue('time set day');
cmdQueue.enqueue('say Good morning!');
```

---

## Docker Container Commands Reference

### Get Container Status

```bash
# List all running Minecraft containers
docker ps | grep mc-

# Get container info
docker inspect mc-1-survival-smp

# View container logs
docker logs mc-1-survival-smp

# Monitor container resources
docker stats mc-1-survival-smp
```

### Manual Container Management

```bash
# Start container
docker start mc-1-survival-smp

# Stop container (graceful)
docker stop mc-1-survival-smp

# Kill container (force)
docker kill mc-1-survival-smp

# Restart container
docker restart mc-1-survival-smp

# Remove container
docker rm mc-1-survival-smp
```

---

## Minecraft Server Commands (In Console)

### Player Management
```
list                           # Show online players
tell <player> <message>       # Send private message
kick <player> [reason]        # Kick player
ban <player> [reason]         # Ban player
op <player>                   # Give admin
deop <player>                 # Remove admin
```

### World Management
```
save-all                       # Save world
save-off                       # Disable auto-save
save-on                        # Enable auto-save
reload                         # Reload config
```

### Game Settings
```
weather <clear|rain|thunder>  # Change weather
time set <day|night|0-24000>  # Set time
difficulty <0-3>              # Set difficulty (0=peaceful, 3=hard)
gamemode <survival|creative>  # Change game mode
```

### Performance
```
stop                           # Graceful shutdown
debug report                   # Generate debug info
forge tps                      # Show TPS (with Forge)
```

---

## Event Flow Diagram

```
User Types: "say hello"
    ↓
term.onData() in ServerConsole.jsx
    ↓
socket.emit('console-input', 'say hello')
    ↓
Backend io.on('console-input', ...) in lib/socket.js
    ↓
dockerStream.write('say hello')
    ↓
Minecraft Server receives input
    ↓
Server echoes output to stdout
    ↓
dockerStream.on('data', chunk) catches output
    ↓
socket.emit('console-output', chunk.toString())
    ↓
Frontend socket.on('console-output', data)
    ↓
term.write(data)
    ↓
xterm.js renders: "[12:34:56] say hello"
    ↓
User sees text in terminal ✅
```

---

## Performance Tips

### 1. Limit Console Scrollback
```javascript
const term = new Terminal({
  scrollback: 500  // Reduce from 1000 for lower memory
});
```

### 2. Batch Console Writes
```javascript
// Bad: Writes every character separately
socket.on('console-output', (char) => term.write(char));

// Good: Writes complete lines
let buffer = '';
socket.on('console-output', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line
  lines.forEach(line => term.writeln(line));
});
```

### 3. Debounce Status Updates
```javascript
const updateStatus = useCallback(
  debounce((newStatus) => setStatus(newStatus), 500),
  []
);

socket.on('console-output', (data) => {
  updateStatus(/* parse status from data */);
});
```

---

## Error Handling Examples

### Handle Network Reconnection

```javascript
const socket = io('http://localhost:3002', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('reconnect', () => {
  term.write('\r\n🟢 Reconnected to console\r\n');
});

socket.on('reconnect_failed', () => {
  term.write('\r\n🔴 Failed to reconnect. Please refresh.\r\n');
});
```

### Handle Container Errors

```javascript
// Backend - lib/socket.js
dockerStream.on('error', (error) => {
  console.error('[Docker] Stream error:', error.message);
  socket.emit('console-error', `Docker error: ${error.message}`);
  
  if (dockerStream) {
    dockerStream.end();
  }
});

// Frontend
socket.on('console-error', (message) => {
  toast.error(message);
  term.write(`\r\n🔴 ${message}\r\n`);
});
```

---

## Integration with Existing Components

### Add Console Tab to Dashboard

```javascript
// pages/Dashboard.jsx
import ServerConsole from '../components/ServerConsole';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('servers');
  
  return (
    <>
      <Tabs>
        <Tab name="servers">
          <ServerList />
        </Tab>
        <Tab name="console">
          <ServerConsole serverId={selectedServerId} />
        </Tab>
      </Tabs>
    </>
  );
}
```

### Add to Existing Server Card

```javascript
// components/ServerCard.jsx
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ServerCard({ server }) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-700">
      <h3>{server.name}</h3>
      <button
        onClick={() => navigate(`/server/${server.id}`)}
        className="mt-4 flex items-center px-4 py-2 bg-emerald-600 text-white rounded"
      >
        Manage Console
        <ChevronRight size={16} className="ml-2" />
      </button>
    </div>
  );
}
```

---

## Debugging

### Enable Verbose Logging

**Frontend:**
```javascript
// In ServerConsole.jsx
socket.onAny((event, ...args) => {
  console.log(`[Socket] ${event}`, args);
});
```

**Backend:**
```javascript
// In lib/socket.js
io.on('connection', (socket) => {
  console.log('[Socket.io] Client connected:', socket.id);
  
  socket.on('console-input', (data) => {
    console.log('[Socket.io] Input received:', JSON.stringify(data));
  });
});
```

### Network Monitoring

```bash
# Monitor WebSocket traffic
# Open browser DevTools → Network tab
# Filter by "WS" (WebSocket)
# Click on connection to see messages
```

### Check Docker Connection

```bash
# Backend
node -e "
const Docker = require('dockerode');
const docker = new Docker();
docker.getInfo().then(info => {
  console.log('✅ Docker connected:', info.Containers, 'containers');
}).catch(err => {
  console.error('❌ Docker error:', err.message);
});
"
```

---

## Security Checklist

- [x] JWT token required for WebSocket connection
- [x] Server ownership verified before attaching console
- [x] Kill action requires user confirmation
- [x] CORS restricted to frontend origin
- [x] Token validated on every connection
- [x] Container name matches expected pattern
- [x] Docker socket restricted to Node.js process
- [x] No credentials logged in console output
- [x] Errors don't leak internal paths
- [x] Rate limiting on power commands (optional)

---

## Frequently Asked Questions

**Q: Why does the console show double characters?**
A: xterm.js is showing your local input + server echo. This is correct behavior for a terminal. Disable "local echo" if you don't want this:
```javascript
term.onData((input) => {
  // Don't write locally - let server echo
  socket.emit('console-input', input);
});
```

**Q: Can I customize the terminal colors?**
A: Yes, in `ServerConsole.jsx`:
```javascript
const term = new Terminal({
  theme: {
    background: '#000000',
    foreground: '#00FF00',
    cursor: '#00FF00'
  }
});
```

**Q: What happens if Docker container crashes?**
A: The console will show the error and disconnect. User can restart via the Start button.

**Q: Can multiple users view the same console?**
A: Currently each user gets their own connection. For shared viewing, you'd need to broadcast messages to all connected sockets:
```javascript
io.emit('console-output', data); // Broadcast to all
```

---

## What's Next?

1. **Add command auto-complete** based on server type
2. **Create log filters** (show only errors, player events, etc)
3. **Add server metrics** (Graph CPU/RAM/Disk over time)
4. **Implement scheduled tasks** (auto-restart, backups, etc)
5. **Add player online list** (parsing from console)
6. **Create webhook integrations** (Discord alerts, etc)

---

**Happy managing! 🎮** Your users now have a professional-grade server control panel! 🚀
