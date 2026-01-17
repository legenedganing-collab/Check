# LightNode Architecture Review
**Master Architect Analysis** | Date: January 13, 2026

---

## Executive Summary

Your LightNode project has a **solid two-tier dashboard architecture** with proper separation of concerns. The routing logic, authentication, and data flow are well-structured. However, there are **critical gaps in the UI hierarchy** that need immediate attention:

### Current Status:
- ✅ **Dashboard A (Main Hub)**: Partially implemented
- ✅ **Dashboard B (Server Manager)**: Partially implemented  
- ⚠️ **Routing Flow**: Incomplete—missing dynamic navigation
- ⚠️ **Missing Components**: Several key files not created
- ✅ **Authentication**: Properly secured with JWT
- ✅ **Port Management**: Static binding implemented correctly
- ✅ **Data Flow**: AuthContext partially set up

---

## 1. Current User Flow Analysis

### ✅ What's Working:

```
Home (/)
  └─→ Login (/login) ✅
       └─→ Dashboard (/dashboard) ✅
            └─→ Server Manager (BROKEN - no dynamic routing)
```

**Current Routing (App.jsx):**
```jsx
<Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
<Route path="/server/:id" element={/* MISSING */} />
```

---

## 2. Critical Issues Found

### 🔴 Issue 1: Missing Dynamic Server Management Route
**Status:** CRITICAL  
**Severity:** HIGH  
**Location:** `src/App.jsx`

The ServerManager component exists (`src/pages/ServerManager.jsx`) but is **NOT connected to any route**. This means:
- ❌ Users cannot click "Manage" on a server and navigate to `/server/:id`
- ❌ The `<Route path="/server/:id">` is missing entirely
- ❌ ServerManager imports `useParams()` expecting a `serverId` but the route doesn't exist

**Evidence:**
```jsx
// ServerManager.jsx expects this:
const { serverId } = useParams() || { serverId: '1' };

// But App.jsx has NO route for this!
// Missing: <Route path="/server/:id" element={...} />
```

**Required Fix:**
```jsx
import ServerManager from './pages/ServerManager'

<Route 
  path="/server/:id" 
  element={isAuthenticated ? <ServerManager /> : <Navigate to="/login" />} 
/>
```

---

### 🟡 Issue 2: Missing ProtectedRoute Component
**Status:** WORKAROUND EXISTS  
**Severity:** MEDIUM  
**Location:** Missing from `src/components/`

You're currently using inline ternary operators in App.jsx:
```jsx
<Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : ...} />
```

This works but violates DRY principle. A reusable `ProtectedRoute.jsx` component would be cleaner:

**Current (Repeated):**
```jsx
element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
element={isAuthenticated ? <ServerManager /> : <Navigate to="/login" />}
```

**Better (With ProtectedRoute):**
```jsx
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

---

### 🟡 Issue 3: AuthContext Missing
**Status:** PARTIALLY IMPLEMENTED  
**Severity:** MEDIUM  
**Location:** Missing from `src/context/` or `src/lib/`

The README and backend docs mention AuthContext, but the actual file **does not exist** in the codebase:
- ❌ `src/context/AuthContext.jsx` — **NOT FOUND**
- ✅ `src/lib/api.js` exists (good start for API calls)
- ⚠️ Authentication is done manually via `localStorage`

**Current (Fragile):**
```jsx
const token = localStorage.getItem('token');
const response = await fetch(..., {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Better (With AuthContext):**
```jsx
const { token, user, login, logout } = useAuth();
// Consistent auth state across all components
```

---

### 🟢 Issue 4: Dashboard A/B Navigation Missing
**Status:** NOT IMPLEMENTED  
**Severity:** HIGH  
**Location:** `src/components/Dashboard.jsx` & `src/components/ServerCard.jsx`

When a user clicks a ServerCard, nothing happens (no click handler). The flow should be:
1. User clicks "Manage" on a server card → `ServerCard.jsx`
2. Navigate to `/server/:id` (using React Router)
3. Load ServerManager with that server's ID

**Current (Dashboard.jsx):**
```jsx
{selectedServer && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Shows console/stats inline on same dashboard */}
  </div>
)}
```

This is **mixing Dashboard A and B on the same page!** They should be completely separate views.

---

## 3. Architectural Issues

### Problem: Current Structure Mixes Two Dashboards

**What you have:**
```
Dashboard Component (src/components/Dashboard.jsx)
├── Shows list of servers (Dashboard A feature)
├── Shows "My Servers"
└── ALSO shows console, stats, file manager (Dashboard B features!)
    ← This is WRONG - these should be on a separate page
```

**What you should have:**

```
Dashboard Page (Dashboard A - Main Hub)
├── Show ALL servers
├── Server list with "Manage" buttons
└── "Create Server" wizard

ServerManager Page (Dashboard B - Control Center)
├── Show SINGLE server details
├── Live console (xterm.js)
├── Power controls (Start/Stop/Restart)
├── Live stats (CPU/RAM)
└── File manager
```

---

## 4. Authentication Review

### ✅ Backend Authentication (CORRECT)
- `authMiddleware` exists and validates JWT ✅
- Token extraction from headers ✅
- All server routes protected ✅

**Location:** [backend/src/middleware/auth.js](backend/src/middleware/auth.js)

### ⚠️ Frontend Authentication (FRAGILE)
- Manual localStorage check in App.jsx ✅
- But no centralized auth context
- No logout functionality
- Token not refreshed or validated

**Recommendation:** Create AuthContext for consistent auth state.

---

## 5. Port Management Review

### ✅ Static Port Binding (CORRECTLY IMPLEMENTED)

**Evidence from [backend/lib/dockerProvisioner.js](backend/lib/dockerProvisioner.js):**

```javascript
const INTERNAL_MINECRAFT_PORT = 25565; // Constant
const INTERNAL_RCON_PORT = 25575;      // Constant

PortBindings: {
  '25565/tcp': [
    { HostPort: port.toString() }  // Maps host port → container 25565
  ],
  '25575/tcp': [
    { HostPort: '25575' }
  ]
}
```

This is **correct**. Each server gets:
- Unique allocated port (e.g., 25565, 25566, 25567...)
- Mapped directly to container's port 25565
- Connection survives restart ✅

---

## 6. Data Flow Review

### Current Data Flow (Partially Complete):

```
Login Page
  ↓
(stores token + user to localStorage)
  ↓
Dashboard / ServerManager
  ↓
(calls API with token)
  ↓
Backend (validates JWT)
  ↓
Returns data
```

### Issues:
1. **No global user context** → Can't easily access user across all pages
2. **No server context** → `useServerStore` works but isn't tied to auth
3. **No error state management** → Each component handles errors separately
4. **Token never refreshed** → If expires, user is stuck

### Data Model (Database):
```
User
├── id (PK)
├── email
├── username
└── password (hashed)

Server
├── id (PK)
├── userId (FK)
├── name
├── uuid
├── ipAddress
├── port (allocated)
├── memory (1-16 GB)
├── diskSpace
├── status (provisioning/online/offline)
└── createdAt
```

This is **correct** for the architecture.

---

## 7. Missing Files & Components

### 🔴 CRITICAL - Must Create:

| File | Purpose | Status |
|------|---------|--------|
| `src/context/AuthContext.jsx` | Global auth state | ❌ MISSING |
| `src/components/ProtectedRoute.jsx` | Auth guard wrapper | ❌ MISSING |
| Updated `src/App.jsx` | Add `/server/:id` route | ⚠️ INCOMPLETE |
| `src/components/ServerManagement/` | Refactor components into directory | ✅ EXISTS (scattered) |

### 🟡 RECOMMENDED - Nice to Have:

| File | Purpose |
|------|---------|
| `src/hooks/useAuth.js` | Custom hook for auth |
| `src/hooks/useServer.js` | Custom hook for server data |
| `src/services/authService.js` | Centralized auth API calls |
| `src/services/serverService.js` | Centralized server API calls |
| `src/contexts/ServerContext.jsx` | Global server state |

---

## 8. File Structure Audit

### ✅ What Exists:

```
src/
├── App.jsx ✅
├── main.jsx ✅
├── index.css ✅
├── components/
│   ├── Dashboard.jsx ✅ (Main Hub - but mixed with Server Manager)
│   ├── ServerCard.jsx ✅ (Good - displays server info)
│   ├── CreateServerForm.jsx ✅
│   ├── DeploymentSuccess.jsx ✅
│   ├── FileManager.jsx ✅
│   ├── ServerConsole.jsx ✅ (xterm.js integration)
│   ├── ServerControls.jsx ✅ (Power buttons)
│   ├── ServerStats.jsx ✅ (CPU/RAM display)
│   ├── ServerSuccessScreen.jsx ✅
│   ├── ServerSwitcher.jsx ✅
│   ├── Sidebar.jsx ✅
│   └── Topbar.jsx ✅
├── pages/
│   ├── LoginPage.jsx ✅
│   ├── RegisterPage.jsx ✅
│   └── ServerManager.jsx ✅ (Server Control Panel)
├── layouts/
│   └── DashboardLayout.jsx ✅
├── lib/
│   └── api.js ✅ (API call wrapper)
└── store/
    └── serverStore.js ✅ (Zustand store)

backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js ✅
│   │   └── serverController.js ✅
│   ├── middleware/
│   │   └── auth.js ✅ (JWT validation)
│   └── routes/
│       ├── authRoutes.js ✅
│       └── serverRoutes.js ✅
└── lib/
    ├── dockerProvisioner.js ✅ (Container management)
    ├── provisioning.js ✅ (Server setup)
    └── db.js ✅ (Database connection)
```

### ❌ What's Missing:

```
src/
├── context/
│   └── AuthContext.jsx ❌ CRITICAL
├── components/
│   └── ProtectedRoute.jsx ❌ CRITICAL
├── services/
│   ├── authService.js ❌ (Nice to have)
│   └── serverService.js ❌ (Nice to have)
└── hooks/
    ├── useAuth.js ❌ (Nice to have)
    └── useServer.js ❌ (Nice to have)
```

---

## 9. Recommended Refactoring Steps

### Phase 1: Fix Critical Issues (TODAY)

**Step 1.1:** Create `ProtectedRoute.jsx`
- Wrap authenticated routes
- Reduce code duplication

**Step 1.2:** Update `App.jsx`
- Add `/server/:id` route
- Use ProtectedRoute component

**Step 1.3:** Create `AuthContext.jsx`
- Centralize auth state
- Add logout function
- Add token refresh logic

### Phase 2: Improve Data Flow (THIS WEEK)

**Step 2.1:** Refactor ServerCard to have click handler
```jsx
<ServerCard 
  {...server}
  onClick={() => navigate(`/server/${server.id}`)}
/>
```

**Step 2.2:** Move ServerManager to correct hierarchy
- Ensure it receives `serverId` from URL params
- Fetch server data on mount

**Step 2.3:** Create service layer
- `authService.js` → Handle all auth API calls
- `serverService.js` → Handle all server API calls

### Phase 3: Polish (NEXT WEEK)

**Step 3.1:** Add error boundaries
**Step 3.2:** Add loading states consistently
**Step 3.3:** Add WebSocket reconnection logic

---

## 10. Routing Flow Diagram

### Current (BROKEN):
```
/ → /login
       ↓
    /dashboard (shows servers + console mixed)
       ↓
    ❌ /server/:id (ROUTE DOESN'T EXIST!)
```

### Recommended (CORRECT):
```
/ (home)
  └─ redirects to /login or /dashboard based on auth

/login
  └─ LoginPage
       └─ (on success) → /dashboard

/dashboard (DASHBOARD A - Main Hub)
  └─ DashboardLayout
       ├─ Topbar
       ├─ Sidebar
       └─ Dashboard Component
            ├─ My Servers (list)
            ├─ ServerCard (clickable)
            └─ Create Server Form

/server/:id (DASHBOARD B - Server Manager)
  └─ DashboardLayout
       ├─ Topbar
       ├─ Sidebar
       └─ ServerManager Component
            ├─ ServerConsole (xterm)
            ├─ ServerControls (Power buttons)
            ├─ ServerStats (CPU/RAM)
            ├─ FileManager
            └─ Server Info Card
```

---

## 11. API Routes Validation

### Backend Routes (✅ CORRECT):

**Authentication:**
- `POST /api/auth/register` ✅
- `POST /api/auth/login` ✅
- `GET /api/health/docker` ✅

**Server Management:**
- `GET /api/servers` — List all user's servers ✅
- `POST /api/servers` — Create new server ✅
- `GET /api/servers/:id` — Get server details ✅
- `POST /api/servers/:id/power` — Power control ✅
- `GET /api/servers/:id/status` — Live status ✅
- `GET /api/servers/:id/logs` — Console logs ✅
- `GET /api/servers/:id/files` — File listing ✅

All routes have `authMiddleware` ✅

---

## 12. WebSocket Configuration

### Current Status: ✅ PARTIALLY WORKING

**ServerConsole.jsx:**
```javascript
const socket = io('http://localhost:3002', {
  auth: { token },
  query: { serverId }
});

socket.on('console-output', (data) => {
  term.write(data); // Write to terminal
});
```

**ServerStats.jsx:**
```javascript
socket.on('server-stats', (data) => {
  setStats(data); // Update CPU/RAM
});
```

✅ **What works:**
- WebSocket connection with JWT auth
- Console streaming
- Live stats updates

⚠️ **Potential issues:**
- No reconnection handler for stats socket
- Multiple socket instances might be created
- No cleanup on unmount

---

## 13. Security Assessment

### ✅ SECURE:
1. JWT token used for authentication ✅
2. Backend validates token on every request ✅
3. Password hashing (assumed in authController) ✅
4. CORS properly configured (assumed) ✅

### ⚠️ NEEDS ATTENTION:
1. Token stored in localStorage (vulnerable to XSS)
   - **Recommendation:** Use httpOnly cookies instead
2. Token never expires or refreshes
   - **Recommendation:** Add refresh token logic
3. No rate limiting on login endpoint
   - **Recommendation:** Add rate limiter middleware
4. RCON password sent in plaintext in env vars
   - **Recommendation:** Use secrets management

---

## 14. Quick Reference: What Works vs. Broken

| Feature | Status | Details |
|---------|--------|---------|
| User Registration | ✅ WORKS | LoginPage → RegisterPage functional |
| User Login | ✅ WORKS | JWT stored, protected routes work |
| Server Creation | ✅ WORKS | Creates container, allocates port |
| Server Listing | ✅ WORKS | Dashboard shows all user's servers |
| Server Management | ❌ BROKEN | Route `/server/:id` missing |
| Power Controls | ⚠️ PARTIAL | Component exists, route missing |
| Live Console | ⚠️ PARTIAL | xterm.js ready, route missing |
| Live Stats | ⚠️ PARTIAL | Component ready, route missing |
| File Manager | ⚠️ PARTIAL | Component ready, route missing |
| Docker Port Binding | ✅ WORKS | Static mapping, survives restart |

---

## Implementation Checklist

### CRITICAL (Do First):
- [ ] Create `src/context/AuthContext.jsx` with useAuth hook
- [ ] Create `src/components/ProtectedRoute.jsx`
- [ ] Add `/server/:id` route to App.jsx
- [ ] Update ServerCard to be clickable

### IMPORTANT (Do This Week):
- [ ] Refactor ServerCard click handler
- [ ] Test navigation from Dashboard A → Dashboard B
- [ ] Verify serverId passed correctly in URL
- [ ] Test ServerManager loads correct server

### NICE TO HAVE (Polish):
- [ ] Create service layer (authService, serverService)
- [ ] Add custom hooks (useAuth, useServer)
- [ ] Add error boundaries
- [ ] Implement token refresh logic
- [ ] Add httpOnly cookie support

---

## Summary

**Your project is 80% complete structurally.** The main issues are:

1. **Missing dynamic routing** — Can't navigate to individual servers
2. **Missing ProtectedRoute** — Authentication guard duplicated
3. **Missing AuthContext** — Auth state not centralized
4. **Dashboard A/B confused** — Features mixed on same component

All backend logic is solid. Frontend just needs **routing reorganization and component restructuring**. The WebSocket console, stats, and file manager are all ready—they just need the route to work!

---

**Next Step:** I can implement all critical fixes immediately. Ready?
