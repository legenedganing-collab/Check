# 🚀 Live Console - Getting Started Checklist

## Pre-Setup (5 min)

- [ ] Read `LIVE_CONSOLE_IMPLEMENTATION_SUMMARY.md` for overview
- [ ] Review `LIVE_CONSOLE_VISUAL_GUIDE.md` for UI design
- [ ] Check that Docker is installed: `docker --version`
- [ ] Check that Node.js is installed: `node --version` (need 14+)

---

## Installation (10 min)

### Backend Setup

- [ ] Navigate to backend: `cd backend`
- [ ] Install dependencies: `npm install`
- [ ] Verify packages added:
  - [ ] `socket.io@^4.7.2`
  - [ ] `dockerode@^4.0.0`
- [ ] Check `.env` has required variables:
  - [ ] `DATABASE_URL` (set)
  - [ ] `JWT_SECRET` (set)
  - [ ] `SOCKET_PORT=3002` (new)
  - [ ] `FRONTEND_URL=http://localhost:5173` (new)

### Frontend Setup

- [ ] Navigate to frontend: `cd ..`
- [ ] Install dependencies: `npm install`
- [ ] Verify packages added:
  - [ ] `xterm@^5.3.0`
  - [ ] `xterm-addon-fit@^0.8.0`
  - [ ] `socket.io-client@^4.7.2`

### Docker Verification

- [ ] Docker daemon running: `docker ps`
- [ ] Docker socket exists: `ls -la /var/run/docker.sock`
- [ ] Current user can access Docker: `docker ps` (no sudo needed)
  - If fails, run: `sudo usermod -aG docker $USER` and logout/login

---

## Server Startup (5 min)

### Terminal 1: Backend

- [ ] `cd backend`
- [ ] `npm start`
- [ ] Wait for: `🚀 HTTP Server: http://localhost:3002`
- [ ] Check console for:
  - [ ] ✅ Database connected
  - [ ] ✅ Socket.io initialized
  - [ ] ✅ No errors in logs

### Terminal 2: Frontend

- [ ] `cd ..` (root project)
- [ ] `npm run dev`
- [ ] Wait for: `Local: http://localhost:5173/`
- [ ] Browser should auto-open or navigate there

---

## First Test (5 min)

### Authentication Check

- [ ] Log in with test account
- [ ] Open browser DevTools (F12)
- [ ] Check Application → Local Storage
- [ ] Verify `token` key exists with JWT value

### Navigate to Server Manager

- [ ] Click on a server (or navigate to `/server/1`)
- [ ] Should load with:
  - [ ] Server name displayed
  - [ ] Power buttons visible
  - [ ] Empty console area
  - [ ] Stats sidebar showing

### Check Console Logs

**Browser Console (DevTools)**
- [ ] No red errors
- [ ] Should see: `[Console] Connecting to WebSocket...`
- [ ] Should see: `[Socket] connect`

**Backend Logs**
- [ ] Should see: `[Socket Auth] ✅ User ... authenticated`
- [ ] Should see: `[Console] 🔌 User ... connected`
- [ ] Should see: `[Console] ✅ Container found`

### Test WebSocket Connection

- [ ] In browser console, type: `document.querySelector('[role="tabpanel"]')`
- [ ] In browser Network tab (WS filter)
- [ ] Should see WebSocket connection to `localhost:3002`
- [ ] Connection should show "101 Switching Protocols"

---

## Feature Testing (15 min)

### Live Console Test

- [ ] Type in terminal: `help`
- [ ] Should see command echoed: `help`
- [ ] Should see server response below
- [ ] Try another command: `list`
- [ ] Try: `say Hello World`
- [ ] Should see: `[Server thread/INFO]: say Hello World`

### Power Controls Test

#### Start Button (if server offline)
- [ ] Click "Start"
- [ ] Should see loading spinner
- [ ] Should see toast: "✅ Server starting..."
- [ ] Button should become disabled
- [ ] Status indicator should turn 🟢 green
- [ ] Console should show startup logs

#### Stop Button (if server online)
- [ ] Click "Stop"
- [ ] Should see loading spinner
- [ ] Should see toast: "⏹️ Server stopping gracefully..."
- [ ] Should see "save-all" in console
- [ ] Server should shut down cleanly
- [ ] Status should become 🔴 red

#### Restart Button
- [ ] Click "Restart"
- [ ] Should see loading spinner
- [ ] Console should show shutdown then startup logs
- [ ] Status should stay 🟢 green

#### Kill Button
- [ ] Click "Kill"
- [ ] Should see confirmation dialog: "⚠️ DANGER: Force killing..."
- [ ] Click "Cancel" → nothing happens
- [ ] Click again, click "OK"
- [ ] Should see "☠ Server force killed" toast
- [ ] Server stops immediately (no save)
- [ ] Status becomes 🔴 red

### Resource Stats Test

- [ ] Check CPU shows a percentage
- [ ] Check Memory shows "X / Y GB"
- [ ] Check Disk shows "Z MB"
- [ ] Check Uptime shows "Xh Ym"
- [ ] Check Console Status shows 🟢 Connected or 🔴 Disconnected
- [ ] Stats should update every 2 seconds

### Mobile Responsive Test

- [ ] Open DevTools → Toggle device toolbar
- [ ] Try iPhone 12 view:
  - [ ] Console full width
  - [ ] Stats stack below
  - [ ] All buttons still visible
  - [ ] Scroll works smoothly
- [ ] Try tablet view (iPad):
  - [ ] Stats in 2-column layout
  - [ ] Console still readable

---

## Error Handling Tests (10 min)

### Docker Connection Error

- [ ] Stop Docker: `docker stop $(docker ps -q)` or `sudo systemctl stop docker`
- [ ] Refresh browser
- [ ] Should see error: "🔴 Error: Could not attach to server"
- [ ] Start Docker again: `sudo systemctl start docker`
- [ ] Refresh browser
- [ ] Should reconnect automatically
- [ ] Check reconnection attempts in Network tab

### Network Loss Simulation

- [ ] Open DevTools → Network tab
- [ ] Click throttling dropdown → Select "Offline"
- [ ] Console should show: "🔴 Console disconnected"
- [ ] Try typing → Should show warning
- [ ] Click throttling dropdown → Select "Online"
- [ ] Should reconnect and show: "🟢 Connected to server console"

### Invalid Token Test

- [ ] Open DevTools → Application → Local Storage
- [ ] Delete `token` entry
- [ ] Refresh page → Login again
- [ ] Should work normally (login creates new token)

### Unauthorized Access Test

- [ ] Get another user's server ID
- [ ] Navigate to `/server/{other-user-id}`
- [ ] Should either:
  - [ ] Get 404 error, OR
  - [ ] Console shows: "🔴 Server not found or access denied"
  - [ ] WebSocket disconnects

---

## Performance Testing (5 min)

### CPU & Memory Check

- [ ] Open DevTools → Performance tab
- [ ] Start recording
- [ ] Type in console multiple times
- [ ] Stop recording
- [ ] Check:
  - [ ] FPS stays above 50 (smooth)
  - [ ] Memory doesn't spike

### Network Traffic

- [ ] Open DevTools → Network tab (WS filter)
- [ ] Type command
- [ ] Should see 2 messages:
  - [ ] `console-input` (your command)
  - [ ] `console-output` (response)
- [ ] Latency should be <200ms

### Log Scrolling

- [ ] Restart server (lots of logs)
- [ ] Scroll up/down in console
- [ ] Should be smooth (60 FPS)
- [ ] Terminal buffer should handle 1000+ lines

---

## Documentation Review (5 min)

- [ ] Read `LIVE_CONSOLE_SETUP.md` for deployment info
- [ ] Read `LIVE_CONSOLE_QUICK_REFERENCE.md` for examples
- [ ] Bookmark these files for future reference
- [ ] Share links with team members

---

## Troubleshooting Guide

### Issue: "WebSocket connection failed"

1. Check backend is running: `curl http://localhost:3002`
2. Check port 3002 is available: `lsof -i :3002`
3. Check CORS is correct in backend: `FRONTEND_URL=http://localhost:5173`
4. Restart backend: `npm start`

### Issue: "Container not found"

1. Check container exists: `docker ps | grep mc-`
2. Check container name format: `mc-{id}-{name}`
3. Check server ID is correct
4. Check database has the server: `npx prisma studio`

### Issue: "Authentication error"

1. Check token in LocalStorage: Press F12 → Application → Local Storage
2. Check token is valid: Try logging out and back in
3. Check JWT_SECRET matches: `echo $JWT_SECRET`
4. Check token sent with request: DevTools → Network → WS

### Issue: "Docker socket permission denied"

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Activate the group (logout/login recommended)
newgrp docker

# Verify
docker ps  # Should work without sudo
```

---

## Next Steps After Testing

### If Everything Works ✅

1. [ ] Review `LIVE_CONSOLE_IMPLEMENTATION_SUMMARY.md` for upgrade ideas
2. [ ] Plan Phase 2 features (player list, metrics, etc)
3. [ ] Deploy to production (see `LIVE_CONSOLE_SETUP.md`)
4. [ ] Get user feedback

### If Something Breaks 🔴

1. [ ] Check logs in both terminals
2. [ ] Use troubleshooting guide above
3. [ ] Check GitHub issues for similar problems
4. [ ] Create a detailed bug report with:
   - [ ] Exact error message
   - [ ] Steps to reproduce
   - [ ] Browser and OS version
   - [ ] Backend/Frontend logs
   - [ ] Screenshots

---

## Production Deployment Checklist

When ready to deploy to production:

### Before Deployment

- [ ] Test all features in staging environment
- [ ] Set `NODE_ENV=production` in backend
- [ ] Generate new `JWT_SECRET` (secure random value)
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable HTTPS/WSS
- [ ] Set up reverse proxy (nginx)
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates

### Deployment Commands

```bash
# Backend
cd backend
npm install --production
NODE_ENV=production npm start

# Frontend
npm run build
# Serve dist/ folder with web server
```

### Post-Deployment

- [ ] Test WebSocket from production domain
- [ ] Verify HTTPS is enforced
- [ ] Check CORS allows production origin
- [ ] Monitor server logs for errors
- [ ] Set up log rotation
- [ ] Configure alerts for failures

---

## Team Onboarding

If you're adding this to your team:

1. **Share Documentation**
   - `LIVE_CONSOLE_VISUAL_GUIDE.md` (designers)
   - `LIVE_CONSOLE_IMPLEMENTATION_SUMMARY.md` (managers)
   - `LIVE_CONSOLE_SETUP.md` (developers)
   - `LIVE_CONSOLE_QUICK_REFERENCE.md` (advanced devs)

2. **Conduct Demo**
   - Show console streaming live
   - Show power controls working
   - Show error handling
   - Answer questions

3. **Set Up Development Environment**
   - Help each dev set up backend + frontend locally
   - Pair program for first feature
   - Review their code

4. **Create Team Guidelines**
   - How to extend the console
   - Code review standards
   - Testing requirements
   - Documentation expectations

---

## Success Criteria ✅

Your Live Console is ready when:

- [x] WebSocket connects without errors
- [x] Console output streams in real-time
- [x] Power buttons work and update status
- [x] Error messages are clear
- [x] Mobile layout is responsive
- [x] Performance is smooth (60 FPS)
- [x] Documentation is complete
- [x] Team understands the system
- [x] Users are happy with the feature

---

## Celebrate! 🎉

You've successfully implemented a professional Live Console feature!

Your users can now manage their Minecraft servers with the same power and elegance as enterprise hosting platforms.

**Ship it with confidence!** 🚀

---

**For questions or issues, consult:**
1. `LIVE_CONSOLE_SETUP.md` - Troubleshooting section
2. Browser DevTools Console - For frontend errors
3. Backend logs - For server errors
4. GitHub Issues - For known problems

**Happy hosting!** 🎮
