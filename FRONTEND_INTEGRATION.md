# 🎨 Frontend Integration Guide - Connecting Dashboard to Backend

## What You're About to Do

You have a beautiful Dashboard UI sitting on the frontend, and a fully functional backend API waiting on `localhost:5000`. Now we're going to **connect them** so data actually flows between them.

---

## 📦 Step 1: Setup Frontend Dependencies

Make sure your React frontend has the necessary tools:

```bash
cd ..  # Go to project root
npm install axios  # Or use fetch (built-in)
# OR if using a specific frontend directory
cd src
npm install axios
```

**Why axios?** It's simpler than fetch for adding headers repeatedly.

---

## 🔐 Step 2: Create an Auth API Service

Create `src/services/authService.js`:

```javascript
const API_BASE = 'http://localhost:5000/api';

export const authService = {
  register: async (email, username, password) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getToken: () => localStorage.getItem('authToken'),
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};
```

---

## 🌍 Step 3: Create a Server API Service

Create `src/services/serverService.js`:

```javascript
const API_BASE = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const serverService = {
  // Get all servers for logged-in user
  getServers: async () => {
    const response = await fetch(`${API_BASE}/servers`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Get a specific server by ID
  getServer: async (id) => {
    const response = await fetch(`${API_BASE}/servers/${id}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Create a new server
  createServer: async (serverData) => {
    const response = await fetch(`${API_BASE}/servers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(serverData)
    });
    return response.json();
  },

  // Update a server
  updateServer: async (id, updates) => {
    const response = await fetch(`${API_BASE}/servers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  // Delete a server
  deleteServer: async (id) => {
    const response = await fetch(`${API_BASE}/servers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};
```

---

## 🔑 Step 4: Create Auth Context

Create `src/context/AuthContext.jsx`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const register = async (email, username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(email, username, password);
      
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
      } else {
        throw new Error(data.message || 'Registration failed');
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
      const data = await authService.login(email, password);
      
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    authService.logout();
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 🛡️ Step 5: Create Protected Route Component

Create `src/components/ProtectedRoute.jsx`:

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
```

---

## 🔓 Step 6: Create Login Page

Create `src/pages/LoginPage.jsx`:

```javascript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard'); // Redirect to dashboard after login
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>LightNode</h1>
        <h2>Sign In</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="signup-link">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}
```

Create `src/pages/LoginPage.css`:

```css
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-card h1 {
  margin: 0 0 0.5rem 0;
  color: #667eea;
  font-size: 1.8rem;
}

.login-card h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  border-left: 4px solid #c33;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #eee;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background: #f9f9f9;
  color: #999;
  cursor: not-allowed;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 1rem;
}

.login-button:hover:not(:disabled) {
  background: #5568d3;
}

.login-button:disabled {
  background: #999;
  cursor: not-allowed;
}

.signup-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.signup-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.signup-link a:hover {
  text-decoration: underline;
}
```

---

## 📝 Step 7: Create Register Page

Create `src/pages/RegisterPage.jsx`:

```javascript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>LightNode</h1>
        <h2>Create Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength="8"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
```

Create `src/pages/RegisterPage.css`:

```css
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 450px;
}

.register-card h1 {
  margin: 0 0 0.5rem 0;
  color: #667eea;
  font-size: 1.8rem;
}

.register-card h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  border-left: 4px solid #c33;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #eee;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background: #f9f9f9;
  color: #999;
  cursor: not-allowed;
}

.register-button {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 1rem;
}

.register-button:hover:not(:disabled) {
  background: #5568d3;
}

.register-button:disabled {
  background: #999;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}
```

---

## 📊 Step 8: Update Dashboard to Fetch Real Data

Update `src/components/Dashboard.jsx`:

```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { serverService } from '../services/serverService';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const data = await serverService.getServers();
      setServers(data.servers || []);
    } catch (err) {
      setError('Failed to load servers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const newServer = {
        name: formData.get('name'),
        ipAddress: formData.get('ipAddress'),
        port: parseInt(formData.get('port')),
        memory: parseInt(formData.get('memory')),
        diskSpace: parseInt(formData.get('diskSpace'))
      };
      
      await serverService.createServer(newServer);
      setShowCreateForm(false);
      e.target.reset();
      await fetchServers();
    } catch (err) {
      setError('Failed to create server');
      console.error(err);
    }
  };

  const handleDeleteServer = async (serverId) => {
    if (confirm('Are you sure you want to delete this server?')) {
      try {
        await serverService.deleteServer(serverId);
        await fetchServers();
      } catch (err) {
        setError('Failed to delete server');
        console.error(err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>LightNode Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.username}!</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav>
            <button className="nav-item active">Servers</button>
            <button className="nav-item">Settings</button>
            <button className="nav-item">Billing</button>
          </nav>
        </aside>

        {/* Servers Section */}
        <main className="main-content">
          {error && <div className="error-banner">{error}</div>}

          <div className="servers-header">
            <h2>Your Servers ({servers.length})</h2>
            <button 
              className="create-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              + New Server
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateServer} className="create-form">
              <h3>Create New Server</h3>
              <div className="form-grid">
                <input type="text" name="name" placeholder="Server Name" required />
                <input type="text" name="ipAddress" placeholder="IP Address" required />
                <input type="number" name="port" placeholder="Port" defaultValue="25565" />
                <input type="number" name="memory" placeholder="Memory (MB)" required />
                <input type="number" name="diskSpace" placeholder="Disk Space (GB)" required />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Create</button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="loading">Loading servers...</div>
          ) : servers.length === 0 ? (
            <div className="empty-state">
              <p>No servers yet. Create your first server to get started!</p>
            </div>
          ) : (
            <div className="servers-grid">
              {servers.map(server => (
                <div key={server.id} className="server-card">
                  <div className="card-header">
                    <h3>{server.name}</h3>
                    <span className={`status-badge ${server.status}`}>
                      {server.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>IP:</strong> {server.ipAddress}:{server.port}</p>
                    <p><strong>Memory:</strong> {server.memory}MB</p>
                    <p><strong>Disk:</strong> {server.diskSpace}GB</p>
                    <p><strong>UUID:</strong> {server.uuid.substring(0, 8)}...</p>
                  </div>
                  <div className="card-actions">
                    <button className="btn-sm btn-primary">Start</button>
                    <button className="btn-sm btn-secondary">Settings</button>
                    <button 
                      className="btn-sm btn-danger"
                      onClick={() => handleDeleteServer(server.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

## 🔧 Step 9: Update App.jsx with Routing

Update `src/App.jsx`:

```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🎬 Running Everything

### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```

### Terminal 2: Start Frontend
```bash
cd frontend  # or wherever your React app is
npm run dev
```

### Test the Flow
1. Open `http://localhost:5173` (or your frontend port)
2. Click "Sign up" and create an account
3. You'll be redirected to the dashboard
4. Click "+ New Server" to create a test server
5. Watch the data appear in your dashboard!

---

## 🎉 You Now Have...

✅ User authentication with login/signup  
✅ Protected dashboard routes  
✅ Real database storage  
✅ CRUD operations for servers  
✅ JWT token management  
✅ Error handling  
✅ Loading states  

**Your "nervous system" is now wired to your "face"!**

